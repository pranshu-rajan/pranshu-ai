import time
import uuid
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field, asdict

@dataclass
class Span:
    id: str
    name: str
    start_time: float
    end_time: Optional[float] = None
    duration_ms: float = 0.0
    status: str = "ok"  # "ok" | "error"
    attributes: Dict[str, Any] = field(default_factory=dict)
    error_message: Optional[str] = None

    def finish(self, status: str = "ok", error: Optional[str] = None):
        self.end_time = time.perf_counter()
        self.duration_ms = round((self.end_time - self.start_time) * 1000, 3)
        self.status = status
        if error:
            self.error_message = error

    def set_attribute(self, key: str, value: Any):
        self.attributes[key] = value

class SpanContext:
    def __init__(self, trace: "Trace", name: str, attributes: Optional[Dict[str, Any]] = None):
        self.trace = trace
        self.span = Span(
            id=str(uuid.uuid4())[:8],
            name=name,
            start_time=time.perf_counter(),
            attributes=attributes or {}
        )

    def __enter__(self) -> Span:
        return self.span

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            self.span.finish(status="error", error=str(exc_val))
        else:
            self.span.finish(status="ok")
        self.trace.spans.append(self.span)
        return False

class Trace:
    def __init__(self, trace_id: str, name: str, query: str = ""):
        self.trace_id = trace_id
        self.name = name
        self.query = query
        self.start_time = time.perf_counter()
        self.end_time: Optional[float] = None
        self.total_duration_ms: float = 0.0
        self.status: str = "running"
        self.spans: List[Span] = []
        self.metadata: Dict[str, Any] = {}

    def span(self, name: str, attributes: Optional[Dict[str, Any]] = None) -> SpanContext:
        return SpanContext(self, name, attributes)

    def finish(self, status: str = "ok"):
        self.end_time = time.perf_counter()
        self.total_duration_ms = round((self.end_time - self.start_time) * 1000, 2)
        self.status = status

    def to_dict(self) -> Dict[str, Any]:
        return {
            "trace_id": self.trace_id,
            "name": self.name,
            "query": self.query,
            "total_duration_ms": self.total_duration_ms,
            "status": self.status,
            "metadata": self.metadata,
            "spans": [asdict(s) for s in self.spans]
        }

class TraceManager:
    """
    Logfire / OpenTelemetry-compatible In-Memory Distributed Tracer.
    Collects execution waterfall telemetry across all RAG pipeline stages.
    """
    def __init__(self, max_history: int = 50):
        self.max_history = max_history
        self.traces: List[Trace] = []
        self.active_traces: Dict[str, Trace] = {}

    def start_trace(self, name: str = "rag_query", query: str = "") -> Trace:
        t_id = f"trc-{uuid.uuid4().hex[:10]}"
        trace = Trace(trace_id=t_id, name=name, query=query)
        self.active_traces[t_id] = trace
        return trace

    def end_trace(self, trace: Trace, status: str = "ok"):
        trace.finish(status=status)
        if trace.trace_id in self.active_traces:
            del self.active_traces[trace.trace_id]
        
        self.traces.insert(0, trace)
        if len(self.traces) > self.max_history:
            self.traces = self.traces[:self.max_history]

    def get_recent_traces(self, limit: int = 20) -> List[Dict[str, Any]]:
        return [t.to_dict() for t in self.traces[:limit]]

    def get_stats(self) -> Dict[str, Any]:
        if not self.traces:
            return {
                "totalTraces": 0,
                "avgLatencyMs": 0.0,
                "spanBreakdown": {},
                "statusCodes": {"ok": 0, "error": 0}
            }

        total = len(self.traces)
        avg_lat = sum(t.total_duration_ms for t in self.traces) / total
        
        span_durations: Dict[str, List[float]] = {}
        status_counts = {"ok": 0, "error": 0}

        for t in self.traces:
            status_counts[t.status] = status_counts.get(t.status, 0) + 1
            for s in t.spans:
                span_durations.setdefault(s.name, []).append(s.duration_ms)

        avg_spans = {
            s_name: round(sum(durs) / len(durs), 2)
            for s_name, durs in span_durations.items()
        }

        return {
            "totalTraces": total,
            "avgLatencyMs": round(avg_lat, 2),
            "spanBreakdown": avg_spans,
            "statusCounts": status_counts
        }

tracer = TraceManager()
