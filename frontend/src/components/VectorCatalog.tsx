"use client";

import React, { useState, useEffect } from "react";
import { VectorItem } from "../lib/types";
import { fetchVectors, insertVector, deleteVector } from "../lib/api";
import {
  Database,
  Plus,
  Trash2,
  Search,
  Eye,
  LayoutGrid,
  List,
  X,
  Layers,
  Sparkles,
} from "lucide-react";
import Button from "./ui/Button";
import Badge, { BadgeVariant } from "./ui/Badge";
import EmptyState from "./ui/EmptyState";

const categoryBadgeVariant: Record<string, BadgeVariant> = {
  "Computer Science": "indigo",
  Mathematics: "violet",
  Food: "amber",
  Sports: "emerald",
};

export const VectorCatalog: React.FC = () => {
  const [items, setItems] = useState<VectorItem[]>([]);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMeta, setNewMeta] = useState("");
  const [newCat, setNewCat] = useState("Computer Science");
  const [selectedVec, setSelectedVec] = useState<VectorItem | null>(null);

  const loadVectors = async () => {
    try {
      const data = await fetchVectors();
      setItems(data);
      return;
    } catch {
      // Fallback items if API is unreachable
      setItems([
        {
          id: 1,
          metadata: "Quantum Computing & Qubits",
          category: "Computer Science",
          embedding: [0.91, 0.85, 0.78, 0.65, 0.12, 0.05, 0.08, 0.15, 0.03, 0.01, 0.02, 0.04, 0.01, 0.02, 0.05, 0.03],
        },
        {
          id: 2,
          metadata: "Neural Networks & Deep Learning",
          category: "Computer Science",
          embedding: [0.88, 0.92, 0.82, 0.70, 0.15, 0.08, 0.05, 0.12, 0.02, 0.03, 0.01, 0.02, 0.04, 0.01, 0.02, 0.05],
        },
        {
          id: 6,
          metadata: "Calculus & Derivatives",
          category: "Mathematics",
          embedding: [0.62, 0.71, 0.58, 0.92, 0.08, 0.03, 0.04, 0.07, 0.01, 0.02, 0.03, 0.05, 0.02, 0.01, 0.04, 0.02],
        },
        {
          id: 11,
          metadata: "Neapolitan Sourdough Pizza",
          category: "Food",
          embedding: [0.05, 0.08, 0.02, 0.04, 0.92, 0.88, 0.85, 0.76, 0.02, 0.04, 0.01, 0.03, 0.05, 0.02, 0.01, 0.04],
        },
        {
          id: 16,
          metadata: "Football UEFA Champions League",
          category: "Sports",
          embedding: [0.08, 0.05, 0.03, 0.02, 0.04, 0.06, 0.02, 0.05, 0.94, 0.91, 0.88, 0.82, 0.03, 0.02, 0.04, 0.01],
        },
      ]);
    }
  };

  useEffect(() => {
    loadVectors();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeta) return;
    const vec = Array.from({ length: 16 }, () => Number((Math.random() * 0.9).toFixed(2)));
    try {
      await insertVector({ metadata: newMeta, category: newCat, embedding: vec });
      await loadVectors();
      setNewMeta("");
      setShowAddModal(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteVector(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = items.filter((item) => {
    const matchesSearch = item.metadata.toLowerCase().includes(search.toLowerCase());
    const matchesCat = filterCat === "All" || item.category === filterCat;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="flex flex-col gap-5">
      {/* Controls Bar */}
      <div className="surface-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded bg-[#111315] text-[#EEF3FF] shadow-xs">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-[#111315]">
                Vector Embedding Registry
              </h2>
              <p className="text-xs text-[#555C68] font-sans">
                Browse, filter, and inspect high-dimensional semantic coordinates
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="flex items-center gap-2 rounded border border-[#DCD5C9] bg-white px-2.5 py-1 text-xs shadow-xs focus-within:border-[#0935B8]">
              <Search className="h-3.5 w-3.5 text-[#7E8794]" />
              <input
                type="text"
                placeholder="Filter vectors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-[#111315] placeholder-[#7E8794] focus:outline-none w-32 sm:w-44 text-xs font-sans"
              />
            </div>

            {/* Category Filter */}
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="rounded border border-[#DCD5C9] bg-white px-2.5 py-1 text-xs font-mono text-[#111315] focus:outline-none focus:border-[#0935B8] shadow-xs cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Food">Food</option>
              <option value="Sports">Sports</option>
            </select>

            {/* View Mode Switcher */}
            <div className="flex items-center p-0.5 bg-[#EDEAE3] rounded border border-[#E1DBD0]">
              <button
                onClick={() => setViewMode("table")}
                className={`p-1 rounded text-xs transition ${
                  viewMode === "table"
                    ? "bg-white text-[#0935B8] shadow-xs font-bold"
                    : "text-[#555C68] hover:text-[#111315]"
                }`}
                title="Table View"
              >
                <List className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1 rounded text-xs transition ${
                  viewMode === "grid"
                    ? "bg-white text-[#0935B8] shadow-xs font-bold"
                    : "text-[#555C68] hover:text-[#111315]"
                }`}
                title="Grid View"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Add Vector Button */}
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAddModal(true)}
              icon={<Plus className="h-3.5 w-3.5" />}
            >
              ADD VECTOR
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content: Table or Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Database className="h-5 w-5" />}
          title="No vectors matching filter"
          description={
            search
              ? `No vectors matching "${search}" in category "${filterCat}".`
              : "Your vector index is currently empty."
          }
          action={{
            label: "Register Vector",
            onClick: () => setShowAddModal(true),
            icon: <Plus className="h-3.5 w-3.5" />,
          }}
        />
      ) : viewMode === "table" ? (
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#555C68]">
              <thead className="border-b border-[#E3DED6] bg-[#FAF9F7] text-[10px] uppercase font-mono text-[#7E8794]">
                <tr>
                  <th className="px-4 py-3 font-semibold">ID</th>
                  <th className="px-4 py-3 font-semibold">Vector Concept</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">16D Embedding Spectrum</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE7DF]">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FAF9F7] transition">
                    <td className="px-4 py-2.5 font-mono font-bold text-[#0935B8] tabular-nums">
                      #{item.id}
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-[#111315]">
                      {item.metadata}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge
                        variant={categoryBadgeVariant[item.category] || "slate"}
                        size="xs"
                      >
                        {item.category}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      {/* Mini Heatmap Strip in Deep Cobalt */}
                      <div className="flex items-center gap-0.5 max-w-[200px]" title="16D Float Coordinates">
                        {item.embedding?.slice(0, 16).map((val, idx) => {
                          const opacity = Math.min(Math.max(val, 0.12), 1);
                          return (
                            <span
                              key={idx}
                              className="h-4 w-2 rounded-xs transition-opacity"
                              style={{
                                backgroundColor: `rgba(9, 53, 184, ${opacity})`,
                              }}
                            />
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedVec(item)}
                          className="p-1 rounded text-[#7E8794] hover:text-[#0935B8] hover:bg-[#EEF3FF] transition"
                          title="Inspect Vector"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 rounded text-[#7E8794] hover:text-[#BE123C] hover:bg-[#FFF1F2] transition"
                          title="Delete Vector"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="surface-card p-4 flex flex-col justify-between hover:border-[#0935B8] transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-xs font-bold text-[#0935B8] tabular-nums">
                    #{item.id}
                  </span>
                  <Badge
                    variant={categoryBadgeVariant[item.category] || "slate"}
                    size="xs"
                  >
                    {item.category}
                  </Badge>
                </div>
                <h3 className="font-semibold text-[#111315] text-xs mb-2.5">
                  {item.metadata}
                </h3>

                {/* Heatmap visualization */}
                <div className="bg-[#FAF9F7] p-2 rounded border border-[#E3DED6] mb-2.5">
                  <span className="text-[9px] text-[#7E8794] uppercase font-mono block mb-1">
                    16D Heatmap Spectrum
                  </span>
                  <div className="flex items-center gap-0.5">
                    {item.embedding?.slice(0, 16).map((val, idx) => {
                      const opacity = Math.min(Math.max(val, 0.15), 1);
                      return (
                        <div
                          key={idx}
                          className="h-5 flex-1 rounded-xs"
                          style={{
                            backgroundColor: `rgba(9, 53, 184, ${opacity})`,
                          }}
                          title={`dim_${idx}: ${val}`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1 pt-2 border-t border-[#EBE7DF]">
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => setSelectedVec(item)}
                  icon={<Eye className="h-3 w-3" />}
                >
                  Inspect
                </Button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1 rounded text-[#7E8794] hover:text-[#BE123C] hover:bg-[#FFF1F2] transition"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vector Detail Modal */}
      {selectedVec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111315]/30 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="surface-card w-full max-w-lg p-5 shadow-elevation">
            <div className="flex items-center justify-between border-b border-[#E3DED6] pb-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded bg-[#EEF3FF] border border-[#CFDEFE] flex items-center justify-center text-[#0935B8] font-bold font-mono text-xs">
                  #{selectedVec.id}
                </div>
                <div>
                  <h3 className="font-bold text-[#111315] text-xs font-mono uppercase tracking-wider">
                    Vector Specimen Inspection
                  </h3>
                  <p className="text-[11px] text-[#7E8794] font-mono">{selectedVec.category}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedVec(null)}
                className="p-1 rounded text-[#7E8794] hover:text-[#111315] hover:bg-[#EDEAE3] transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-3.5 space-y-3 text-xs">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#7E8794]">Concept Label</span>
                <p className="text-xs font-semibold text-[#111315] mt-0.5">{selectedVec.metadata}</p>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#7E8794] block mb-1.5">
                  16-Dimensional Coordinates Array
                </span>
                <div className="bg-[#FAF9F7] p-3 rounded border border-[#E3DED6] font-mono text-[#111315] text-[11px] grid grid-cols-4 gap-1.5 tabular-nums">
                  {selectedVec.embedding.map((val, i) => (
                    <div key={i} className="bg-white p-1 rounded border border-[#E3DED6] shadow-2xs">
                      <span className="text-[9px] text-[#7E8794] block font-mono">d{i}</span>
                      <span className="font-bold text-[#0935B8]">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-2.5 border-t border-[#E3DED6] flex justify-end">
              <Button size="sm" variant="secondary" onClick={() => setSelectedVec(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111315]/30 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="surface-card w-full max-w-md p-5 shadow-elevation">
            <div className="flex items-center justify-between border-b border-[#E3DED6] pb-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded bg-[#EEF3FF] border border-[#CFDEFE] flex items-center justify-center text-[#0935B8]">
                  <Plus className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-[#111315] text-xs font-mono uppercase tracking-wider">
                  Register New Vector
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded text-[#7E8794] hover:text-[#111315] hover:bg-[#EDEAE3] transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="mt-3.5 space-y-3 text-xs">
              <div>
                <label className="block text-[#111315] font-mono text-[10px] font-bold uppercase tracking-wider mb-1">
                  Vector Description / Label
                </label>
                <input
                  type="text"
                  placeholder="e.g. Graph Neural Networks & Message Passing"
                  value={newMeta}
                  onChange={(e) => setNewMeta(e.target.value)}
                  className="w-full rounded border border-[#DCD5C9] bg-white px-3 py-1.5 text-xs text-[#111315] placeholder-[#7E8794] focus:border-[#0935B8] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[#111315] font-mono text-[10px] font-bold uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  className="w-full rounded border border-[#DCD5C9] bg-white px-3 py-1.5 text-xs text-[#111315] focus:border-[#0935B8] focus:outline-none cursor-pointer"
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Food">Food</option>
                  <option value="Sports">Sports</option>
                </select>
              </div>

              <div className="pt-2.5 border-t border-[#E3DED6] flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  INSERT INTO HNSW
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
