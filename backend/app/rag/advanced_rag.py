import re
import math
import asyncio
import numpy as np
from typing import List, Dict, Any, Tuple, Optional
from collections import Counter
from app.rag.llm_client import llm_client
from app.db.database import get_all_chunks, insert_chunk, insert_document
from app.engine.vector_engine import HNSWIndex, get_dist_fn

def recursive_chunk_text(text: str, chunk_size: int = 350, overlap: int = 50) -> List[str]:
    """Chunks text preserving paragraphs and sentence boundaries where possible."""
    clean_text = re.sub(r'\s+', ' ', text).strip()
    if len(clean_text) <= chunk_size:
        return [clean_text]

    chunks = []
    start = 0
    while start < len(clean_text):
        end = start + chunk_size
        if end >= len(clean_text):
            chunks.append(clean_text[start:])
            break

        # Look for sentence boundary near end
        split_idx = clean_text.rfind('. ', start + chunk_size // 2, end)
        if split_idx == -1:
            split_idx = clean_text.rfind(' ', start + chunk_size // 2, end)
        if split_idx == -1:
            split_idx = end

        chunks.append(clean_text[start:split_idx].strip())
        start = max(start + 1, split_idx - overlap)
    return [c for c in chunks if len(c) > 10]


class BM25Index:
    def __init__(self, k1: float = 1.5, b: float = 0.75):
        self.k1 = k1
        self.b = b
        self.doc_ids: List[int] = []
        self.doc_lens: List[int] = []
        self.avgdl: float = 0.0
        self.term_freqs: List[Counter] = []
        self.doc_freqs: Dict[str, int] = Counter()
        self.N: int = 0

    def _tokenize(self, text: str) -> List[str]:
        return re.findall(r'\w+', text.lower())

    def build(self, chunks: List[Dict[str, Any]]):
        self.doc_ids = []
        self.doc_lens = []
        self.term_freqs = []
        self.doc_freqs = Counter()
        self.N = len(chunks)

        if self.N == 0:
            self.avgdl = 0
            return

        total_len = 0
        for c in chunks:
            self.doc_ids.append(c["id"])
            tokens = self._tokenize(c["text"] + " " + c.get("title", ""))
            doc_len = len(tokens)
            self.doc_lens.append(doc_len)
            total_len += doc_len
            tf = Counter(tokens)
            self.term_freqs.append(tf)
            for word in tf.keys():
                self.doc_freqs[word] += 1

        self.avgdl = total_len / max(1, self.N)

    def search(self, query: str, top_k: int = 10) -> List[Tuple[float, int]]:
        tokens = self._tokenize(query)
        if not tokens or self.N == 0:
            return []

        scores: List[Tuple[float, int]] = []
        for i, doc_id in enumerate(self.doc_ids):
            score = 0.0
            doc_len = self.doc_lens[i]
            tf_map = self.term_freqs[i]

            for t in tokens:
                if t in tf_map:
                    df = self.doc_freqs.get(t, 0)
                    # IDF with standard smoothing
                    idf = math.log((self.N - df + 0.5) / (df + 0.5) + 1.0)
                    freq = tf_map[t]
                    numerator = freq * (self.k1 + 1.0)
                    denominator = freq + self.k1 * (1.0 - self.b + self.b * (doc_len / max(1.0, self.avgdl)))
                    score += idf * (numerator / denominator)

            if score > 0.001:
                scores.append((score, doc_id))

        scores.sort(reverse=True)
        return scores[:top_k]


class AdvancedRAGPipeline:
    def __init__(self):
        self.bm25 = BM25Index()
        self.hnsw = HNSWIndex(M=16, ef_construction=64, ef_search=32)
        self.chunks_cache: Dict[int, Dict[str, Any]] = {}
        self.is_initialized = False

    async def reload_index(self):
        chunks = await get_all_chunks()
        self.chunks_cache = {c["id"]: c for c in chunks}
        self.bm25.build(chunks)
        
        # Build HNSW for chunks
        self.hnsw = HNSWIndex(M=16, ef_construction=64, ef_search=32)
        dist_fn = get_dist_fn("cosine")
        for c in chunks:
            emb = np.array(c["embedding"], dtype=np.float32)
            self.hnsw.insert(c["id"], c["title"], "document", emb, dist_fn)
        self.is_initialized = True

    async def ingest_document(self, title: str, text: str, tags: str = "general") -> int:
        doc_id = await insert_document(title, text, tags)
        chunks = recursive_chunk_text(text)
        if not chunks:
            return doc_id

        # Concurrent bounded embedding (up to 8 parallel workers)
        semaphore = asyncio.Semaphore(8)
        async def embed_chunk(chunk_str: str):
            async with semaphore:
                return await llm_client.embed(chunk_str)

        embeddings = await asyncio.gather(*(embed_chunk(c) for c in chunks))

        dist_fn = get_dist_fn("cosine")
        for idx, (chunk_str, emb) in enumerate(zip(chunks, embeddings)):
            chunk_title = f"{title} [{idx + 1}/{len(chunks)}]" if len(chunks) > 1 else title
            chunk_id = await insert_chunk(doc_id, idx, chunk_title, chunk_str, emb)
            chunk_obj = {
                "id": chunk_id,
                "doc_id": doc_id,
                "chunk_index": idx,
                "title": chunk_title,
                "text": chunk_str,
                "embedding": emb
            }
            self.chunks_cache[chunk_id] = chunk_obj
            self.hnsw.insert(chunk_id, chunk_title, "document", np.array(emb, dtype=np.float32), dist_fn)

        # Update BM25 with all current chunks in memory
        self.bm25.build(list(self.chunks_cache.values()))
        self.is_initialized = True
        return doc_id

    def reciprocal_rank_fusion(self, dense_results: List[Tuple[float, int]], sparse_results: List[Tuple[float, int]], k_rrf: int = 60) -> List[Tuple[float, int]]:
        """Combines Dense Vector and Sparse BM25 ranks using RRF."""
        scores: Dict[int, float] = {}

        # Dense rank (lower distance is better, index 0 is best)
        for rank, (_, doc_id) in enumerate(dense_results):
            scores[doc_id] = scores.get(doc_id, 0.0) + 1.0 / (k_rrf + rank + 1)

        # Sparse rank (higher score is better, index 0 is best)
        for rank, (_, doc_id) in enumerate(sparse_results):
            scores[doc_id] = scores.get(doc_id, 0.0) + 1.0 / (k_rrf + rank + 1)

        combined = [(score, doc_id) for doc_id, score in scores.items()]
        combined.sort(key=lambda x: x[0], reverse=True)
        return combined

    def contextual_rerank(self, query: str, candidates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Reranks candidates using semantic term cross-relevance scoring."""
        q_tokens = set(re.findall(r'\w+', query.lower()))
        reranked = []

        for cand in candidates:
            text = cand["text"].lower()
            tokens = re.findall(r'\w+', text)
            token_set = set(tokens)
            
            # Exact token overlap
            overlap = len(q_tokens.intersection(token_set)) / max(1, len(q_tokens))
            
            # Distance penalty
            dist = cand.get("distance", 0.5)
            dist_score = max(0.0, 1.0 - dist)
            
            # Combined rerank score
            score = (0.55 * dist_score) + (0.45 * overlap)
            cand["rerank_score"] = round(score, 4)
            reranked.append(cand)

        reranked.sort(key=lambda x: x["rerank_score"], reverse=True)
        return reranked

    async def generate_hyde_passage(self, question: str) -> Optional[str]:
        """Generates a hypothetical document passage to improve semantic retrieval."""
        hyde_prompt = (
            f"Please write a concise scientific or factual passage answering the question: '{question}'. "
            f"Include realistic terminology, technical details, and definitions."
        )
        tokens = []
        async for token in llm_client.generate_stream(hyde_prompt):
            tokens.append(token)
            if len("".join(tokens)) > 300: # Keep hypothetical passage concise
                break
        return "".join(tokens) if tokens else None

    async def retrieve(
        self,
        question: str,
        k: int = 4,
        use_hybrid: bool = True,
        use_rerank: bool = True,
        use_hyde: bool = False
    ) -> Tuple[List[Dict[str, Any]], Optional[str]]:
        if not self.is_initialized:
            await self.reload_index()

        hyde_text = None
        search_query = question

        if use_hyde:
            generated = await self.generate_hyde_passage(question)
            if generated:
                hyde_text = generated
                search_query = f"{question}\n{generated}"

        # 1. Dense retrieval via HNSW
        q_emb = await llm_client.embed(search_query)
        dist_fn = get_dist_fn("cosine")
        dense_hits = self.hnsw.knn(np.array(q_emb, dtype=np.float32), k=max(k * 2, 8), dist_fn=dist_fn)

        candidates: List[Dict[str, Any]] = []

        if use_hybrid:
            # 2. Sparse retrieval via BM25
            sparse_hits = self.bm25.search(question, top_k=max(k * 2, 8))
            fused = self.reciprocal_rank_fusion(dense_hits, sparse_hits)
            
            # Map back to chunk data
            for score, chunk_id in fused[:k * 2]:
                if chunk_id in self.chunks_cache:
                    c = dict(self.chunks_cache[chunk_id])
                    # Find distance if present in dense_hits
                    d_map = {d_id: dist for dist, d_id in dense_hits}
                    c["distance"] = round(d_map.get(chunk_id, 0.45), 4)
                    c["rrf_score"] = round(score, 5)
                    candidates.append(c)
        else:
            for dist, chunk_id in dense_hits:
                if chunk_id in self.chunks_cache:
                    c = dict(self.chunks_cache[chunk_id])
                    c["distance"] = round(dist, 4)
                    candidates.append(c)

        # 3. Contextual Reranking
        if use_rerank and candidates:
            final_hits = self.contextual_rerank(question, candidates)[:k]
        else:
            final_hits = candidates[:k]

        return final_hits, hyde_text

rag_pipeline = AdvancedRAGPipeline()
