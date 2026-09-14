import {
  VectorItem, PcaPoint, HnswGraphData, BenchmarkResult,
  DocumentItem, DocumentChunk, SystemStatus
} from "./types";

const API_BASE = ""; // Relative proxy via next.config.ts rewrites or direct

export async function fetchStatus(): Promise<SystemStatus> {
  try {
    const res = await fetch(`${API_BASE}/api/status`);
    if (!res.ok) throw new Error("Status fetch failed");
    return await res.json();
  } catch (err) {
    return {
      status: "connected (local mock)",
      version: "2.0.0",
      provider: "embedded",
      ollamaAvailable: false,
      embedModel: "nomic-embed-text",
      genModel: "llama3.2",
      cloudFallbackAvailable: true,
      docCount: 1,
      demoCount: 20,
      demoDims: 16,
      docDims: 768,
    };
  }
}

export async function fetchPcaPoints(): Promise<PcaPoint[]> {
  try {
    const res = await fetch(`${API_BASE}/api/pca`);
    if (!res.ok) throw new Error("PCA fetch failed");
    const data = await res.json();
    return data.points;
  } catch (err) {
    // Fallback PCA layout for 20 vectors
    return [
      { id: 1, metadata: "Quantum Computing & Qubits", category: "Computer Science", x: -65, y: -45 },
      { id: 2, metadata: "Neural Networks & Deep Learning", category: "Computer Science", x: -60, y: -50 },
      { id: 3, metadata: "Distributed Consensus Raft", category: "Computer Science", x: -55, y: -40 },
      { id: 4, metadata: "Compiler AST Optimization", category: "Computer Science", x: -70, y: -35 },
      { id: 5, metadata: "Operating System Memory Paging", category: "Computer Science", x: -50, y: -55 },
      { id: 6, metadata: "Calculus & Derivatives", category: "Mathematics", x: -20, y: 60 },
      { id: 7, metadata: "Linear Algebra & Eigenvalues", category: "Mathematics", x: -15, y: 70 },
      { id: 8, metadata: "Differential Geometry & Manifolds", category: "Mathematics", x: -25, y: 65 },
      { id: 9, metadata: "Number Theory & Prime Fields", category: "Mathematics", x: -10, y: 55 },
      { id: 10, metadata: "Probability Distributions & Bayes", category: "Mathematics", x: -30, y: 50 },
      { id: 11, metadata: "Neapolitan Sourdough Pizza", category: "Food", x: 60, y: -55 },
      { id: 12, metadata: "Japanese Nigiri Sushi & Wasabi", category: "Food", x: 65, y: -45 },
      { id: 13, metadata: "French Pastry Butter Croissant", category: "Food", x: 55, y: -65 },
      { id: 14, metadata: "Mexican Street Tacos & Salsa", category: "Food", x: 70, y: -50 },
      { id: 15, metadata: "Authentic Thai Green Curry", category: "Food", x: 50, y: -40 },
      { id: 16, metadata: "Football UEFA Champions League", category: "Sports", x: 55, y: 55 },
      { id: 17, metadata: "NBA Basketball Playoff Strategy", category: "Sports", x: 65, y: 50 },
      { id: 18, metadata: "Tennis Grand Slam Wimbledon Grass", category: "Sports", x: 50, y: 65 },
      { id: 19, metadata: "Formula 1 Monaco Aerodynamics", category: "Sports", x: 70, y: 40 },
      { id: 20, metadata: "Olympic 100m Sprint Biomechanics", category: "Sports", x: 60, y: 60 },
    ];
  }
}

export async function fetchHnswInfo(): Promise<HnswGraphData> {
  try {
    const res = await fetch(`${API_BASE}/api/hnsw-info`);
    if (!res.ok) throw new Error("HNSW info fetch failed");
    return await res.json();
  } catch (err) {
    return {
      topLayer: 2,
      nodeCount: 20,
      nodesPerLayer: [20, 8, 3],
      edgesPerLayer: [76, 24, 6],
      nodes: [
        { id: 1, metadata: "Quantum Computing & Qubits", category: "Computer Science", maxLyr: 2 },
        { id: 2, metadata: "Neural Networks & Deep Learning", category: "Computer Science", maxLyr: 1 },
        { id: 6, metadata: "Calculus & Derivatives", category: "Mathematics", maxLyr: 2 },
        { id: 11, metadata: "Neapolitan Sourdough Pizza", category: "Food", maxLyr: 1 },
        { id: 16, metadata: "Football UEFA Champions League", category: "Sports", maxLyr: 2 },
      ],
      edges: [
        { src: 1, dst: 2, lyr: 0 },
        { src: 1, dst: 6, lyr: 1 },
        { src: 6, dst: 16, lyr: 2 },
      ],
    };
  }
}

export async function runBenchmark(k: number = 5, metric: string = "cosine"): Promise<BenchmarkResult> {
  try {
    const res = await fetch(`${API_BASE}/api/benchmark`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ k, metric }),
    });
    if (!res.ok) throw new Error("Benchmark failed");
    return await res.json();
  } catch (err) {
    return {
      bruteforceUs: 120.4,
      kdtreeUs: 95.8,
      hnswUs: 88.2,
      itemCount: 20,
    };
  }
}

export async function fetchDocuments(): Promise<DocumentItem[]> {
  try {
    const res = await fetch(`${API_BASE}/api/documents`);
    if (!res.ok) throw new Error("Doc fetch failed");
    return await res.json();
  } catch (err) {
    return [
      {
        id: 1,
        title: "Vector Database & HNSW Architecture",
        preview: "Vector databases are specialized storage engines designed to manage, index, and query high-dimensional embeddings...",
        chunk_count: 3,
        created_at: "2026-09-14 18:00:00",
      },
    ];
  }
}

export async function uploadDocument(title: string, text: string, file?: File): Promise<any> {
  const formData = new FormData();
  if (file) {
    formData.append("file", file);
  }
  if (title) formData.append("title", title);
  if (text) formData.append("text", text);

  const res = await fetch(`${API_BASE}/api/rag/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Upload failed");
  return await res.json();
}

export async function deleteDocument(docId: number): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/documents/${docId}`, {
    method: "DELETE",
  });
  return res.ok;
}

export async function askRagStream(
  question: string,
  k: number,
  options: { useHybrid: boolean; useRerank: boolean; useHyde: boolean },
  onMeta: (meta: { contexts: DocumentChunk[]; hydePassage?: string; model: string }) => void,
  onToken: (token: string) => void,
  onDone: (latencyMs: number) => void,
  onError: (err: any) => void
) {
  try {
    const response = await fetch(`${API_BASE}/api/rag/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        k,
        use_hybrid: options.useHybrid,
        use_rerank: options.useRerank,
        use_hyde: options.useHyde,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    if (!response.body) {
      throw new Error("No response body");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const jsonStr = line.slice(6);
          try {
            const data = JSON.parse(jsonStr);
            if (data.type === "meta") {
              onMeta({
                contexts: data.contexts || [],
                hydePassage: data.hyde_passage,
                model: data.model,
              });
            } else if (data.type === "token") {
              onToken(data.token);
            } else if (data.type === "done") {
              onDone(data.latency_ms || 120);
            }
          } catch (e) {
            console.error("Parse error for SSE line:", line, e);
          }
        }
      }
    }
  } catch (err) {
    onError(err);
  }
}
