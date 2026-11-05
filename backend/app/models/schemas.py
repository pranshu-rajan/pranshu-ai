from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class VectorItemSchema(BaseModel):
    id: int
    metadata: str
    category: str
    embedding: List[float]

class VectorInsertRequest(BaseModel):
    metadata: str
    category: str
    embedding: List[float]

class VectorSearchRequest(BaseModel):
    vector: List[float]
    k: int = Field(default=5, ge=1, le=100)
    metric: str = Field(default="cosine", pattern="^(cosine|euclidean|manhattan)$")
    algorithm: str = Field(default="hnsw", pattern="^(hnsw|kdtree|bruteforce)$")

class VectorSearchResult(BaseModel):
    id: int
    metadata: str
    category: str
    distance: float

class BenchmarkRequest(BaseModel):
    vector: Optional[List[float]] = None
    k: int = 5
    metric: str = "cosine"

class BenchmarkResponse(BaseModel):
    bruteforceUs: float
    kdtreeUs: float
    hnswUs: float
    itemCount: int

class HnswNodeInfo(BaseModel):
    id: int
    metadata: str
    category: str
    maxLyr: int

class HnswEdgeInfo(BaseModel):
    src: int
    dst: int
    lyr: int

class HnswGraphResponse(BaseModel):
    topLayer: int
    nodeCount: int
    nodesPerLayer: List[int]
    edgesPerLayer: List[int]
    nodes: List[HnswNodeInfo]
    edges: List[HnswEdgeInfo]

class PcaPoint(BaseModel):
    id: int
    metadata: str
    category: str
    x: float
    y: float

class PcaResponse(BaseModel):
    points: List[PcaPoint]

# Advanced RAG Schemas
class DocumentUploadRequest(BaseModel):
    title: str
    text: str
    tags: Optional[str] = "general"

class DocumentChunk(BaseModel):
    id: int
    doc_id: int
    title: str
    text: str
    distance: Optional[float] = None
    rerank_score: Optional[float] = None
    manual_score: Optional[float] = None
    flashrank_score: Optional[float] = None
    confidence: Optional[str] = None

class DocumentItem(BaseModel):
    id: int
    title: str
    preview: str
    chunk_count: int
    created_at: str

class RagQueryRequest(BaseModel):
    question: str
    k: int = Field(default=4, ge=1, le=20)
    use_hybrid: bool = True
    use_rerank: bool = True
    use_hyde: bool = False
    rerank_mode: Optional[str] = Field(default="ensemble", pattern="^(contextual|flashrank|ensemble)$")
    stream: bool = True

class RagResponse(BaseModel):
    answer: str
    model: str
    provider: str
    latency_ms: float
    contexts: List[DocumentChunk]
    docCount: int
    hyde_document: Optional[str] = None

class StatusResponse(BaseModel):
    status: str
    version: str
    provider: str
    ollamaAvailable: bool
    embedModel: str
    genModel: str
    cloudFallbackAvailable: bool
    docCount: int
    demoCount: int
    demoDims: int
    docDims: int

# Security, Observability & Evals Schemas
class GuardrailCheckRequest(BaseModel):
    text: str

class GuardrailCheckResponse(BaseModel):
    is_safe: bool
    action: str
    threat_level: str
    flagged_categories: List[str]
    sanitized_text: str
    refusal_message: Optional[str] = None
    rule_matches: List[str] = []
    latency_ms: float

class ObservabilitySpanSchema(BaseModel):
    id: str
    name: str
    duration_ms: float
    status: str
    attributes: Dict[str, Any] = {}
    error_message: Optional[str] = None

class ObservabilityTraceSchema(BaseModel):
    trace_id: str
    name: str
    query: str
    total_duration_ms: float
    status: str
    spans: List[ObservabilitySpanSchema] = []
    metadata: Dict[str, Any] = {}

class RagasMetricsSchema(BaseModel):
    faithfulness: float
    answerRelevance: float
    contextPrecision: float
    contextRecall: float
    compositeScore: float

class RagasEvalResponse(BaseModel):
    timestamp: str
    datasetSize: int
    rerankMode: str
    metrics: RagasMetricsSchema
    latencyMs: float
    samples: List[Dict[str, Any]] = []
