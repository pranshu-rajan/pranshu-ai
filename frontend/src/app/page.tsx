"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";
import { SpaceExplorer } from "../components/SpaceExplorer";
import { HnswInspector } from "../components/HnswInspector";
import { BenchmarkArena } from "../components/BenchmarkArena";
import { RagStudio } from "../components/RagStudio";
import { VectorCatalog } from "../components/VectorCatalog";
import { ObservabilityStudio } from "../components/ObservabilityStudio";
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
            "Cartographic 2D PCA projection of high-dimensional embeddings across semantic categories.",
          badges: [
            { label: `${status?.demoCount ?? 20} VECTORS`, variant: "indigo" as const, dot: true },
            { label: "16D → 2D PROJECTION", variant: "slate" as const },
            { label: "COSINE METRIC", variant: "cyan" as const },
          ],
        };
      case "hnsw":
        return {
          title: "HNSW Proximity Graph",
          subtitle:
            "Hierarchical Navigable Small World multi-layer proximity topology and simulated greedy routing hops.",
          badges: [
            { label: "TOPOLOGY LAYER", variant: "indigo" as const, dot: true },
            { label: "M=16 • EF=64", variant: "slate" as const },
            { label: "O(LOG N) ROUTING", variant: "emerald" as const },
          ],
        };
      case "benchmark":
        return {
          title: "Performance Arena",
          subtitle:
            "Real-time microsecond latency telemetry across Brute-Force Flat, KD-Tree, and HNSW graph search.",
          badges: [
            { label: "TELEMETRY LAB", variant: "amber" as const, dot: true },
            { label: "SUB-MILLISECOND", variant: "emerald" as const },
            { label: "NATIVE COMPUTE", variant: "slate" as const },
          ],
        };
      case "rag":
        return {
          title: "Advanced RAG Studio",
          subtitle:
            "Multi-stage research console: HyDE hypothetical document expansion, BM25 hybrid search, and CRAG confidence.",
          badges: [
            {
              label:
                status?.provider === "groq"
                  ? `GROQ: ${(status.genModel || "").replace("openai/", "").toUpperCase()}`
                  : status?.ollamaAvailable
                  ? `OLLAMA: ${(status.genModel || "LOCAL").toUpperCase()}`
                  : "FASTAPI ENGINE",
              variant: "indigo" as const,
              dot: true,
            },
            { label: `${status?.docCount ?? 1} DOCUMENTS (768D)`, variant: "slate" as const },
            { label: "HYBRID • HYDE • RERANK", variant: "emerald" as const },
          ],
        };
      case "vectors":
        return {
          title: "Vector Catalog & Registry",
          subtitle:
            "Inspect high-dimensional vector embeddings, filter categories, and register new mathematical vectors.",
          badges: [
            { label: `${status?.demoCount ?? 20} INDEXED VECTORS`, variant: "cyan" as const, dot: true },
            { label: "16D & 768D DIMS", variant: "slate" as const },
            { label: "PERSISTENT DB", variant: "emerald" as const },
          ],
        };
      case "observability":
        return {
          title: "Observability, Guardrails & Evals",
          subtitle:
            "Logfire-style distributed execution spans, real-time safety guardrails, and RAGAS metric evaluations.",
          badges: [
            { label: "LOGFIRE SPANS", variant: "indigo" as const, dot: true },
            { label: "JAILBREAK & PII SHIELD", variant: "amber" as const },
            { label: "RAGAS METRICS", variant: "emerald" as const },
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
    <div className="flex min-h-screen bg-[#F7F6F3]">
      {/* Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        status={status}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-7 max-w-7xl w-full mx-auto">
          {/* Dynamic Page Header */}
          <PageHeader
            title={header.title}
            subtitle={header.subtitle}
            badges={header.badges}
          />

          {/* Active Tab View */}
          <div className="animate-fadeIn">
            {activeTab === "space" && <SpaceExplorer />}
            {activeTab === "hnsw" && <HnswInspector />}
            {activeTab === "benchmark" && <BenchmarkArena />}
            {activeTab === "rag" && <RagStudio />}
            {activeTab === "vectors" && <VectorCatalog />}
            {activeTab === "observability" && <ObservabilityStudio />}
          </div>
        </main>

        {/* 2026 Swiss Instrument Footer */}
        <footer className="border-t border-[#E3DED6] bg-[#FAF9F7] py-4 text-center text-xs text-[#555C68]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <p className="font-medium text-[#111315]">
              Pranshu&apos;s AI • Production Vector Database & Advanced RAG System • Authored by{" "}
              <strong className="text-[#0935B8] font-semibold">Rajan Pranshu Piyushkumar</strong>
            </p>
            <p className="mt-1 text-[11px] text-[#7E8794] font-mono tabular-nums">
              Next.js 15 • Tailwind CSS • TypeScript • FastAPI • HNSW • KD-Tree • BM25 • HyDE • CRAG
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
