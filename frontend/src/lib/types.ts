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

// ── Security, Observability & Evals Types ─────────────────────────

export interface GuardrailCheckResult {
  is_safe: boolean;
  action: "allow" | "block" | "redact";
  threat_level: "none" | "low" | "medium" | "critical";
  flagged_categories: string[];
  sanitized_text: string;
  refusal_message?: string;
  rule_matches: string[];
  latency_ms: number;
}

export interface GuardrailStats {
  totalChecks: number;
  blockedCount: number;
  redactedCount: number;
  allowedCount: number;
  tripRatePercent: number;
}

export interface ObservabilitySpan {
  id: string;
  name: string;
  duration_ms: number;
  status: "ok" | "error";
  attributes: Record<string, any>;
  error_message?: string;
}

export interface ObservabilityTrace {
  trace_id: string;
  name: string;
  query: string;
  total_duration_ms: number;
  status: string;
  spans: ObservabilitySpan[];
  metadata?: Record<string, any>;
}

export interface ObservabilityStats {
  totalTraces: number;
  avgLatencyMs: number;
  spanBreakdown: Record<string, number>;
  statusCounts: Record<string, number>;
}

export interface GatewayStats {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  cacheHitRatePercent: number;
  fallbacksTriggered: number;
  cachedEntriesCount: number;
}

export interface RagasSampleResult {
  question: string;
  ground_truth: string;
  faithfulness: number;
  answer_relevance: number;
  context_precision: number;
  context_recall: number;
  overall_score: number;
  retrieved_chunk_count: number;
  top_chunk_title: string;
}

export interface RagasEvalSummary {
  timestamp: string;
  datasetSize: number;
  rerankMode: string;
  metrics: {
    faithfulness: number;
    answerRelevance: number;
    contextPrecision: number;
    contextRecall: number;
    compositeScore: number;
  };
  latencyMs: number;
  samples: RagasSampleResult[];
}
