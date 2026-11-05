"use client";

import React, { useEffect, useState } from "react";
import { BenchmarkResult } from "../lib/types";
import { runBenchmark } from "../lib/api";
import {
  Activity,
  Gauge,
  Clock,
  Sliders,
  CheckCircle2,
  TrendingDown,
  Award,
  Layers,
  Cpu,
} from "lucide-react";
import Button from "./ui/Button";
import Badge from "./ui/Badge";

export const BenchmarkArena: React.FC = () => {
  const [result, setResult] = useState<BenchmarkResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [kVal, setKVal] = useState<number>(5);
  const [metric, setMetric] = useState<string>("cosine");
  const [history, setHistory] = useState<BenchmarkResult[]>([]);

  const executeBenchmark = async () => {
    setLoading(true);
    const res = await runBenchmark(kVal, metric);
    setResult(res);
    setHistory((prev) => [res, ...prev.slice(0, 4)]);
    setLoading(false);
  };

  useEffect(() => {
    executeBenchmark();
  }, []);

  const maxUs = result
    ? Math.max(result.bruteforceUs, result.kdtreeUs, result.hnswUs, 1)
    : 100;

  const hnswSpeedup =
    result && result.hnswUs > 0
      ? (result.bruteforceUs / result.hnswUs).toFixed(1)
      : "1.0";

  return (
    <div className="flex flex-col gap-5">
      {/* Top Controls Bar */}
      <div className="surface-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded bg-[#111315] text-[#EEF3FF] shadow-xs">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-[#111315]">
                Vector Search Benchmark Arena
              </h2>
              <p className="text-xs text-[#555C68] font-sans">
                Real-time microsecond telemetry: Brute Force O(N) vs KD-Tree O(log N) vs HNSW O(log N)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Top-K Select */}
            <div className="flex items-center gap-1.5 rounded border border-[#DCD5C9] bg-white px-2.5 py-1 text-xs font-mono shadow-xs">
              <Sliders className="h-3 w-3 text-[#7E8794]" />
              <span className="text-[#7E8794] text-[11px] uppercase">K:</span>
              <select
                value={kVal}
                onChange={(e) => setKVal(Number(e.target.value))}
                className="bg-transparent font-semibold text-[#111315] focus:outline-none cursor-pointer"
              >
                <option value={1}>1</option>
                <option value={3}>3</option>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>

            {/* Metric Select */}
            <div className="flex items-center gap-1.5 rounded border border-[#DCD5C9] bg-white px-2.5 py-1 text-xs font-mono shadow-xs">
              <span className="text-[#7E8794] text-[11px] uppercase">Metric:</span>
              <select
                value={metric}
                onChange={(e) => setMetric(e.target.value)}
                className="bg-transparent font-semibold text-[#0935B8] focus:outline-none cursor-pointer"
              >
                <option value="cosine">Cosine</option>
                <option value="euclidean">Euclidean</option>
                <option value="manhattan">Manhattan</option>
              </select>
            </div>

            {/* Run Button */}
            <Button
              variant="primary"
              size="md"
              onClick={executeBenchmark}
              loading={loading}
              icon={<Gauge className="h-3.5 w-3.5" />}
            >
              {loading ? "EXECUTING (50 ITER)..." : "RUN BENCHMARK"}
            </Button>
          </div>
        </div>
      </div>

      {/* Latency Comparison Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Brute Force */}
        <div className="surface-card p-4 sm:p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#555C68] uppercase tracking-wider font-mono">
              Brute Force Flat
            </span>
            <Badge variant="slate" size="xs">O(N)</Badge>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-[#111315] tabular-nums">
              {result?.bruteforceUs ?? "--"}
            </span>
            <span className="text-xs font-mono text-[#7E8794]">μs</span>
          </div>
          <p className="mt-1 text-[11px] text-[#7E8794] font-sans">
            Exhaustive linear distance scan across all vectors.
          </p>
          <div className="mt-3.5 h-1.5 w-full rounded bg-[#EDEAE3] overflow-hidden">
            <div
              className="h-full bg-[#7E8794] transition-all duration-500 rounded"
              style={{
                width: result ? `${(result.bruteforceUs / maxUs) * 100}%` : "50%",
              }}
            />
          </div>
        </div>

        {/* KD-Tree */}
        <div className="surface-card p-4 sm:p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#0D5F52] uppercase tracking-wider font-mono">
              KD-Tree
            </span>
            <Badge variant="emerald" size="xs">O(log N)</Badge>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-[#111315] tabular-nums">
              {result?.kdtreeUs ?? "--"}
            </span>
            <span className="text-xs font-mono text-[#7E8794]">μs</span>
          </div>
          <p className="mt-1 text-[11px] text-[#7E8794] font-sans">
            Orthogonal hyper-plane bounding tree pruning.
          </p>
          <div className="mt-3.5 h-1.5 w-full rounded bg-[#EDEAE3] overflow-hidden">
            <div
              className="h-full bg-[#0D5F52] transition-all duration-500 rounded"
              style={{
                width: result ? `${(result.kdtreeUs / maxUs) * 100}%` : "30%",
              }}
            />
          </div>
        </div>

        {/* HNSW Winner Card */}
        <div className="surface-card p-4 sm:p-5 relative overflow-hidden border-[#0935B8]/40 border-l-3 border-l-[#0935B8]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-[#0935B8]" />
              <span className="text-[10px] font-bold text-[#0935B8] uppercase tracking-wider font-mono">
                HNSW (High-Dim)
              </span>
            </div>
            <Badge variant="indigo" size="xs">
              {hnswSpeedup}x FASTER
            </Badge>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-[#0935B8] tabular-nums">
              {result?.hnswUs ?? "--"}
            </span>
            <span className="text-xs font-mono text-[#5D94FA]">μs</span>
          </div>
          <p className="mt-1 text-[11px] text-[#555C68] font-sans">
            Multi-layer navigable small-world expressways.
          </p>
          <div className="mt-3.5 h-1.5 w-full rounded bg-[#EDEAE3] overflow-hidden">
            <div
              className="h-full bg-[#0935B8] transition-all duration-500 rounded"
              style={{
                width: result ? `${Math.max((result.hnswUs / maxUs) * 100, 6)}%` : "20%",
              }}
            />
          </div>
        </div>
      </div>

      {/* History Telemetry Runs */}
      {history.length > 1 && (
        <div className="surface-card p-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#555C68]">
              Recent Telemetry Iterations
            </span>
            <span className="text-[10px] text-[#7E8794] font-mono tabular-nums">
              Last {history.length} runs
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {history.map((h, i) => (
              <div
                key={i}
                className={`p-2 rounded border text-xs font-mono ${
                  i === 0
                    ? "bg-[#EEF3FF] border-[#CFDEFE] text-[#0935B8]"
                    : "bg-[#FAF9F7] border-[#E3DED6] text-[#555C68]"
                }`}
              >
                <div className="text-[9px] text-[#7E8794] mb-0.5 font-mono uppercase">
                  Run #{history.length - i}
                </div>
                <div className="flex justify-between text-[11px] tabular-nums">
                  <span>HNSW:</span>
                  <span className="font-bold">{h.hnswUs}μs</span>
                </div>
                <div className="flex justify-between text-[10px] text-[#7E8794] tabular-nums">
                  <span>Flat:</span>
                  <span>{h.bruteforceUs}μs</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Algorithmic Complexity Breakdown */}
      <div className="surface-card p-4 sm:p-5">
        <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-[#111315] mb-3">
          Algorithmic Complexity & Hardware Trade-Off Matrix
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#555C68]">
            <thead className="border-b border-[#E3DED6] text-[10px] font-mono text-[#7E8794] uppercase tracking-wider">
              <tr>
                <th className="pb-2.5 font-semibold">Algorithm</th>
                <th className="pb-2.5 font-semibold">Search Complexity</th>
                <th className="pb-2.5 font-semibold">Build Index Complexity</th>
                <th className="pb-2.5 font-semibold">Curse of Dimensionality</th>
                <th className="pb-2.5 font-semibold">Production Architecture</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBE7DF]">
              <tr className="hover:bg-[#FAF9F7] transition">
                <td className="py-2.5 font-semibold text-[#111315]">Brute Force Flat</td>
                <td className="py-2.5 font-mono text-[#111315]">O(N • D)</td>
                <td className="py-2.5 font-mono text-[#7E8794]">O(1)</td>
                <td className="py-2.5">
                  <Badge variant="emerald" size="xs">EXACT 100% RECALL</Badge>
                </td>
                <td className="py-2.5 text-[#7E8794] font-mono text-[11px]">Small Datasets (&lt;10k items)</td>
              </tr>
              <tr className="hover:bg-[#FAF9F7] transition">
                <td className="py-2.5 font-semibold text-[#0D5F52]">KD-Tree</td>
                <td className="py-2.5 font-mono text-[#111315]">O(2^D • log N)</td>
                <td className="py-2.5 font-mono text-[#7E8794]">O(N • log N)</td>
                <td className="py-2.5">
                  <Badge variant="amber" size="xs">DEGRADES WHEN D &gt; 10</Badge>
                </td>
                <td className="py-2.5 text-[#555C68] font-mono text-[11px]">Geospatial / 2D / 3D Spatial Maps</td>
              </tr>
              <tr className="hover:bg-[#EEF3FF]/40 transition">
                <td className="py-2.5 font-bold text-[#0935B8]">HNSW Graph</td>
                <td className="py-2.5 font-mono font-bold text-[#0935B8]">O(log N)</td>
                <td className="py-2.5 font-mono text-[#7E8794]">O(N • log N)</td>
                <td className="py-2.5">
                  <Badge variant="indigo" size="xs">EXCEPTIONAL (768D+)</Badge>
                </td>
                <td className="py-2.5">
                  <span className="font-semibold text-[#0935B8] font-mono text-[11px]">
                    Production Standard (Pinecone / Weaviate / Chroma)
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
