"use client";

import React from "react";
import { SystemStatus } from "../lib/types";
import { Activity, Database, Cpu, Layers, GitBranch, Github, Sparkles } from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  status: SystemStatus | null;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, status }) => {
  const tabs = [
    { id: "space", label: "2D Space Radar", icon: Cpu },
    { id: "hnsw", label: "HNSW Graph", icon: Layers },
    { id: "benchmark", label: "Benchmark Arena", icon: Activity },
    { id: "rag", label: "Advanced RAG Studio", icon: Sparkles },
    { id: "vectors", label: "Vector Index", icon: Database },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#08090d]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-500 shadow-glow">
            <Layers className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-white sm:text-lg">
                Pranshu&apos;s <span className="neon-text-cyan">AI</span>
              </span>
              <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-400">
                v2.0 2026
              </span>
            </div>
            <p className="hidden text-xs text-gray-400 sm:block">
              Vector Database • HNSW • Groq Powered Advanced RAG
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex items-center gap-1 rounded-xl border border-white/10 bg-[#0f111a]/90 p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all sm:text-sm ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 shadow-sm border border-cyan-500/30"
                    : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-cyan-400" : "text-gray-400"}`} />
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* System HUD Status & Github */}
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-[#12141c] px-3 py-1 text-xs text-gray-300 lg:flex">
            <span
              className={`h-2 w-2 rounded-full ${
                status?.provider === "groq"
                  ? "bg-amber-400 shadow-[0_0_8px_#f59e0b]"
                  : status?.ollamaAvailable
                  ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                  : "bg-cyan-400 shadow-[0_0_8px_#06b6d4]"
              }`}
            />
            <span className="font-mono text-[11px]">
              {status?.provider === "groq"
                ? `Groq: ${status.genModel}`
                : status?.ollamaAvailable
                ? `Ollama: ${status.genModel}`
                : status?.cloudFallbackAvailable
                ? "Engine: Cloud/FastAPI"
                : "Engine: Native HNSW"}
            </span>
          </div>

          <a
            href="https://github.com/pranshu-rajan/pranshu-ai"
            target="_blank"
            rel="noreferrer"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
            title="GitHub Repository"
          >
            <Github className="h-4 w-4" />
          </a>
        </div>
      </div>
    </header>
  );
};
