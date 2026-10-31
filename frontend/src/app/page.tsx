"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";
import { SpaceExplorer } from "../components/SpaceExplorer";
import { HnswInspector } from "../components/HnswInspector";
import { BenchmarkArena } from "../components/BenchmarkArena";
import { RagStudio } from "../components/RagStudio";
import { VectorCatalog } from "../components/VectorCatalog";
import { SystemStatus } from "../lib/types";
import { fetchStatus } from "../lib/api";

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

  const getHeaderProps = () => {
    switch (activeTab) {
      case "space":
        return {
          title: "Vector Space Explorer",
          subtitle:
            "Interactive 2D PCA projection of high-dimensional embeddings across semantic categories.",
          badges: [
            { label: `${status?.demoCount ?? 20} Vectors`, variant: "indigo" as const, dot: true },
            { label: "16D → 2D PCA", variant: "slate" as const },
            { label: "Cosine Metric", variant: "cyan" as const },
          ],
        };
      case "hnsw":
        return {
          title: "HNSW Proximity Graph",
          subtitle:
            "Explore multi-layer Hierarchical Navigable Small World graphs and simulate greedy routing hops.",
          badges: [
            { label: "Multi-layer Graph", variant: "violet" as const, dot: true },
            { label: "M=16 • ef=64", variant: "slate" as const },
            { label: "O(log N) Routing", variant: "emerald" as const },
          ],
        };
      case "benchmark":
        return {
          title: "Performance Arena",
          subtitle:
            "Real-time latency and recall comparison across Brute Force Flat, KD-Tree, and HNSW graph search.",
          badges: [
            { label: "Latency Benchmark", variant: "amber" as const, dot: true },
            { label: "Sub-millisecond", variant: "emerald" as const },
            { label: "Real-time Native", variant: "slate" as const },
          ],
        };
      case "rag":
        return {
          title: "Advanced RAG Studio",
          subtitle:
            "Multi-stage QA pipeline with HyDE hypothetical document expansion, BM25 hybrid search, and reranking.",
          badges: [
            {
              label:
                status?.provider === "groq"
                  ? `Groq: ${(status.genModel || "").replace("openai/", "")}`
                  : status?.ollamaAvailable
                  ? `Ollama: ${status.genModel || "Local"}`
                  : "Engine: FastAPI",
              variant: "indigo" as const,
              dot: true,
            },
            { label: `${status?.docCount ?? 1} Documents (768D)`, variant: "violet" as const },
            { label: "Hybrid + HyDE + Rerank", variant: "emerald" as const },
          ],
        };
      case "vectors":
        return {
          title: "Vector Catalog & Registry",
          subtitle:
            "Browse, filter, inspect embedding dimensions, and register new vectors into the index.",
          badges: [
            { label: `${status?.demoCount ?? 20} Indexed Vectors`, variant: "cyan" as const, dot: true },
            { label: "16-dim & 768-dim", variant: "slate" as const },
            { label: "Persistent Storage", variant: "emerald" as const },
          ],
        };
      default:
        return {
          title: "Vector Database",
          subtitle: "High-performance vector search engine",
          badges: [],
        };
    }
  };

  const header = getHeaderProps();

  return (
    <div className="flex min-h-screen bg-[#FAFBFD]">
      {/* Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        status={status}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Dynamic Page Header */}
          <PageHeader
            title={header.title}
            subtitle={header.subtitle}
            badges={header.badges}
          />

          {/* Active Tab View */}
          <div className="animate-fade-in">
            {activeTab === "space" && <SpaceExplorer />}
            {activeTab === "hnsw" && <HnswInspector />}
            {activeTab === "benchmark" && <BenchmarkArena />}
            {activeTab === "rag" && <RagStudio />}
            {activeTab === "vectors" && <VectorCatalog />}
          </div>
        </main>

        {/* Clean Light Footer */}
        <footer className="border-t border-slate-200/80 bg-white/50 py-5 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <p className="font-medium text-slate-600">
              Pranshu&apos;s AI • Production Vector Database & Advanced RAG • Designed & Engineered by{" "}
              <strong className="text-slate-800 font-semibold">Rajan Pranshu Piyushkumar</strong>
            </p>
            <p className="mt-1 text-[11px] text-slate-400 font-mono">
              Next.js 15 • Tailwind CSS • TypeScript • FastAPI • HNSW • KD-Tree • BM25 • HyDE
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
