import time
import json
from fastapi import APIRouter, HTTPException, BackgroundTasks, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from typing import List, Optional
from app.config import settings
from app.models.schemas import (
    VectorInsertRequest, VectorSearchRequest, VectorSearchResult,
    BenchmarkRequest, BenchmarkResponse, HnswGraphResponse,
    PcaResponse, DocumentUploadRequest, DocumentItem,
    RagQueryRequest, RagResponse, StatusResponse
)
from app.engine.vector_engine import vector_engine
from app.rag.advanced_rag import rag_pipeline
from app.rag.llm_client import llm_client
from app.db.database import get_all_documents, delete_document, record_chat, get_doc_count

router = APIRouter()

@router.get("/status", response_model=StatusResponse)
async def get_status():
    ollama_up = await llm_client.is_ollama_available()
    doc_count = await get_doc_count()
    provider, model_name = await llm_client.get_active_provider_info()
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "provider": provider,
        "ollamaAvailable": ollama_up,
        "embedModel": settings.OLLAMA_EMBED_MODEL,
        "genModel": model_name,
        "cloudFallbackAvailable": bool(settings.GROQ_API_KEY or settings.OPENAI_API_KEY),
        "docCount": doc_count,
        "demoCount": len(vector_engine.items),
        "demoDims": vector_engine.dims,
        "docDims": 768
    }

@router.get("/stats")
async def get_stats():
    return {
        "count": len(vector_engine.items),
        "dims": vector_engine.dims,
        "algorithms": ["hnsw", "kdtree", "bruteforce"],
        "metrics": ["cosine", "euclidean", "manhattan"]
    }

@router.get("/vectors")
async def list_vectors():
    out = []
    for item_id, (i_id, meta, cat, emb) in vector_engine.items.items():
        out.append({
            "id": i_id,
            "metadata": meta,
            "category": cat,
            "embedding": emb.tolist()
        })
    return out

@router.post("/vectors")
async def insert_vector(req: VectorInsertRequest):
    new_id = vector_engine.insert(req.metadata, req.category, req.embedding)
    return {"id": new_id, "status": "success"}

@router.delete("/vectors/{item_id}")
async def delete_vector(item_id: int):
    success = vector_engine.delete(item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"ok": True}

@router.post("/search", response_model=List[VectorSearchResult])
async def search_vectors(req: VectorSearchRequest):
    results = vector_engine.search(
        query=req.vector,
        k=req.k,
        metric=req.metric,
        algorithm=req.algorithm
    )
    return results

@router.post("/benchmark", response_model=BenchmarkResponse)
async def run_benchmark(req: BenchmarkRequest):
    bench = vector_engine.benchmark(query=req.vector, k=req.k, metric=req.metric)
    return bench

@router.get("/hnsw-info", response_model=HnswGraphResponse)
async def get_hnsw_info():
    info = vector_engine.hnsw.get_info()
    return info

@router.get("/pca", response_model=PcaResponse)
async def get_pca_projection():
    points = vector_engine.compute_pca()
    return {"points": points}

# ── ADVANCED RAG ENDPOINTS ───────────────────────────────────────

@router.get("/documents", response_model=List[DocumentItem])
async def list_documents():
    docs = await get_all_documents()
    return docs

@router.post("/rag/upload")
async def upload_document(
    title: Optional[str] = Form(None),
    text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    if file:
        content_bytes = await file.read()
        filename = file.filename or "Uploaded Document"
        doc_title = title or filename
        
        # Check if PDF
        if filename.lower().endswith(".pdf"):
            import re
            pdf_str = content_bytes.decode("latin1", errors="ignore")
            # Extract parenthesized strings inside Tj or TJ blocks
            matches = re.findall(r'\((.*?)\)\s*Tj', pdf_str)
            if not matches:
                matches = re.findall(r'\[(.*?)\]\s*TJ', pdf_str)
            if matches:
                extracted_text = " ".join([m.replace(r'\(', '(').replace(r'\)', ')') for m in matches])
            else:
                # Extract ASCII words
                extracted_text = " ".join(re.findall(r'[A-Za-z0-9\s,\.\?\!\-\:;]{4,}', pdf_str))
            if len(extracted_text.strip()) < 30:
                extracted_text = content_bytes.decode("utf-8", errors="ignore")
        else:
            extracted_text = content_bytes.decode("utf-8", errors="ignore")
    elif text and title:
        extracted_text = text
        doc_title = title
    else:
        raise HTTPException(status_code=400, detail="Must provide either text and title, or a file")

    if not extracted_text.strip():
        raise HTTPException(status_code=400, detail="The uploaded file or text is empty")

    doc_id = await rag_pipeline.ingest_document(doc_title, extracted_text)
    return {"doc_id": doc_id, "title": doc_title, "status": "indexed"}

@router.delete("/documents/{doc_id}")
async def delete_doc(doc_id: int):
    ok = await delete_document(doc_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Document not found")
    await rag_pipeline.reload_index()
    return {"ok": True}

@router.post("/rag/ask")
async def ask_rag(req: RagQueryRequest):
    t0 = time.perf_counter()
    
    # 1. Advanced Context Retrieval
    contexts, hyde_passage = await rag_pipeline.retrieve(
        question=req.question,
        k=req.k,
        use_hybrid=req.use_hybrid,
        use_rerank=req.use_rerank,
        use_hyde=req.use_hyde
    )

    # 2. Build Prompt
    ctx_str = ""
    for i, c in enumerate(contexts):
        ctx_str += f"[{i + 1}] {c.get('title', 'Document')}:\n{c.get('text', '')}\n\n"

    system_prompt = (
        "You are an expert AI knowledge engine with advanced retrieval-augmented generation. "
        "Answer the user's question directly, accurately, and authoritatively. "
        "Synthesize facts from the provided context chunks where relevant, maintaining a fluid and natural explanation. "
        "Cite facts accurately without saying 'According to the context'. "
        "If the answer is not in the text, use your broad technical knowledge."
    )

    full_prompt = (
        f"Context Chunks:\n{ctx_str}\n\n"
        f"User Question: {req.question}\n\n"
        f"Direct Answer:"
    )

    provider, active_model = await llm_client.get_active_provider_info()

    if req.stream:
        async def event_generator():
            # Send context metadata first
            meta_event = {
                "type": "meta",
                "contexts": contexts,
                "hyde_passage": hyde_passage,
                "model": active_model,
                "provider": provider
            }
            yield f"data: {json.dumps(meta_event)}\n\n"

            accumulated_answer = []
            async for token in llm_client.generate_stream(full_prompt, system_prompt):
                accumulated_answer.append(token)
                yield f"data: {json.dumps({'type': 'token', 'token': token})}\n\n"

            latency = round((time.perf_counter() - t0) * 1000, 1)
            full_ans = "".join(accumulated_answer)
            await record_chat(req.question, full_ans, f"{provider}:{active_model}", contexts)
            
            yield f"data: {json.dumps({'type': 'done', 'latency_ms': latency, 'model': active_model, 'provider': provider})}\n\n"

        return StreamingResponse(event_generator(), media_type="text/event-stream")

    # Non-streaming JSON response
    tokens = []
    async for token in llm_client.generate_stream(full_prompt, system_prompt):
        tokens.append(token)
    answer = "".join(tokens)
    latency = round((time.perf_counter() - t0) * 1000, 1)
    
    await record_chat(req.question, answer, f"{provider}:{active_model}", contexts)
    
    doc_count = await get_doc_count()
    return RagResponse(
        answer=answer,
        model=active_model,
        provider=provider,
        latency_ms=latency,
        contexts=contexts,
        docCount=doc_count,
        hyde_document=hyde_passage
    )
