import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.endpoints import router as api_router
from app.db.database import init_db, get_doc_count
from app.rag.advanced_rag import rag_pipeline

SAMPLE_DOC = """
Vector databases are specialized storage engines designed to manage, index, and query high-dimensional embeddings efficiently.
Traditional relational databases index scalar data using B-Trees, which sort numbers or strings in 1-dimensional order. In high-dimensional vector spaces (e.g. 768 or 1536 dimensions), B-Trees suffer from the curse of dimensionality, leading to exhaustive linear scans O(N).
Approximate Nearest Neighbor (ANN) search algorithms overcome this limitation. Hierarchical Navigable Small World (HNSW) graphs construct a multilayer structure where upper layers act as express expressways (skipping many nodes) and lower layers provide fine-grained local connectivity. This enables sub-linear search time complexity O(log N).
Advanced Retrieval-Augmented Generation (RAG) combines dense semantic retrieval with sparse keyword indexing (BM25) via Reciprocal Rank Fusion (RRF). Contextual reranking further scores retrieved passages against the user query before passing the curated context into Large Language Models like LLaMA 3.2.
"""

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite tables
    await init_db()
    # Seed initial document if empty
    count = await get_doc_count()
    if count == 0:
        await rag_pipeline.ingest_document("Vector Database & HNSW Architecture", SAMPLE_DOC, "systems")
    else:
        await rag_pipeline.reload_index()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="High-Performance Vector Database and Advanced RAG Engine",
    lifespan=lifespan
)

# Enable CORS for Next.js and external clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(api_router, prefix="/api")

@app.api_route("/", methods=["GET", "HEAD"])
async def root():
    return {
        "project": settings.PROJECT_NAME,
        "status": "online",
        "version": settings.VERSION,
        "docs": "/docs",
        "health": "/health",
        "api": "/api/status"
    }

@app.api_route("/health", methods=["GET", "HEAD"])
async def health_check():
    return {"status": "ok", "service": "pranshus-ai-backend", "version": settings.VERSION}

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    from fastapi import Response
    return Response(status_code=204)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
