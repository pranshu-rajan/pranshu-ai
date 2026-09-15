# Pranshu's AI — Vector Database & Advanced RAG Studio

> **A Production-Grade Full-Stack Vector Database and Advanced RAG Knowledge Engine built from scratch.**  
> Powered by **Groq Cloud Inference (`llama-3.3-70b-versatile`)**, native **C++ & Async Python HNSW**, **KD-Tree**, **Hybrid Search (Dense + BM25 via Reciprocal Rank Fusion)**, **Contextual Reranking**, and an interactive 2026 Next.js 15 cyber-glassmorphic frontend.

Developed and engineered by **[Rajan Pranshu Piyushkumar](https://github.com/pranshu-rajan)**.

---

## ⚡ Groq Cloud Integration (Fastest LLM Inference)

**Pranshu's AI** leverages **Groq LPU™ Inference Engine** to deliver ultra-fast streaming responses at **300–500 tokens/second**:
- **Default Model**: `openai/gpt-oss-120b` (Next-gen open-weight 120B reasoning model).
- **Alternative Fast Models**: `llama-3.3-70b-versatile`, `llama-3.1-8b-instant`.
- **Zero Local Hardware Requirement**: Runs 100% in the cloud without requiring a local GPU or local Ollama.
- **Get Free API Key**: [Groq Console](https://console.groq.com/keys) (Takes 30 seconds).

---

## 🌐 Complete Step-by-Step Cloud Deployment Guide

Follow this guide to deploy the entire full-stack system live to the web.

```
                  ┌───────────────────────────────┐
                  │    Next.js 15 Frontend        │
                  │     Deployed on VERCEL        │
                  └──────────────┬────────────────┘
                                 │ HTTPS / SSE
                                 ▼
                  ┌───────────────────────────────┐
                  │      FastAPI Backend          │
                  │   Deployed on RENDER / RAILWAY│
                  └──────────────┬────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
       ┌──────────────────┐            ┌───────────────────┐
       │   Groq API Cloud │            │ Native HNSW Index │
       │ (LLaMA 3.3 70B)  │            │ (Persistent SQLite│
       └──────────────────┘            └───────────────────┘
```

### Step 1: Get your Free Groq API Key
1. Go to [https://console.groq.com/keys](https://console.groq.com/keys).
2. Sign in with GitHub or Google.
3. Click **"Create API Key"**, label it `pranshus-ai`, and copy the key (format: `gsk_...`).

---

### Step 2: Deploy the Backend (Render or Railway)

#### Option A: Deploy on [Render](https://render.com) (Free Tier Available)
1. Fork or push this repository to your GitHub: `https://github.com/pranshu-rajan/pranshu-ai`.
2. Go to your [Render Dashboard](https://dashboard.render.com/) and click **"New +"** → **"Web Service"**.
3. Select your GitHub repository (`pranshu-ai`).
4. Configure the Web Service:
   - **Name**: `pranshus-ai-backend`
   - **Region**: Oregon (US West) or Frankfurt
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Under **Environment Variables**, add:
   - `GROQ_API_KEY`: `gsk_...` (your Groq API key)
   - `GROQ_MODEL`: `openai/gpt-oss-120b`
6. Click **"Deploy Web Service"**.
7. Once deployed, copy your backend URL (e.g., `https://pranshus-ai-backend.onrender.com`).
   - Test it by visiting `https://pranshus-ai-backend.onrender.com/health` in your browser.

#### Option B: Deploy on [Railway](https://railway.app)
1. Go to [Railway Dashboard](https://railway.app) and click **"New Project"** → **"Deploy from GitHub repo"**.
2. Select your repository.
3. In service settings, set **Root Directory** to `/backend`.
4. Add environment variables:
   - `GROQ_API_KEY`: `gsk_...`
5. Railway will automatically detect the Python environment or Dockerfile and deploy!

---

### Step 3: Deploy the Frontend to [Vercel](https://vercel.com)

1. Go to [Vercel Dashboard](https://vercel.com/new) and click **"Add New Project"**.
2. Import your GitHub repository: `pranshu-rajan/pranshu-ai`.
3. Configure the project settings:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click **Edit** and select `frontend`.
4. In the **Environment Variables** section, add:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: Your live backend URL from Step 2 (e.g. `https://pranshus-ai-backend.onrender.com` without trailing slash).
5. Click **"Deploy"**.
6. Vercel will build and publish your app in ~60 seconds to a live URL (e.g. `https://pranshus-ai.vercel.app`).

---

### Step 4: Run Full-Stack Locally (Optional)

#### Using Docker Compose (1-Command):
```bash
# 1. Create .env file in backend/ with your Groq API key:
echo "GROQ_API_KEY=gsk_your_key_here" > backend/.env

# 2. Launch full stack:
docker-compose up --build
```
- **Frontend**: `http://localhost:3000`
- **FastAPI Backend**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`

#### Running Manually:
```bash
# Terminal 1: Backend
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows (or 'source .venv/bin/activate' on Linux/Mac)
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
```

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
│   │   ├── config.py         # Settings with Groq API configuration
│   │   ├── api/endpoints.py  # REST & streaming endpoints
│   │   ├── rag/              # Advanced RAG (BM25, RRF, Reranker, HyDE)
│   │   ├── rag/llm_client.py # Multi-provider LLM client (Groq-first)
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

## 📄 License
MIT License. Created and maintained by **[Rajan Pranshu Piyushkumar](https://github.com/pranshu-rajan)**.

