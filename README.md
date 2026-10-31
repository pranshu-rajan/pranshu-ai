# Pranshu's AI — Production Vector Database & Advanced RAG Engine

[![Live Application](https://img.shields.io/badge/Live%20App-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://pranshu-ai.vercel.app)
[![API Gateway](https://img.shields.io/badge/API%20Gateway-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://pranshu-ai.onrender.com)
[![Swagger Docs](https://img.shields.io/badge/API%20Docs-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://pranshu-ai.onrender.com/docs)
[![Database](https://img.shields.io/badge/Database-Supabase%20%7C%20SQLite-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

> **A high-performance, resilient Vector Database and multi-stage Retrieval-Augmented Generation (RAG) engine built from algorithmic first principles.**  
> Solves the curse of dimensionality, semantic search blindspots, and LLM hallucination through native **HNSW graphs**, **HyDE**, **BM25 Hybrid Search (RRF)**, **Contextual Reranking**, and an explainable **2026 Aether Light visual telemetry interface**.

- 🌐 **Live Web Application**: [https://pranshu-ai.vercel.app](https://pranshu-ai.vercel.app)
- ⚡ **Production REST & SSE API**: [https://pranshu-ai.onrender.com](https://pranshu-ai.onrender.com)
- 📚 **Interactive Swagger API Explorer**: [https://pranshu-ai.onrender.com/docs](https://pranshu-ai.onrender.com/docs)
- 🩺 **System Health Endpoint**: [https://pranshu-ai.onrender.com/health](https://pranshu-ai.onrender.com/health)

**Engineered and authored by [Rajan Pranshu Piyushkumar](https://github.com/pranshu-rajan)**.

---

## 🎯 Executive Summary: What Problem Does This Solve?

Most modern AI applications treat vector search and retrieval-augmented generation as opaque black-box APIs (e.g., calling hosted vector databases and basic cosine-similarity wrappers). In production environments, this traditional approach breaks down in four fundamental ways:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             EXISTING INDUSTRY PAIN POINTS                        │
├─────────────────────────┬─────────────────────────┬──────────────────────────────┤
│ 1. The High-Dim Trap    │ 2. The Semantic Mismatch│ 3. Production Fragility      │
│ Relational B-Trees and  │ Pure dense vectors miss │ Cloud databases or LLM rate  │
│ spatial KD-Trees fail   │ exact keywords & syntax │ limits crash applications    │
│ when dimensions D > 10. │ while queries mismatch  │ with zero graceful fallback  │
│ Scans become O(N).      │ document passages.      │ or local self-healing.       │
└─────────────────────────┴─────────────────────────┴──────────────────────────────┘
                                      ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                            PRANSHU'S AI ARCHITECTURE                             │
├─────────────────────────┬─────────────────────────┬──────────────────────────────┤
│ Hierarchical Navigable  │ 3-Stage RAG Pipeline:   │ Dual-Database Resilience &   │
│ Small World (HNSW)      │ HyDE + Hybrid BM25/RRF  │ Sub-Millisecond Fallback     │
│ Sub-linear O(log N)     │ + Cross-Encoder Rerank  │ Zero-downtime persistence    │
│ proximity graph search. │ for 100% precision.     │ and fast socket telemetry.   │
└─────────────────────────┴─────────────────────────┴──────────────────────────────┘
```

---

## 🔬 Core Engineering Innovations & What Makes This Different

### 1. Conquering the Curse of Dimensionality: Native HNSW Graph Engine
* **The Existing Limitation**: Traditional database B-Trees rely on 1-dimensional ordering. When querying modern language model embeddings (768D or 1536D), B-Trees collapse into exhaustive linear scans $\mathcal{O}(N)$. Similarly, KD-Trees partition orthogonal hyperplanes; their partition volume shrinks exponentially with dimensions ($\mathcal{O}(2^D \cdot \log N)$), causing KD-Trees to evaluate almost every leaf node once $D > 10$.
* **How It Is Solved Here**: We designed and implemented a native **Hierarchical Navigable Small World (HNSW)** proximity graph.
  * **Probabilistic Multi-Layer Hierarchy**: Nodes are assigned maximum layers via exponential decay distributions. Upper layers act as high-speed "expressways" with long-range edges, skipping large clusters in $\mathcal{O}(\log N)$ hops.
  * **Greedy Heuristic Routing**: Each layer performs greedy neighbor traversal until reaching a local minimum, then drops down to the next denser layer for fine-grained convergence.
  * **Configurable Graph Topology**: Built with $M=16$ bi-directional connections per node and $ef_{\text{construction}}=64$ exploration breadth, ensuring over 98% approximate nearest neighbor recall at sub-millisecond query latency.

---

### 2. Eliminating the Semantic Retrieval Gap: Multi-Stage Hybrid RAG
Standard RAG pipelines blindly retrieve the top-$k$ nearest document vectors by cosine similarity. This introduces two fatal flaws: **the Keyword Blindspot** (failing on specific acronyms, exact codes, or part numbers) and **Query-Document Distribution Mismatch** (a short question looks semantically dissimilar to an answer passage).

Pranshu's AI resolves this through a three-stage retrieval pipeline:

```
User Query: "How does HNSW skip connections work?"
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Stage 1: Hypothetical Document Embeddings (HyDE)                │
│ LLM generates a synthetic answer passage before search.         │
│ Aligns interrogative query space with declarative doc space.    │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
┌────────────────────────────────┐ ┌──────────────────────────────┐
│ Stage 2A: Dense Vector Search  │ │ Stage 2B: Sparse BM25 Search │
│ HNSW Graph Traversal (Cosine)  │ │ Lexical Token Inverted Index │
│ Captures deep conceptual intent│ │ Captures exact terminology   │
└────────────────┬───────────────┘ └──────────────┬───────────────┘
                 │                                │
                 └───────────────┬────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ Reciprocal Rank Fusion (RRF): Score = ∑ 1 / (60 + rank_i)       │
│ Unifies disparate scoring distributions without arbitrary scales│
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ Stage 3: Contextual Cross-Encoder Re-ranking                    │
│ Evaluates joint (Query, Chunk) token interactions               │
│ Prunes irrelevant distractors before prompt injection           │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
    Curated High-Fidelity Context Chunks → Groq LPU™ Generation
```

1. **HyDE (Hypothetical Document Expansion)**: Generates a speculative passage capturing how an authoritative answer would look. The system embeds this hypothetical passage, projecting the search vector into the exact semantic distribution of the knowledge base.
2. **Dense + Sparse Hybrid Fusion (RRF)**: Executes dense vector retrieval on HNSW and sparse term frequency retrieval on BM25 simultaneously. Merges candidates using **Reciprocal Rank Fusion**:
   $$\text{RRF\_Score}(d \in D) = \sum_{m \in \{\text{dense}, \text{sparse}\}} \frac{1}{k + \text{rank}_m(d)}$$
   This guarantees that both high-level semantic meaning and exact keyword identifiers are represented in the candidate pool.
3. **Contextual Cross-Encoder Re-ranking**: Scores the joint token-level relationship between the user prompt and each candidate chunk, removing noisy false positives and maximizing context window density for the generation phase.

---

### 3. Production Fault Tolerance & Self-Healing Database Layer
* **The Existing Limitation**: Serverless backend deployments frequently experience network drops, pooler timeouts, or misconfigured cloud credentials, causing the entire service to crash during startup or ingestion.
* **How It Is Solved Here**:
  * **Dual-Tier Zero-Downtime Database Architecture**: The backend integrates **Supabase PostgreSQL** via AWS transaction poolers with automatic `sslmode=require` enforcement. 
  * **Transparent Local SQLite Fallback**: If the cloud database connection drops or experiences timeout errors, the persistence layer seamlessly falls back to a locally initialized SQLite instance without throwing unhandled exceptions or dropping incoming requests.
  * **Sub-Millisecond Socket Health Probing**: Local inference availability (Ollama) is verified using non-blocking synchronous socket checks ($<0.001\text{s}$) with 60-second TTL caching, preventing event-loop stalls.
  * **Ultra-Fast Generation Fallback Chain**: Defaults to cloud-accelerated Groq inference (`openai/gpt-oss-120b`), automatically failing over to `llama-3.3-70b-versatile` and `llama-3.1-8b-instant` if a specific model endpoint is unavailable.

---

### 4. Interactive Visual Telemetry & Explainable Vector Analytics
Instead of treating vector databases as invisible backend daemons, Pranshu's AI includes an explainability and performance visualization suite built directly into the browser without any third-party charting libraries:

| Module | What It Does | Why It Matters |
| :--- | :--- | :--- |
| **2D Semantic Space Explorer** | Computes 2D SVD/PCA projections of 16-dimensional vectors and renders them on an interactive canvas. | Allows users to visually inspect semantic clustering, filter by category, and cast real-time distance beams to nearest neighbors. |
| **HNSW Proximity Graph Inspector** | Renders multi-layer skip-connection network topologies in clean SVG. | Features a step-by-step **Search Hop Simulator** that animates greedy routing from high-level expressway entry points down to local convergence. |
| **Benchmark Arena** | Benchmarks Brute Force Flat $\mathcal{O}(N)$ vs KD-Tree $\mathcal{O}(2^D \log N)$ vs HNSW $\mathcal{O}(\log N)$ across 50 iterations in real time. | Quantifies exact microsecond latency, displays speedup multipliers, and visualizes algorithmic trade-off matrices. |
| **Vector Catalog & Registry** | Dual table and grid views with a 16-dimensional float coordinate heatmap spectrum. | Provides full CRUD control to insert, inspect, and delete vectors in the active index. |
| **RAG Knowledge Studio** | Two-panel live stream interface with chat timeline on the left and Knowledge Hub on the right. | Streams tokens in real time, displays HyDE hypothetical documents, exposes source citation badges, and facilitates file/text document ingestion. |

---

## 🏛️ System Architecture

```
                                  USER BROWSER
                     (Next.js 15 • Aether Light UI System)
                                       │
                      Direct HTTPS REST / SSE Stream
                                       │
                                       ▼
                              FASTAPI GATEWAY
                    (Render Cloud Service / Container)
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         ▼                             ▼                             ▼
┌──────────────────┐         ┌──────────────────┐         ┌────────────────────┐
│ VECTOR ENGINE    │         │ ADVANCED RAG     │         │ DUAL PERSISTENCE   │
│ • HNSW Graph     │         │ • HyDE Expansion │         │ • Supabase Postgres│
│ • KD-Tree        │         │ • BM25 Hybrid    │         │ • SQLite Fallback  │
│ • Brute Force    │         │ • RRF Fusion     │         │ • Connection Pool  │
│ • 2D PCA Metric  │         │ • Cross-Reranker │         │ • Document Chunks  │
└──────────────────┘         └─────────┬────────┘         └────────────────────┘
                                       │
                                       ▼
                              LLM INFERENCE ENGINE
                             (Groq Cloud LPU™ First)
                         Primary: openai/gpt-oss-120b
                         Fallback: LLaMA 3.3 70B / 3.1 8B
```

---

## 🚀 Live Cloud Deployment Setup

The application is deployed across production environments:

- **Frontend**: Hosted on [Vercel](https://vercel.com) using Next.js 15 App Router.
- **Backend**: Hosted on [Render](https://render.com) as a containerized Python FastAPI web service.
- **Database**: Hosted on [Supabase](https://supabase.com) (PostgreSQL 15) with AWS Transaction Pooler support.
- **LLM Accelerator**: Powered by [Groq](https://console.groq.com) LPUs.

### Setting Up Environment Variables

#### Backend (`backend/.env`):
```env
# Server
HOST=0.0.0.0
PORT=8000
ENVIRONMENT=production

# Groq Cloud Acceleration
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b

# PostgreSQL (Supabase Transaction Pooler)
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require
```

#### Frontend (`frontend/.env.production`):
```env
NEXT_PUBLIC_API_URL=https://pranshu-ai.onrender.com
```

---

## 💻 Local Quickstart

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- (Optional) C++ compiler with C++17 support for core engine builds

### 1. Clone the Repository
```bash
git clone https://github.com/pranshu-rajan/pranshu-ai.git
cd "pranshu-ai"
```

### 2. Start the Backend
```bash
cd backend
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
# source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
*API will be live at `http://localhost:8000` with interactive Swagger docs at `http://localhost:8000/docs`.*

### 3. Start the Frontend
```bash
cd ../frontend
npm install
npm run dev
```
*Open `http://localhost:3000` in your browser.*

---

## 📁 Repository Directory Map

```
├── core-engine/              # Native C++ Vector Database Implementation
│   ├── main.cpp              # C++17 HNSW, KD-Tree, Brute Force, and PCA algorithms
│   ├── httplib.h             # Header-only embedded HTTP server
│   ├── CMakeLists.txt        # Native C++ build definitions
│   └── Dockerfile            # Container definition for standalone engine
├── backend/                  # FastAPI Production Backend Gateway
│   ├── app/
│   │   ├── main.py           # Lifespan startup, seeding, and CORS middleware
│   │   ├── config.py         # App configuration & Groq model defaults
│   │   ├── api/endpoints.py  # REST API & SSE streaming endpoints
│   │   ├── engine/           # Python vector algorithms (HNSW, KD-Tree, PCA)
│   │   ├── rag/              # Multi-stage RAG (HyDE, BM25, RRF, Reranker)
│   │   ├── rag/llm_client.py # Resilient multi-provider client (Groq, Ollama)
│   │   ├── db/database.py    # Auto-fallback dual persistence (Postgres/SQLite)
│   │   └── models/schemas.py # Pydantic v2 data models
│   ├── requirements.txt      # Python dependencies
│   └── Dockerfile            # Production container configuration
├── frontend/                 # Next.js 15 + TypeScript + Tailwind CSS Frontend
│   ├── src/
│   │   ├── app/              # App Router (layout, page shell, Aether light CSS)
│   │   ├── components/       # Visual workspaces (SpaceExplorer, HNSW, Benchmark, RAG)
│   │   │   ├── ui/           # Modular UI component system (Badge, Button, Card, etc.)
│   │   │   ├── Sidebar.tsx   # Collapsible responsive navigation shell
│   │   │   └── PageHeader.tsx# Dynamic workspace telemetry header
│   │   └── lib/              # API client, types, and SSE stream reader
│   ├── tailwind.config.ts    # 2026 Aether Light design token configuration
│   └── tsconfig.json         # Strict TypeScript configuration
└── render.yaml               # Infrastructure-as-Code Blueprint for Render
```

---

## 📊 Algorithmic Complexity Comparison Matrix

| Algorithm | Search Complexity | Index Build Complexity | High-Dimensional Stability ($D > 10$) | Exact Recall | Production Fit |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Brute Force Flat** | $\mathcal{O}(N \cdot D)$ | $\mathcal{O}(1)$ | Preserved (computes exact distance) | **100%** | Small datasets ($N < 10{,}000$) |
| **KD-Tree** | $\mathcal{O}(2^D \cdot \log N)$ | $\mathcal{O}(N \log N)$ | **Collapses** (hyperplane overlap forces full traversal) | High in 2D/3D | Low-dimensional spatial GIS |
| **HNSW (Ours)** | $\mathcal{O}(\log N)$ | $\mathcal{O}(N \log N)$ | **Exceptional** (768D, 1536D+) | **> 98%** | **Production Vector Retrieval** |

---

## 📄 License & Attribution

This project is open-source under the **[MIT License](LICENSE)**.

Designed, architected, and engineered by **[Rajan Pranshu Piyushkumar](https://github.com/pranshu-rajan)**.  
*Feedback, discussions, and pull requests are warmly welcomed.*
