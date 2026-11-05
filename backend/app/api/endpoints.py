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
    RagQueryRequest, RagResponse, StatusResponse,
    GuardrailCheckRequest, GuardrailCheckResponse,
    ObservabilityTraceSchema, RagasEvalResponse
)
from app.engine.vector_engine import vector_engine
from app.rag.advanced_rag import rag_pipeline
from app.rag.llm_client import llm_client
from app.db.database import get_all_documents, delete_document, record_chat, get_doc_count
from app.security.guardrails import guardrail_engine
from app.observability.tracer import tracer
from app.gateway.resilience import llm_gateway
from app.evals.ragas_evals import ragas_evaluator

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
        lower_name = filename.lower()
        
        # Enterprise Multi-Format Ingestion (PDF, DOCX, PPTX, JSON, CSV, TXT, MD)
        if lower_name.endswith(".pdf"):
            import re
            pdf_str = content_bytes.decode("latin1", errors="ignore")
            matches = re.findall(r'\((.*?)\)\s*Tj', pdf_str)
            if not matches:
                matches = re.findall(r'\[(.*?)\]\s*TJ', pdf_str)
            if matches:
                extracted_text = " ".join([m.replace(r'\(', '(').replace(r'\)', ')') for m in matches])
            else:
                extracted_text = " ".join(re.findall(r'[A-Za-z0-9\s,\.\?\!\-\:;]{4,}', pdf_str))
            if len(extracted_text.strip()) < 30:
                extracted_text = content_bytes.decode("utf-8", errors="ignore")
        elif lower_name.endswith(".docx"):
            import zipfile
            import io
            import xml.etree.ElementTree as ET
            try:
                with zipfile.ZipFile(io.BytesIO(content_bytes)) as docx_zip:
                    xml_content = docx_zip.read('word/document.xml')
                    tree = ET.fromstring(xml_content)
                    texts = [elem.text for elem in tree.iter() if elem.tag.endswith('}t') and elem.text]
                    extracted_text = " ".join(texts)
            except Exception as e:
                extracted_text = content_bytes.decode("utf-8", errors="ignore")
        elif lower_name.endswith(".pptx"):
            import zipfile
            import io
            import xml.etree.ElementTree as ET
            try:
                texts = []
                with zipfile.ZipFile(io.BytesIO(content_bytes)) as pptx_zip:
                    slide_files = [f for f in pptx_zip.namelist() if f.startswith('ppt/slides/slide') and f.endswith('.xml')]
                    slide_files.sort()
                    for s in slide_files:
                        xml_content = pptx_zip.read(s)
                        tree = ET.fromstring(xml_content)
                        texts.extend([elem.text for elem in tree.iter() if elem.tag.endswith('}t') and elem.text])
                extracted_text = " ".join(texts)
            except Exception as e:
                extracted_text = content_bytes.decode("utf-8", errors="ignore")
        elif lower_name.endswith(".json"):
            try:
                data = json.loads(content_bytes.decode("utf-8", errors="ignore"))
                extracted_text = json.dumps(data, indent=2)
            except Exception:
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

@router.get("/rag/benchmark-rerank")
async def benchmark_rerank(query: str = "HNSW search algorithm complexity"):
    res = await rag_pipeline.benchmark_manual_vs_enterprise(query=query)
    return res

@router.post("/rag/ask")
async def ask_rag(req: RagQueryRequest):
    t0 = time.perf_counter()
    trace = tracer.start_trace(name="rag_ask", query=req.question)

    # 1. Enterprise Security Guardrails Gate
    with trace.span("guardrail_gate", {"raw_chars": len(req.question)}) as s_guard:
        guard_res = guardrail_engine.evaluate(req.question)
        s_guard.set_attribute("action", guard_res.action)
        s_guard.set_attribute("threat_level", guard_res.threat_level)
        s_guard.set_attribute("flagged_categories", guard_res.flagged_categories)

    provider, active_model = await llm_client.get_active_provider_info()

    # Blocked Request: Fail-closed with security alert
    if not guard_res.is_safe:
        tracer.end_trace(trace, status="blocked")
        refusal_msg = guard_res.refusal_message or "Security Violation: Query quarantined by safety guardrails."
        
        if req.stream:
            async def blocked_stream():
                yield f"data: {json.dumps({'type': 'meta', 'contexts': [], 'confidence': 'low', 'model': active_model, 'provider': provider, 'security_alert': guard_res.flagged_categories, 'action': 'blocked'})}\n\n"
                yield f"data: {json.dumps({'type': 'token', 'token': f'[🛡️ SECURITY GUARDRAIL INTERCEPT: {guard_res.threat_level.upper()}]\n\n{refusal_msg}'})}\n\n"
                yield f"data: {json.dumps({'type': 'done', 'latency_ms': round((time.perf_counter() - t0) * 1000, 1), 'model': active_model, 'provider': provider})}\n\n"
            return StreamingResponse(blocked_stream(), media_type="text/event-stream")

        return RagResponse(
            answer=f"[🛡️ SECURITY GUARDRAIL INTERCEPT: {guard_res.threat_level.upper()}]\n\n{refusal_msg}",
            model=active_model,
            provider=provider,
            latency_ms=round((time.perf_counter() - t0) * 1000, 1),
            contexts=[],
            docCount=await get_doc_count()
        )

    effective_query = guard_res.sanitized_text

    # 2. Advanced Context Retrieval with Selected Re-Ranker Mode
    with trace.span("retrieval_pipeline", {"mode": req.rerank_mode, "k": req.k}) as s_ret:
        contexts, hyde_passage = await rag_pipeline.retrieve(
            question=effective_query,
            k=req.k,
            use_hybrid=req.use_hybrid,
            use_rerank=req.use_rerank,
            use_hyde=req.use_hyde,
            rerank_mode=req.rerank_mode or "ensemble"
        )
        s_ret.set_attribute("contexts_retrieved", len(contexts))

    # 3. Build Prompt
    ctx_str = ""
    for i, c in enumerate(contexts):
        ctx_str += f"[{i + 1}] {c.get('title', 'Document')}:\n{c.get('text', '')}\n\n"

    retrieval_confidence = contexts[0].get("confidence", "medium") if contexts else "low"

    system_prompt = (
        "You are an expert AI knowledge engine powered by 2026 Advanced Retrieval-Augmented Generation (RAG). "
        "Answer the user's question directly, accurately, authoritatively, and concisely. "
        "Synthesize facts seamlessly from the provided numbered context chunks, referencing sources using inline bracket citations like [1] or [2] where relevant. "
        "Do not use robotic filler like 'According to the context' or 'Based on the provided documents'. "
        "If the provided context does not contain sufficient information, provide the best factual answer from your broader technical knowledge while clearly noting any unverified aspects."
    )

    full_prompt = (
        f"Context Chunks (Retrieval Confidence: {retrieval_confidence.upper()}):\n{ctx_str}\n\n"
        f"User Question: {effective_query}\n\n"
        f"Direct Answer:"
    )

    if req.stream:
        async def event_generator():
            # Send context metadata first
            meta_event = {
                "type": "meta",
                "contexts": contexts,
                "hyde_passage": hyde_passage,
                "confidence": retrieval_confidence,
                "model": active_model,
                "provider": provider,
                "trace_id": trace.trace_id,
                "guardrail_action": guard_res.action
            }
            yield f"data: {json.dumps(meta_event)}\n\n"

            accumulated_answer = []
            with trace.span("llm_stream_generation", {"model": active_model}):
                async for token in llm_client.generate_stream(full_prompt, system_prompt):
                    accumulated_answer.append(token)
                    yield f"data: {json.dumps({'type': 'token', 'token': token})}\n\n"

            latency = round((time.perf_counter() - t0) * 1000, 1)
            full_ans = "".join(accumulated_answer)
            await record_chat(effective_query, full_ans, f"{provider}:{active_model}", contexts)
            
            # Store in gateway cache
            llm_gateway.store_response(effective_query, active_model, {
                "answer": full_ans,
                "contexts": contexts,
                "confidence": retrieval_confidence
            })

            tracer.end_trace(trace, status="ok")
            yield f"data: {json.dumps({'type': 'done', 'latency_ms': latency, 'model': active_model, 'provider': provider, 'trace_id': trace.trace_id})}\n\n"

        return StreamingResponse(event_generator(), media_type="text/event-stream")

    # Non-streaming JSON response
    with trace.span("llm_sync_generation", {"model": active_model}):
        tokens = []
        async for token in llm_client.generate_stream(full_prompt, system_prompt):
            tokens.append(token)
        answer = "".join(tokens)

    latency = round((time.perf_counter() - t0) * 1000, 1)
    await record_chat(effective_query, answer, f"{provider}:{active_model}", contexts)
    llm_gateway.store_response(effective_query, active_model, {
        "answer": answer,
        "contexts": contexts,
        "confidence": retrieval_confidence
    })
    tracer.end_trace(trace, status="ok")

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

# ── SECURITY, OBSERVABILITY & EVALS ENDPOINTS ───────────────────

@router.post("/security/guardrail-check", response_model=GuardrailCheckResponse)
async def check_guardrail(req: GuardrailCheckRequest):
    res = guardrail_engine.evaluate(req.text)
    return {
        "is_safe": res.is_safe,
        "action": res.action,
        "threat_level": res.threat_level,
        "flagged_categories": res.flagged_categories,
        "sanitized_text": res.sanitized_text,
        "refusal_message": res.refusal_message,
        "rule_matches": res.rule_matches,
        "latency_ms": res.latency_ms
    }

@router.get("/security/stats")
async def get_security_stats():
    return guardrail_engine.get_stats()

@router.get("/observability/traces")
async def get_traces(limit: int = 20):
    return tracer.get_recent_traces(limit=limit)

@router.get("/observability/stats")
async def get_observability_stats():
    return tracer.get_stats()

@router.get("/gateway/stats")
async def get_gateway_stats():
    return llm_gateway.get_gateway_telemetry()

@router.post("/evals/run")
async def run_ragas_evals(k: int = 3, rerank_mode: str = "ensemble"):
    summary = await ragas_evaluator.run_evaluation(rag_pipeline, k=k, rerank_mode=rerank_mode)
    return summary

@router.get("/evals/latest")
async def get_latest_eval():
    if not ragas_evaluator.latest_eval:
        summary = await ragas_evaluator.run_evaluation(rag_pipeline, k=3, rerank_mode="ensemble")
        return summary
    return ragas_evaluator.latest_eval
