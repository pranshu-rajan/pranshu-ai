"use client";

import React, { useEffect, useState } from "react";
import { BenchmarkResult } from "../lib/types";
import { runBenchmark } from "../lib/api";
import { Activity, Gauge, Flame, Clock, Sliders, CheckCircle2 } from "lucide-react";

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
      {/* Top Banner with Controls */}
      <div className="glass-panel flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white sm:text-lg">
              Vector Search Benchmark Arena
            </h2>
          </div>
          <p className="text-xs text-gray-400">
            Real-time latency evaluation: Brute Force O(N) vs KD-Tree O(log N) vs HNSW O(log N)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Top-K Select */}
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#12141c] px-3 py-1.5 text-xs">
            <Sliders className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-gray-400">Top-K:</span>
            <select
              value={kVal}
              onChange={(e) => setKVal(Number(e.target.value))}
              className="bg-transparent font-semibold text-white focus:outline-none"
            >
              <option value={1}>1</option>
              <option value={3}>3</option>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>

          {/* Metric Select */}
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#12141c] px-3 py-1.5 text-xs">
            <span className="text-gray-400">Metric:</span>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              className="bg-transparent font-semibold text-cyan-300 focus:outline-none"
            >
              <option value="cosine">Cosine</option>
              <option value="euclidean">Euclidean</option>
              <option value="manhattan">Manhattan</option>
            </select>
          </div>

          {/* Run Button */}
          <button
            onClick={executeBenchmark}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-glow transition hover:from-cyan-400 hover:to-indigo-500 active:scale-95 disabled:opacity-50"
          >
            <Gauge className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span>{loading ? "Running 50 Iterations..." : "Run Benchmark"}</span>
          </button>
        </div>
      </div>

      {/* Latency Comparison Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Brute Force */}
        <div className="glass-panel relative overflow-hidden rounded-2xl p-5 border-rose-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
              Brute Force
            </span>
            <span className="font-mono text-xs text-gray-500">O(N)</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-white">
              {result?.bruteforceUs ?? "--"}
            </span>
            <span className="text-xs font-mono text-gray-400">μs</span>
          </div>
          <p className="mt-2 text-xs text-gray-400">Exhaustive linear distance computation.</p>
          <div className="mt-4 h-2 w-full rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full bg-rose-500 transition-all duration-700 rounded-full"
              style={{
                width: result ? `${(result.bruteforceUs / maxUs) * 100}%` : "50%",
              }}
            />
          </div>
        </div>

        {/* KD-Tree */}
        <div className="glass-panel relative overflow-hidden rounded-2xl p-5 border-amber-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              KD-Tree
            </span>
            <span className="font-mono text-xs text-gray-500">O(log N)</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-white">
              {result?.kdtreeUs ?? "--"}
            </span>
            <span className="text-xs font-mono text-gray-400">μs</span>
          </div>
          <p className="mt-2 text-xs text-gray-400">Orthogonal hyperplane bounding pruning.</p>
          <div className="mt-4 h-2 w-full rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-700 rounded-full"
              style={{
                width: result ? `${(result.kdtreeUs / maxUs) * 100}%` : "30%",
              }}
            />
          </div>
        </div>

        {/* HNSW */}
        <div className="glass-panel-glow relative overflow-hidden rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Flame className="h-4 w-4 text-cyan-400" />
              <span className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                HNSW (Production)
              </span>
            </div>
            <span className="rounded bg-cyan-500/20 px-2 py-0.5 font-mono text-[10px] text-cyan-300">
              {hnswSpeedup}x Faster
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-cyan-300">
              {result?.hnswUs ?? "--"}
            </span>
            <span className="text-xs font-mono text-cyan-400/80">μs</span>
          </div>
          <p className="mt-2 text-xs text-cyan-200/70">
            Multilayer skip-list small world graph navigation.
          </p>
          <div className="mt-4 h-2 w-full rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all duration-700 rounded-full shadow-glow"
              style={{
                width: result ? `${(result.hnswUs / maxUs) * 100}%` : "20%",
              }}
            />
          </div>
        </div>
      </div>

      {/* Algorithmic Complexity Breakdown */}
      <div className="glass-panel rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Algorithmic Trade-Off Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="border-b border-white/10 text-[11px] text-gray-400 uppercase">
              <tr>
                <th className="pb-3 font-semibold">Algorithm</th>
                <th className="pb-3 font-semibold">Query Complexity</th>
                <th className="pb-3 font-semibold">Build Complexity</th>
                <th className="pb-3 font-semibold">High-Dim Robustness</th>
                <th className="pb-3 font-semibold">Production Fit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr>
                <td className="py-3 font-medium text-rose-400">Brute Force</td>
                <td className="py-3 font-mono">O(N • D)</td>
                <td className="py-3 font-mono">O(1)</td>
                <td className="py-3 text-emerald-400">Exact 100% Recall</td>
                <td className="py-3 text-gray-500">Toy / Small Datasets</td>
              </tr>
              <tr>
                <td className="py-3 font-medium text-amber-400">KD-Tree</td>
                <td className="py-3 font-mono">O(2^D • log N)</td>
                <td className="py-3 font-mono">O(N • log N)</td>
                <td className="py-3 text-rose-400">Degrades when D &gt; 10</td>
                <td className="py-3 text-gray-400">Low-Dim Geospatial</td>
              </tr>
              <tr>
                <td className="py-3 font-medium text-cyan-300">HNSW</td>
                <td className="py-3 font-mono">O(log N)</td>
                <td className="py-3 font-mono">O(N • log N)</td>
                <td className="py-3 text-emerald-400">Exceptional (768D+)</td>
                <td className="py-3 text-cyan-400 font-semibold">Pinecone / Weaviate / Chroma</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
