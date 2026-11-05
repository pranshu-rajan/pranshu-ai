"use client";

import React, { useState } from "react";
import { SystemStatus } from "../lib/types";
import {
  Compass,
  Layers,
  Activity,
  Sparkles,
  Database,
  Github,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Cpu,
} from "lucide-react";

export interface NavTabItem {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  code: string;
}

export const NAV_TABS: NavTabItem[] = [
  {
    id: "space",
    label: "Space Explorer",
    shortLabel: "Space",
    icon: Compass,
    description: "2D PCA Projection",
    code: "01",
  },
  {
    id: "hnsw",
    label: "HNSW Graph",
    shortLabel: "HNSW",
    icon: Layers,
    description: "Multi-layer Proximity",
    code: "02",
  },
  {
    id: "benchmark",
    label: "Benchmark Arena",
    shortLabel: "Benchmark",
    icon: Activity,
    description: "Search Performance Lab",
    code: "03",
  },
  {
    id: "rag",
    label: "RAG Studio",
    shortLabel: "RAG",
    icon: Sparkles,
    description: "Multi-stage QA Engine",
    code: "04",
  },
  {
    id: "vectors",
    label: "Vector Catalog",
    shortLabel: "Vectors",
    icon: Database,
    description: "Index & Embeddings",
    code: "05",
  },
];

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  status: SystemStatus | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  status,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const getStatusDot = () => {
    if (status?.provider === "groq") return "bg-[#C2410C]"; // Signal Ochre
    if (status?.ollamaAvailable) return "bg-[#0D5F52]"; // Alpine Verdigris
    return "bg-[#0935B8]"; // International Cobalt
  };

  const getStatusText = () => {
    if (status?.provider === "groq") {
      const model = status.genModel ? status.genModel.replace("openai/", "") : "Groq";
      return `Groq • ${model}`;
    }
    if (status?.ollamaAvailable) return `Ollama • ${status.genModel || "Local"}`;
    if (status?.cloudFallbackAvailable) return "Cloud / FastAPI";
    return "FastAPI Engine";
  };

  return (
    <>
      {/* Mobile Topbar */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-white/95 backdrop-blur-md border-b border-[#E3DED6]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-[#111315] text-white">
            <Layers className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="font-bold text-sm text-[#111315] tracking-tight">
              Pranshu&apos;s <span className="text-[#0935B8]">AI</span>
            </span>
            <span className="ml-1.5 rounded bg-[#EDEAE3] border border-[#DCD5C9] px-1 py-0.2 text-[9px] font-mono text-[#555C68]">
              2026
            </span>
          </div>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 rounded border border-[#E3DED6] text-[#403B35] hover:bg-[#EDEAE3] transition"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#111315]/25 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen bg-[#FDFCFA] border-r border-[#E3DED6] flex flex-col justify-between transition-all duration-200 ease-in-out ${
          collapsed ? "w-18" : "w-64"
        } ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Top: Brand Header */}
        <div className="p-3.5 border-b border-[#EBE7DF] flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[#111315] text-white shadow-[0_1px_2px_rgba(17,19,21,0.2)]">
              <Cpu className="h-4 w-4 text-[#EEF3FF]" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-[#111315] tracking-tight truncate">
                    PRANSHU&apos;S <span className="text-[#0935B8]">AI</span>
                  </span>
                  <span className="rounded bg-[#EDEAE3] border border-[#DCD5C9] px-1 py-0.2 text-[9px] font-mono text-[#555C68]">
                    v2.0
                  </span>
                </div>
                <p className="text-[10px] text-[#7E8794] font-mono uppercase tracking-wider truncate">
                  Vector DB & RAG Lab
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex h-6 w-6 items-center justify-center rounded text-[#7E8794] hover:text-[#111315] hover:bg-[#EDEAE3] transition border border-transparent hover:border-[#DCD5C9]"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {/* Middle: Workspaces */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3.5 space-y-1">
          {!collapsed && (
            <div className="px-2.5 pb-2 flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#7E8794]">
                Instruments
              </span>
              <span className="text-[10px] font-mono text-[#A8A090]">
                05
              </span>
            </div>
          )}

          {NAV_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMobileOpen(false);
                }}
                title={collapsed ? tab.label : undefined}
                className={`w-full group relative flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? "bg-[#EDEAE3] text-[#111315] shadow-[inset_0_1px_1px_rgba(17,19,21,0.04)] border border-[#DCD5C9]"
                    : "text-[#555C68] hover:bg-[#F3F1EC] hover:text-[#111315] border border-transparent"
                }`}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-[#0935B8]" />
                )}

                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded transition-colors ${
                    isActive
                      ? "bg-[#0935B8] text-white shadow-[0_1px_2px_rgba(9,53,184,0.2)]"
                      : "bg-[#EDEAE3] text-[#555C68] group-hover:bg-[#E2DDD3] group-hover:text-[#111315]"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>

                {!collapsed && (
                  <div className="text-left min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="truncate font-semibold text-xs text-[#111315]">
                        {tab.label}
                      </span>
                      <span className="text-[10px] font-mono text-[#A8A090]">
                        {tab.code}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#7E8794] truncate font-sans">
                      {tab.description}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom: Hardware Telemetry Bezel */}
        <div className="p-2.5 border-t border-[#EBE7DF] bg-[#FAF9F7] space-y-2">
          {!collapsed ? (
            <div className="p-2.5 rounded-md bg-[#EDEAE3] border border-[#E1DBD0] shadow-[inset_0_1px_1px_rgba(17,19,21,0.04)]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#555C68] flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${getStatusDot()} animate-pulse`} />
                  Engine Telemetry
                </span>
                <span className="text-[9px] font-mono text-[#7E8794] bg-white/70 px-1 py-0.2 rounded border border-[#DCD5C9]">
                  LIVE
                </span>
              </div>
              <p className="text-[10px] text-[#111315] font-mono truncate font-medium">
                {getStatusText()}
              </p>
              <div className="mt-1.5 pt-1.5 border-t border-[#DCD5C9] flex items-center justify-between text-[10px] font-mono text-[#555C68] tabular-nums">
                <span>{status?.demoCount ?? 20} vectors</span>
                <span>{status?.docCount ?? 1} docs</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-1" title={`Engine: ${getStatusText()}`}>
              <span className={`h-2 w-2 rounded-full ${getStatusDot()} animate-pulse`} />
            </div>
          )}

          <div className="flex items-center justify-between pt-0.5 px-1">
            <a
              href="https://github.com/pranshu-rajan/pranshu-ai"
              target="_blank"
              rel="noreferrer"
              className={`flex items-center gap-1.5 text-xs text-[#555C68] hover:text-[#111315] transition ${
                collapsed ? "justify-center w-full" : ""
              }`}
              title="GitHub Repository"
            >
              <Github className="h-3.5 w-3.5 shrink-0" />
              {!collapsed && <span className="text-[11px] font-mono">Source</span>}
            </a>

            {!collapsed && (
              <span className="text-[9px] text-[#7E8794] font-mono border border-[#E3DED6] px-1 rounded bg-white">
                MIT 2026
              </span>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
