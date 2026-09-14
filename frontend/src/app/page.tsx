"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "../components/Navbar";
import { SpaceExplorer } from "../components/SpaceExplorer";
import { HnswInspector } from "../components/HnswInspector";
import { BenchmarkArena } from "../components/BenchmarkArena";
import { RagStudio } from "../components/RagStudio";
import { VectorCatalog } from "../components/VectorCatalog";
import { SystemStatus } from "../lib/types";
import { fetchStatus } from "../lib/api";
import { Database, Cpu, Layers, Sparkles, Activity } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>("space");
  const [status, setStatus] = useState<SystemStatus | null>(null);

  useEffect(() => {
    fetchStatus().then((s) => setStatus(s));
    const interval = setInterval(() => {
      fetchStatus().then((s) => setStatus(s));
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[#08090d]">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} status={status} />

      {/* Main Container */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {/* Quick HUD Metrics Bar */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="glass-panel flex items-center gap-3 rounded-2xl p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Demo Vectors</span>
              <p className="text-base font-bold font-mono text-white">{status?.demoCount ?? 20} (16D)</p>
            </div>
          </div>

          <div className="glass-panel flex items-center gap-3 rounded-2xl p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">RAG Documents</span>
              <p className="text-base font-bold font-mono text-white">{status?.docCount ?? 1} (768D)</p>
            </div>
          </div>

          <div className="glass-panel flex items-center gap-3 rounded-2xl p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Search Engine</span>
              <p className="text-base font-bold font-mono text-white">HNSW Graph</p>
            </div>
          </div>

          <div className="glass-panel flex items-center gap-3 rounded-2xl p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <Cpu className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">AI Provider</span>
              <p className="text-base font-bold font-mono text-white">
                {status?.ollamaAvailable ? "Local Ollama" : "FastAPI Cloud"}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="transition-opacity duration-300">
          {activeTab === "space" && <SpaceExplorer />}
          {activeTab === "hnsw" && <HnswInspector />}
          {activeTab === "benchmark" && <BenchmarkArena />}
          {activeTab === "rag" && <RagStudio />}
          {activeTab === "vectors" && <VectorCatalog />}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#08090d] py-6 text-center text-xs text-gray-500">
        <p>
          VectorDB Pro & Advanced RAG • Designed & Engineered by{" "}
          <strong className="text-gray-300">Rajan Pranshu Piyushkumar</strong>
        </p>
        <p className="mt-1 text-[11px] text-gray-600">
          Built with Next.js 15, Tailwind CSS, TypeScript, FastAPI, and C++ Core Vector Algorithms.
        </p>
      </footer>
    </div>
  );
}
