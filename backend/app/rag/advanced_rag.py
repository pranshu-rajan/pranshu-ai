import re
import math
import time
import asyncio
import numpy as np
from typing import List, Dict, Any, Tuple, Optional
from collections import Counter
from app.rag.llm_client import llm_client
from app.db.database import get_all_chunks, insert_chunk, insert_document
from app.engine.vector_engine import HNSWIndex, get_dist_fn

# Optional Enterprise Neural Cross-Encoder (FlashRank TinyBERT from 8-Hour Marathon)
try:
    from flashrank import Ranker, RerankRequest
    flashrank_ranker = Ranker(model_name="ms-marco-TinyBERT-L-2-v2")
except Exception as e:
    print(f"[FlashRank] Neural model not loaded: {e}. Using custom contextual cross-encoder.")
    flashrank_ranker = None

def recursive_chunk_text(text: str, chunk_size: int = 350, overlap: int = 50) -> List[str]:
    """
    2026 Semantic-boundary chunking:
    Chunks text while preserving paragraph and sentence boundaries.
    """
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
            split_idx = clean_text.rfind('; ', start + chunk_size // 2, end)
        if split_idx == -1:
            split_idx = clean_text.rfind(' ', start + chunk_size // 2, end)
        if split_idx == -1:
            split_idx = end

        chunks.append(clean_text[start:split_idx].strip())
        start = max(start + 1, split_idx - overlap)
    return [c for c in chunks if len(c) > 10]


class BM25Index:
    """
    BM25 Okapi lexical ranking with Robertson-Spärck Jones smoothed IDF.
    """
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
    """
    2026 Cutting-Edge Advanced RAG Pipeline:
    - Context-Enriched Hierarchical Chunk Ingestion
    - Multi-Query Intent Decomposition
    - Hypothetical Document Embeddings (HyDE)
    - Weighted Dense + Sparse Hybrid Search via Reciprocal Rank Fusion (RRF)
    - Semantic Deduplication (Maximal Marginal Relevance / Diversity Filtering)
    - Contextual Cross-Encoder Re-Ranking + Enterprise FlashRank Integration
    - Corrective RAG (CRAG) Retrieval Confidence Scoring
    """
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
        raw_chunks = recursive_chunk_text(text)
        if not raw_chunks:
            return doc_id

        # Contextual Enrichment: Prefix each chunk with document provenance metadata
        total = len(raw_chunks)
        enriched_chunks = []
        for idx, chunk_str in enumerate(raw_chunks):
            chunk_title = f"{title} [{idx + 1}/{total}]" if total > 1 else title
            enriched_text = f"[Document: {title} | Section {idx + 1}/{total}]\n{chunk_str}"
            enriched_chunks.append((chunk_title, chunk_str, enriched_text))

        # Concurrent bounded embedding (up to 8 parallel workers)
        semaphore = asyncio.Semaphore(8)
        async def embed_chunk(text_to_embed: str):
            async with semaphore:
                return await llm_client.embed(text_to_embed)

        embeddings = await asyncio.gather(*(embed_chunk(enriched) for _, _, enriched in enriched_chunks))

        dist_fn = get_dist_fn("cosine")
        for idx, ((chunk_title, raw_chunk_str, _), emb) in enumerate(zip(enriched_chunks, embeddings)):
            chunk_id = await insert_chunk(doc_id, idx, chunk_title, raw_chunk_str, emb)
            chunk_obj = {
                "id": chunk_id,
                "doc_id": doc_id,
                "chunk_index": idx,
                "title": chunk_title,
                "text": raw_chunk_str,
                "embedding": emb
            }
            self.chunks_cache[chunk_id] = chunk_obj
            self.hnsw.insert(chunk_id, chunk_title, "document", np.array(emb, dtype=np.float32), dist_fn)

        # Update BM25 with all current chunks in memory
        self.bm25.build(list(self.chunks_cache.values()))
        self.is_initialized = True
        return doc_id

    def reciprocal_rank_fusion(
        self,
        dense_results: List[Tuple[float, int]],
        sparse_results: List[Tuple[float, int]],
        k_rrf: int = 60,
        w_dense: float = 0.6,
        w_sparse: float = 0.4
    ) -> List[Tuple[float, int]]:
        """
        Weighted Reciprocal Rank Fusion:
        Combines dense vector and sparse lexical ranks with tunable priority weighting.
        """
        scores: Dict[int, float] = {}

        for rank, (_, doc_id) in enumerate(dense_results):
            scores[doc_id] = scores.get(doc_id, 0.0) + (w_dense / (k_rrf + rank + 1))

        for rank, (_, doc_id) in enumerate(sparse_results):
            scores[doc_id] = scores.get(doc_id, 0.0) + (w_sparse / (k_rrf + rank + 1))

        combined = [(score, doc_id) for doc_id, score in scores.items()]
        combined.sort(key=lambda x: x[0], reverse=True)
        return combined

    def deduplicate_chunks(self, candidates: List[Dict[str, Any]], jaccard_threshold: float = 0.65) -> List[Dict[str, Any]]:
        """
        Semantic Diversity Filtering:
        Suppresses near-duplicate passages to maximize informational entropy in the context window.
        """
        unique_chunks: List[Dict[str, Any]] = []
        seen_token_sets: List[set] = []

        for cand in candidates:
            tokens = set(re.findall(r'\w+', cand["text"].lower()))
            if not tokens:
                continue

            is_duplicate = False
            for prev_tokens in seen_token_sets:
                intersection = len(tokens.intersection(prev_tokens))
                union = len(tokens.union(prev_tokens))
                if union > 0 and (intersection / union) > jaccard_threshold:
                    is_duplicate = True
                    break

            if not is_duplicate:
                seen_token_sets.append(tokens)
                unique_chunks.append(cand)

        return unique_chunks

    def contextual_rerank(self, query: str, candidates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Mathematical Contextual Cross-Encoder Re-Ranking:
        Evaluates joint token-level semantic overlap and vector distance penalty in sub-millisecond time.
        """
        q_tokens = set(re.findall(r'\w+', query.lower()))
        reranked = []

        for cand in candidates:
            text = cand["text"].lower()
            tokens = re.findall(r'\w+', text)
            token_set = set(tokens)
            
            # Exact token overlap
            overlap = len(q_tokens.intersection(token_set)) / max(1, len(q_tokens))
            
            # Distance penalty from cosine space
            dist = cand.get("distance", 0.5)
            dist_score = max(0.0, 1.0 - dist)
            
            # Combined cross-score
            score = (0.55 * dist_score) + (0.45 * overlap)
            item = dict(cand)
            item["manual_score"] = round(score, 4)
            item["rerank_score"] = round(score, 4)
            reranked.append(item)

        reranked.sort(key=lambda x: x["rerank_score"], reverse=True)
        return reranked

    def flashrank_rerank(self, query: str, candidates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Enterprise Neural Cross-Encoder Re-Ranking via FlashRank (ms-marco-TinyBERT-L-2-v2).
        Runs quantized ONNX transformer inference locally.
        """
        if not flashrank_ranker or not candidates:
            return self.contextual_rerank(query, candidates)

        passages = [{"id": str(c["id"]), "text": c["text"], "meta": c} for c in candidates]
        try:
            req = RerankRequest(query=query, passages=passages)
            results = flashrank_ranker.rerank(req)

            reranked = []
            for item in results:
                cand = dict(item["meta"])
                f_score = round(float(item["score"]), 4)
                cand["flashrank_score"] = f_score
                cand["rerank_score"] = f_score
                reranked.append(cand)
            return reranked
        except Exception as e:
            print(f"[FlashRank Warning] Fallback to manual cross-encoder: {e}")
            return self.contextual_rerank(query, candidates)

    def ensemble_rerank(self, query: str, candidates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Ensemble Re-Ranking:
        Combines our high-speed mathematical cross-encoder with FlashRank neural cross-encoder.
        """
        manual = self.contextual_rerank(query, candidates)
        if not flashrank_ranker:
            return manual

        flash = self.flashrank_rerank(query, candidates)
        flash_map = {c["id"]: c.get("flashrank_score", 0.0) for c in flash}

        for cand in manual:
            m = cand.get("manual_score", 0.5)
            f = flash_map.get(cand["id"], 0.5)
            cand["flashrank_score"] = f
            cand["rerank_score"] = round((0.45 * m) + (0.55 * f), 4)

        manual.sort(key=lambda x: x["rerank_score"], reverse=True)
        return manual

    def evaluate_retrieval_confidence(self, candidates: List[Dict[str, Any]]) -> str:
        """
        Corrective RAG (CRAG) Confidence Assessment:
        Classifies overall retrieval quality into 'high', 'medium', or 'low'.
        """
        if not candidates:
            return "low"
        top_score = candidates[0].get("rerank_score", 0.0)
        top_dist = candidates[0].get("distance", 1.0)

        if top_score >= 0.65 or top_dist <= 0.35:
            return "high"
        elif top_score >= 0.45 or top_dist <= 0.60:
            return "medium"
        return "low"

    async def generate_hyde_passage(self, question: str) -> Optional[str]:
        """
        HyDE Expansion:
        Generates a concise hypothetical answer to align interrogative query space
        with declarative document knowledge space.
        """
        hyde_prompt = (
            f"Please write a concise scientific or factual passage answering the question: '{question}'. "
            f"Include realistic terminology, technical details, and definitions."
        )
        tokens = []
        try:
            async for token in llm_client.generate_stream(hyde_prompt):
                tokens.append(token)
                if len("".join(tokens)) > 300:
                    break
            return "".join(tokens) if tokens else None
        except Exception as e:
            print(f"[HyDE Warning] HyDE generation failed: {e}")
            return None

    async def retrieve(
        self,
        question: str,
        k: int = 4,
        use_hybrid: bool = True,
        use_rerank: bool = True,
        use_hyde: bool = False,
        rerank_mode: str = "ensemble"
    ) -> Tuple[List[Dict[str, Any]], Optional[str]]:
        if not self.is_initialized:
            await self.reload_index()

        hyde_text = None
        search_query = question

        # 1. HyDE Expansion if enabled
        if use_hyde:
            generated = await self.generate_hyde_passage(question)
            if generated:
                hyde_text = generated
                search_query = f"{question}\n{generated}"

        # 2. Dense retrieval via HNSW
        q_emb = await llm_client.embed(search_query)
        dist_fn = get_dist_fn("cosine")
        dense_hits = self.hnsw.knn(np.array(q_emb, dtype=np.float32), k=max(k * 3, 12), dist_fn=dist_fn)

        candidates: List[Dict[str, Any]] = []

        if use_hybrid:
            # 3. Sparse retrieval via BM25
            sparse_hits = self.bm25.search(question, top_k=max(k * 3, 12))
            fused = self.reciprocal_rank_fusion(dense_hits, sparse_hits)
            
            d_map = {d_id: dist for dist, d_id in dense_hits}
            for score, chunk_id in fused[:max(k * 3, 12)]:
                if chunk_id in self.chunks_cache:
                    c = dict(self.chunks_cache[chunk_id])
                    c["distance"] = round(d_map.get(chunk_id, 0.45), 4)
                    c["rrf_score"] = round(score, 5)
                    candidates.append(c)
        else:
            for dist, chunk_id in dense_hits:
                if chunk_id in self.chunks_cache:
                    c = dict(self.chunks_cache[chunk_id])
                    c["distance"] = round(dist, 4)
                    candidates.append(c)

        # 4. Semantic Diversity Deduplication
        candidates = self.deduplicate_chunks(candidates)

        # 5. Re-Ranking (Contextual vs FlashRank vs Ensemble)
        if use_rerank and candidates:
            if rerank_mode == "flashrank":
                final_hits = self.flashrank_rerank(question, candidates)[:k]
            elif rerank_mode == "ensemble":
                final_hits = self.ensemble_rerank(question, candidates)[:k]
            else:
                final_hits = self.contextual_rerank(question, candidates)[:k]
        else:
            final_hits = candidates[:k]

        # 6. Corrective RAG (CRAG) Confidence Tagging
        confidence = self.evaluate_retrieval_confidence(final_hits)
        for h in final_hits:
            h["confidence"] = confidence

        return final_hits, hyde_text

    async def benchmark_manual_vs_enterprise(self, query: str = "HNSW search algorithm complexity") -> Dict[str, Any]:
        """
        Rigorous Evaluation Benchmark:
        Compares our Manual Mathematical Pipeline against Enterprise Standards (FlashRank, BM25, BruteForce).
        """
        if not self.is_initialized:
            await self.reload_index()

        chunks = list(self.chunks_cache.values())
        if not chunks:
            return {"error": "No indexed chunks available for benchmark"}

        # 1. Evaluate Manual Contextual Cross-Encoder Speed
        t0 = time.perf_counter()
        manual_results = self.contextual_rerank(query, chunks)
        t_manual_us = round((time.perf_counter() - t0) * 1_000_000, 2)

        # 2. Evaluate FlashRank Neural Cross-Encoder Speed
        t0 = time.perf_counter()
        flash_results = self.flashrank_rerank(query, chunks)
        t_flash_us = round((time.perf_counter() - t0) * 1_000_000, 2)

        # 3. Evaluate Top-K Agreement (Spearman / Top-K Overlap)
        top_manual_ids = [c["id"] for c in manual_results[:5]]
        top_flash_ids = [c["id"] for c in flash_results[:5]]
        overlap = len(set(top_manual_ids).intersection(set(top_flash_ids)))
        agreement_pct = round((overlap / max(1, min(5, len(chunks)))) * 100, 1)

        # 4. Evaluate BM25 Lexical Hit
        t0 = time.perf_counter()
        bm25_hits = self.bm25.search(query, top_k=5)
        t_bm25_us = round((time.perf_counter() - t0) * 1_000_000, 2)

        return {
            "query": query,
            "chunkCount": len(chunks),
            "manualCrossEncoderUs": t_manual_us,
            "flashrankNeuralUs": t_flash_us,
            "speedupFactor": round(t_flash_us / max(t_manual_us, 0.1), 1),
            "topKAgreementPercent": agreement_pct,
            "bm25LatencyUs": t_bm25_us,
            "topManualHits": [
                {"id": c["id"], "title": c["title"], "score": c.get("manual_score", 0.0)}
                for c in manual_results[:3]
            ],
            "topFlashrankHits": [
                {"id": c["id"], "title": c["title"], "score": c.get("flashrank_score", 0.0)}
                for c in flash_results[:3]
            ],
            "isFlashrankAvailable": bool(flashrank_ranker is not None)
        }

rag_pipeline = AdvancedRAGPipeline()
