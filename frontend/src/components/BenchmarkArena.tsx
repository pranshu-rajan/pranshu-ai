"use client";

import React, { useEffect, useState } from "react";
import { BenchmarkResult } from "../lib/types";
import { runBenchmark } from "../lib/api";
import {
  Activity,
  Gauge,
  Flame,
  Clock,
  Sliders,
  CheckCircle2,
  TrendingDown,
  Award,
  Layers,
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
    <div className="flex flex-col gap-6">
      {/* Top Controls Bar */}
      <div className="surface-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Vector Search Benchmark Arena
              </h2>
              <p className="text-xs text-slate-500">
                Real-time latency evaluation: Brute Force O(N) vs KD-Tree O(log N) vs HNSW O(log N)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Top-K Select */}
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs shadow-xs">
              <Sliders className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-slate-500 font-medium">Top-K:</span>
              <select
                value={kVal}
                onChange={(e) => setKVal(Number(e.target.value))}
                className="bg-transparent font-semibold text-slate-800 focus:outline-none"
              >
                <option value={1}>1</option>
                <option value={3}>3</option>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>

            {/* Metric Select */}
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs shadow-xs">
              <span className="text-slate-500 font-medium">Metric:</span>
              <select
                value={metric}
                onChange={(e) => setMetric(e.target.value)}
                className="bg-transparent font-semibold text-indigo-600 focus:outline-none"
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
              icon={<Gauge className="h-4 w-4" />}
            >
              {loading ? "Running 50 Iterations..." : "Run Benchmark"}
            </Button>
          </div>
        </div>
      </div>

      {/* Latency Comparison Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* Brute Force */}
        <div className="surface-card p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Brute Force Flat
            </span>
            <Badge variant="slate" size="xs">O(N)</Badge>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-slate-800">
              {result?.bruteforceUs ?? "--"}
            </span>
            <span className="text-xs font-mono text-slate-400 font-semibold">μs</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Exhaustive linear distance computation.</p>
          <div className="mt-4 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-slate-400 transition-all duration-700 rounded-full"
              style={{
                width: result ? `${(result.bruteforceUs / maxUs) * 100}%` : "50%",
              }}
            />
          </div>
        </div>

        {/* KD-Tree */}
        <div className="surface-card p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
              KD-Tree
            </span>
            <Badge variant="emerald" size="xs">O(log N)</Badge>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-slate-800">
              {result?.kdtreeUs ?? "--"}
            </span>
            <span className="text-xs font-mono text-slate-400 font-semibold">μs</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Orthogonal hyperplane bounding pruning.</p>
          <div className="mt-4 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-teal-500 transition-all duration-700 rounded-full"
              style={{
                width: result ? `${(result.kdtreeUs / maxUs) * 100}%` : "30%",
              }}
            />
          </div>
        </div>

        {/* HNSW Winner Card */}
        <div className="surface-card p-5 relative overflow-hidden border-indigo-200/90 bg-gradient-to-br from-white via-white to-indigo-50/40 shadow-sm shadow-indigo-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Award className="h-4 w-4 text-indigo-600" />
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                HNSW (Production)
              </span>
            </div>
            <Badge variant="indigo" size="xs">
              {hnswSpeedup}x Faster
            </Badge>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-indigo-600">
              {result?.hnswUs ?? "--"}
            </span>
            <span className="text-xs font-mono text-indigo-400 font-semibold">μs</span>
          </div>
          <p className="mt-2 text-xs text-slate-600">
            Multi-layer skip-list small world graph navigation.
          </p>
          <div className="mt-4 h-2 w-full rounded-full bg-indigo-100 overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-700 rounded-full shadow-xs"
              style={{
                width: result ? `${Math.max((result.hnswUs / maxUs) * 100, 6)}%` : "20%",
              }}
            />
          </div>
        </div>
      </div>

      {/* History Trend if multiple runs */}
      {history.length > 1 && (
        <div className="surface-card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-700">Recent Benchmark Runs</span>
            <span className="text-[11px] text-slate-400 font-mono">Last {history.length} iterations</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {history.map((h, i) => (
              <div
                key={i}
                className={`p-2.5 rounded-xl border text-xs font-mono ${
                  i === 0
                    ? "bg-indigo-50/70 border-indigo-200 text-indigo-900"
                    : "bg-slate-50 border-slate-200/80 text-slate-600"
                }`}
              >
                <div className="text-[10px] text-slate-400 mb-1">Run #{history.length - i}</div>
                <div className="flex justify-between text-[11px]">
                  <span>HNSW:</span>
                  <span className="font-bold">{h.hnswUs}μs</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Flat:</span>
                  <span>{h.bruteforceUs}μs</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Algorithmic Complexity Breakdown */}
      <div className="surface-card p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Algorithmic Trade-Off Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-100 text-[11px] text-slate-400 uppercase">
              <tr>
                <th className="pb-3 font-semibold">Algorithm</th>
                <th className="pb-3 font-semibold">Query Complexity</th>
                <th className="pb-3 font-semibold">Build Complexity</th>
                <th className="pb-3 font-semibold">High-Dim Robustness</th>
                <th className="pb-3 font-semibold">Production Fit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50/60 transition">
                <td className="py-3.5 font-semibold text-slate-800">Brute Force</td>
                <td className="py-3.5 font-mono text-slate-700">O(N • D)</td>
                <td className="py-3.5 font-mono text-slate-700">O(1)</td>
                <td className="py-3.5">
                  <Badge variant="emerald" size="xs">Exact 100% Recall</Badge>
                </td>
                <td className="py-3.5 text-slate-400">Small Datasets (&lt;10k)</td>
              </tr>
              <tr className="hover:bg-slate-50/60 transition">
                <td className="py-3.5 font-semibold text-teal-700">KD-Tree</td>
                <td className="py-3.5 font-mono text-slate-700">O(2^D • log N)</td>
                <td className="py-3.5 font-mono text-slate-700">O(N • log N)</td>
                <td className="py-3.5">
                  <Badge variant="amber" size="xs">Degrades when D &gt; 10</Badge>
                </td>
                <td className="py-3.5 text-slate-500">Low-Dim Geospatial (2D/3D)</td>
              </tr>
              <tr className="hover:bg-indigo-50/40 transition">
                <td className="py-3.5 font-bold text-indigo-700">HNSW</td>
                <td className="py-3.5 font-mono font-semibold text-indigo-600">O(log N)</td>
                <td className="py-3.5 font-mono text-slate-700">O(N • log N)</td>
                <td className="py-3.5">
                  <Badge variant="indigo" size="xs">Exceptional (768D+)</Badge>
                </td>
                <td className="py-3.5">
                  <span className="font-semibold text-indigo-700">Pinecone / Weaviate / Chroma</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
