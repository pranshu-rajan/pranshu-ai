export interface VectorItem {
  id: number;
  metadata: string;
  category: string;
  embedding: number[];
}

export interface PcaPoint {
  id: number;
  metadata: string;
  category: string;
  x: number;
  y: number;
}

export interface HnswNode {
  id: number;
  metadata: string;
  category: string;
  maxLyr: number;
}

export interface HnswEdge {
  src: number;
  dst: number;
  lyr: number;
}

export interface HnswGraphData {
  topLayer: number;
  nodeCount: number;
  nodesPerLayer: number[];
  edgesPerLayer: number[];
  nodes: HnswNode[];
  edges: HnswEdge[];
}

export interface BenchmarkResult {
  bruteforceUs: number;
  kdtreeUs: number;
  hnswUs: number;
  itemCount: number;
}

export interface DocumentChunk {
  id: number;
  doc_id?: number;
  title: string;
  text: string;
  distance?: number;
  rrf_score?: number;
  rerank_score?: number;
  manual_score?: number;
  flashrank_score?: number;
  confidence?: "high" | "medium" | "low" | string;
}

export type RerankMode = "contextual" | "flashrank" | "ensemble";

export interface RerankBenchmarkResult {
  query: string;
  chunkCount: number;
  manualCrossEncoderUs: number;
  flashrankNeuralUs: number;
  speedupFactor: number;
  topKAgreementPercent: number;
  bm25LatencyUs: number;
  topManualHits: Array<{ id: number; title: string; score: number }>;
  topFlashrankHits: Array<{ id: number; title: string; score: number }>;
  isFlashrankAvailable: boolean;
}

export interface DocumentItem {
  id: number;
  title: string;
  preview: string;
  chunk_count: number;
  created_at: string;
}

export interface SystemStatus {
  status: string;
  version: string;
  provider: string;
  ollamaAvailable: boolean;
  embedModel: string;
  genModel: string;
  cloudFallbackAvailable: boolean;
  docCount: number;
  demoCount: number;
  demoDims: number;
  docDims: number;
}
