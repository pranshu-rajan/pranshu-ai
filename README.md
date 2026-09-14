# VectorDB Pro & Advanced RAG Studio

> **A Production-Grade Full-Stack Vector Database and Advanced RAG Knowledge Engine built from scratch.**  
> Implements **HNSW (Hierarchical Navigable Small World)**, **KD-Tree**, and **Brute Force** vector search algorithms in native C++ and async Python, paired with an Advanced RAG Pipeline (Hybrid Search via RRF, Contextual Reranking, HyDE) and a 2026 interactive cyber-glassmorphic frontend.

Developed and engineered by **[Rajan Pranshu Piyushkumar](https://github.com/pranshu-rajan)**.

---

## 🚀 Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                   NEXT.JS 15 + TAILWIND CSS + TYPESCRIPT               │
│                  (2026 Interactive Vector & RAG Studio)                │
│                                                                        │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌────────────┐  │
│  │ 2D Space Radar Explorer│ │ HNSW Layer Inspector  │  │ Benchmark  │  │
│  │ (Canvas/WebGL Radar)  │  │ (Step-by-step hops)   │  │ Arena      │  │
│  └───────────────────────┘  └───────────────────────┘  └────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Advanced RAG Chat: Streaming SSE, Citation Chips, Pipeline Visual│  │
│  └──────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / SSE Streaming (Port 8000)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          FASTAPI BACKEND                               │
│                   (Python 3.11 Async API Gateway)                      │
│                                                                        │
│  ┌─────────────────────────┐   ┌────────────────────────────────────┐  │
│  │   Advanced RAG Core     │   │      Persistent SQLite Storage     │  │
│  │ • Hybrid Search (RRF)   │   │ • Documents, Chunks, Metadata,     │  │
│  │ • Contextual Rerank     │   │   Chat History & Benchmark metrics │  │
│  │ • HyDE & Query Expand   │   └────────────────────────────────────┘  │
│  │ • Sliding Window Chunks │                                           │
│  └────────────┬────────────┘                                           │
│               │                                                        │
│  ┌────────────┴─────────────────────────┐  ┌────────────────────────┐  │
│  │ Dual Provider Engine:                │  │ Vector Engine Bridge   │  │
│  │ • Local: Ollama (nomic + llama3)     │  │ • Native C++ Core      │  │
│  │ • Cloud Fallback: Groq / OpenAI API  │  │ • High-perf HNSW Index │  │
│  │   (enables zero-Ollama cloud deploy!)│  │   (Cosine, Euclidean)  │  │
│  └──────────────────────────────────────┘  └────────────────────────┘  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Sidecar / Native Engine
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       C++ VECTOR CORE ENGINE                           │
│     (Preserved from scratch: main.cpp / httplib.h / CMake build)       │
│         • Custom HNSW Graph • KD-Tree • Brute Force • PCA Engine       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Features & Capabilities

### 1. Vector Database Engine Built From Scratch
- **Hierarchical Navigable Small World (HNSW)**:
  - Multi-layer skip-list graph ($M=16$, $efConstruction=64$, $efSearch=32$) with logarithmic search complexity $O(\log N)$.
  - Fast nearest-neighbor search for high-dimensional vectors (768D+).
- **KD-Tree**:
  - Spatial partitioning tree cycling dimensions with hyper-plane bounding box pruning.
- **Brute Force**:
  - Exact $O(N)$ linear scan serving as the ground-truth benchmark baseline.
- **Distance Metrics**:
  - Cosine Similarity, Euclidean Distance ($L_2$), Manhattan Distance ($L_1$).
- **Principal Component Analysis (PCA)**:
  - SVD / Power iteration dimensionality reduction projecting 16D semantic spaces onto an interactive 2D canvas.

### 2. Advanced RAG (Retrieval-Augmented Generation) Pipeline
- **Hybrid Retrieval (Dense + Sparse)**:
  - Fuses dense HNSW vector search with BM25 keyword matching via **Reciprocal Rank Fusion (RRF)**:
    $$\text{RRF\_Score}(d) = \frac{1}{60 + \text{rank}_{\text{dense}}(d)} + \frac{1}{60 + \text{rank}_{\text{bm25}}(d)}$$
  - Prevents vector hallucination on exact acronyms, names, and part numbers.
- **Contextual Reranking**:
  - Scores candidate passages against query semantics to filter noise and rank by relevance.
- **HyDE (Hypothetical Document Embeddings)**:
  - Hallucinates an ideal answer passage before embedding to bridge the query-document semantic gap.
- **Document Ingestion Engine**:
  - Sliding-window text chunker with overlap and paragraph preservation.
- **Dual AI Provider**:
  - Seamlessly switches between local Ollama (`nomic-embed-text` + `llama3.2`) and Cloud APIs (Groq / OpenAI) for serverless cloud deployment.

### 3. 2026 Interactive Cyber-Glassmorphic UI
- **2D Space Radar**: Interactive Canvas with zoom/pan, category clusters, hover tooltips, and animated glowing distance beams to nearest neighbors.
- **HNSW Multilayer Graph Inspector**: Interactive layer stepper (Layer 0 to Layer $N$) and real-time greedy search hop traversal animation.
- **Benchmark Arena**: Side-by-side microsecond latency showdown with interactive Top-$K$ and metric controls.
- **Advanced RAG Studio**: Drag-and-drop document upload, real-time SSE token streaming, and citation pill inspection cards.
- **Vector Registry**: Table of vectors with modal coordinate inspection and insertion forms.

---

## 🛠️ Project Structure

```
├── core-engine/              # Native C++ Vector Database from scratch
│   ├── main.cpp              # C++ HNSW, KD-Tree, Brute Force, PCA engine
│   ├── httplib.h             # Header-only C++ HTTP server
│   ├── CMakeLists.txt        # CMake build script
│   └── Dockerfile            # C++ engine container
├── backend/                  # FastAPI Advanced RAG & Vector Gateway
│   ├── app/
│   │   ├── main.py           # FastAPI application with CORS & lifespan
│   │   ├── config.py         # Settings & environment configuration
│   │   ├── api/endpoints.py  # REST & streaming endpoints
│   │   ├── rag/              # Advanced RAG (BM25, RRF, Reranker, HyDE)
│   │   ├── engine/           # Vector engine (HNSW, KD-Tree, PCA)
│   │   ├── db/database.py    # Async SQLite persistent storage
│   │   └── models/schemas.py # Pydantic v2 schemas
│   ├── requirements.txt      # Python dependencies
│   ├── Dockerfile            # Backend container
│   └── .env.example          # Environment variables template
├── frontend/                 # Next.js 15 + Tailwind CSS + TypeScript
│   ├── src/
│   │   ├── app/              # Next.js App Router (layout, page, styles)
│   │   ├── components/       # SpaceExplorer, HnswInspector, Benchmark, RagStudio
│   │   └── lib/              # API client & TypeScript interfaces
│   ├── tailwind.config.ts    # 2026 Dark Obsidian & Cyber Neon theme
│   ├── tsconfig.json         # TypeScript configuration
│   └── Dockerfile            # Next.js production container
├── docker-compose.yml        # 1-Click full-stack containerization
└── .github/workflows/ci.yml  # GitHub Actions CI for C++, Python, Next.js
```

---

## ⚡ Quick Start

### Option A: Docker Compose (1-Command Full Stack)

```bash
docker-compose up --build
```

- **Frontend**: `http://localhost:3000`
- **FastAPI Backend**: `http://localhost:8000`
- **FastAPI Docs (Swagger)**: `http://localhost:8000/docs`
- **C++ Core Engine**: `http://localhost:8080`

---

### Option B: Local Development

#### 1. Start C++ Core Engine
```bash
cd core-engine
g++ -O3 -std=c++17 main.cpp -lws2_32 -lwsock32 -lcrypt32 -o vectordb
./vectordb
```

#### 2. Start FastAPI Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Or on Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### 3. Start Next.js Frontend
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 🌐 Cloud Deployment Guide

### Frontend Deployment (Vercel / Cloudflare Pages)
1. Import repository on [Vercel](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Set Environment Variable:
   - `NEXT_PUBLIC_API_URL`: Your deployed FastAPI backend URL (e.g., `https://vectordb-backend.onrender.com`).
4. Click **Deploy**.

### Backend Deployment (Render / Railway / Fly.io)
1. Create a new Web Service on [Render](https://render.com) or [Railway](https://railway.app).
2. Set **Root Directory** to `backend`.
3. Set **Build Command**: `pip install -r requirements.txt`
4. Set **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Optional Environment Variables:
   - `GROQ_API_KEY`: Your Groq API key for cloud LLM inference.
   - `OPENAI_API_KEY`: Your OpenAI API key (optional).

---

## 📄 License
MIT License. Created and maintained by **Rajan Pranshu Piyushkumar**.
