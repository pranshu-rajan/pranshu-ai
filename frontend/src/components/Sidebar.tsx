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
  Radio,
} from "lucide-react";

export interface NavTabItem {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

export const NAV_TABS: NavTabItem[] = [
  {
    id: "space",
    label: "Space Explorer",
    shortLabel: "Space",
    icon: Compass,
    description: "2D PCA Projection",
  },
  {
    id: "hnsw",
    label: "HNSW Graph",
    shortLabel: "HNSW",
    icon: Layers,
    description: "Multi-layer Proximity",
  },
  {
    id: "benchmark",
    label: "Benchmark Arena",
    shortLabel: "Benchmark",
    icon: Activity,
    description: "Search Performance Lab",
  },
  {
    id: "rag",
    label: "RAG Studio",
    shortLabel: "RAG",
    icon: Sparkles,
    description: "Multi-stage QA Engine",
  },
  {
    id: "vectors",
    label: "Vector Catalog",
    shortLabel: "Vectors",
    icon: Database,
    description: "Index & Embeddings",
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

  const getStatusColor = () => {
    if (status?.provider === "groq") return "bg-amber-500";
    if (status?.ollamaAvailable) return "bg-emerald-500";
    return "bg-indigo-500";
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
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white shadow-sm">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <span className="font-bold text-sm text-slate-900 tracking-tight">
              Pranshu&apos;s <span className="text-indigo-600">AI</span>
            </span>
            <span className="ml-1.5 rounded-full bg-indigo-50 border border-indigo-200/60 px-1.5 py-0.2 text-[10px] font-medium text-indigo-700">
              v2.0
            </span>
          </div>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen bg-white border-r border-slate-200/80 flex flex-col justify-between transition-all duration-300 ease-in-out ${
          collapsed ? "w-20" : "w-64"
        } ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Top: Brand Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white shadow-sm shadow-indigo-600/20">
              <Layers className="h-5 w-5" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base text-slate-900 tracking-tight truncate">
                    Pranshu&apos;s <span className="text-indigo-600">AI</span>
                  </span>
                  <span className="rounded-full bg-indigo-50 border border-indigo-200/60 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                    2026
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate">
                  Vector DB & Advanced RAG
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Middle: Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {!collapsed && (
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Workspaces
            </p>
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
                className={`w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-indigo-50/90 text-indigo-700 shadow-xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-xs shadow-indigo-600/30"
                      : "bg-slate-100 text-slate-500 group-hover:bg-slate-200/60 group-hover:text-slate-800"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>

                {!collapsed && (
                  <div className="text-left min-w-0 flex-1">
                    <div className="truncate font-semibold text-xs text-slate-900">
                      {tab.label}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {tab.description}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom: System Status & Github */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-2">
          {!collapsed ? (
            <div className="p-2.5 rounded-xl bg-white border border-slate-200/70 shadow-xs">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`h-2 w-2 rounded-full ${getStatusColor()} animate-pulse`} />
                <span className="text-[11px] font-semibold text-slate-700 truncate">
                  Engine Status
                </span>
              </div>
              <p className="text-[10px] text-slate-500 truncate font-mono">
                {getStatusText()}
              </p>
              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <span>{status?.demoCount ?? 20} vectors</span>
                <span>{status?.docCount ?? 1} docs</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-2" title={`Engine: ${getStatusText()}`}>
              <span className={`h-2.5 w-2.5 rounded-full ${getStatusColor()} animate-pulse`} />
            </div>
          )}

          <div className="flex items-center justify-between pt-1 px-1">
            <a
              href="https://github.com/pranshu-rajan/pranshu-ai"
              target="_blank"
              rel="noreferrer"
              className={`flex items-center gap-2 text-xs text-slate-500 hover:text-slate-900 transition ${
                collapsed ? "justify-center w-full" : ""
              }`}
              title="GitHub Repository"
            >
              <Github className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Source Code</span>}
            </a>

            {!collapsed && (
              <span className="text-[10px] text-slate-400 font-mono">MIT</span>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

