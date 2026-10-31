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
    <div className="flex flex-col gap-6">
      {/* Controls Bar */}
      <div className="surface-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Indexed Vector Registry</h2>
              <p className="text-xs text-slate-500">Manage 16D semantic vectors and ground truth records</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs shadow-xs focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/20">
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search vectors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none w-36 sm:w-48 text-xs"
              />
            </div>

            {/* Category Filter */}
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-indigo-500 shadow-xs"
            >
              <option value="All">All Categories</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Food">Food</option>
              <option value="Sports">Sports</option>
            </select>

            {/* View Mode Switcher */}
            <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-md text-xs transition ${
                  viewMode === "table"
                    ? "bg-white text-indigo-600 shadow-xs font-semibold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
                title="Table View"
              >
                <List className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md text-xs transition ${
                  viewMode === "grid"
                    ? "bg-white text-indigo-600 shadow-xs font-semibold"
                    : "text-slate-500 hover:text-slate-900"
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
              Add Vector
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content: Table or Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Database className="h-6 w-6" />}
          title="No vectors found"
          description={search ? `No vectors matching "${search}" in category "${filterCat}".` : "Your vector index is currently empty."}
          action={{
            label: "Add New Vector",
            onClick: () => setShowAddModal(true),
            icon: <Plus className="h-3.5 w-3.5" />,
          }}
        />
      ) : viewMode === "table" ? (
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] uppercase text-slate-400 font-semibold">
                <tr>
                  <th className="px-5 py-3.5">ID</th>
                  <th className="px-5 py-3.5">Label / Concept</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">16D Embedding Spectrum</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3 font-mono font-bold text-indigo-600">
                      #{item.id}
                    </td>
                    <td className="px-5 py-3 font-semibold text-slate-900">
                      {item.metadata}
                    </td>
                    <td className="px-5 py-3">
                      <Badge
                        variant={categoryBadgeVariant[item.category] || "slate"}
                        size="xs"
                      >
                        {item.category}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      {/* Mini Heatmap Strip */}
                      <div className="flex items-center gap-0.5 max-w-[200px]" title="16D Float Coordinates">
                        {item.embedding?.slice(0, 16).map((val, idx) => {
                          const opacity = Math.min(Math.max(val, 0.1), 1);
                          return (
                            <span
                              key={idx}
                              className="h-4 w-2 rounded-xs transition-opacity"
                              style={{
                                backgroundColor: `rgba(99, 102, 241, ${opacity})`,
                              }}
                            />
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedVec(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                          title="Inspect Vector"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Delete Vector"
                        >
                          <Trash2 className="h-4 w-4" />
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
              className="surface-card p-5 flex flex-col justify-between hover:border-slate-300 transition-all hover:shadow-cardHover"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-indigo-600">
                    #{item.id}
                  </span>
                  <Badge
                    variant={categoryBadgeVariant[item.category] || "slate"}
                    size="xs"
                  >
                    {item.category}
                  </Badge>
                </div>
                <h3 className="font-semibold text-slate-900 text-sm mb-3">
                  {item.metadata}
                </h3>

                {/* Heatmap visualization */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-3">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1.5">
                    16D Heatmap
                  </span>
                  <div className="flex items-center gap-1">
                    {item.embedding?.slice(0, 16).map((val, idx) => {
                      const opacity = Math.min(Math.max(val, 0.15), 1);
                      return (
                        <div
                          key={idx}
                          className="h-6 flex-1 rounded-xs"
                          style={{
                            backgroundColor: `rgba(99, 102, 241, ${opacity})`,
                          }}
                          title={`dim_${idx}: ${val}`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => setSelectedVec(item)}
                  icon={<Eye className="h-3.5 w-3.5" />}
                >
                  Inspect
                </Button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="surface-card w-full max-w-lg p-6 shadow-elevation">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold font-mono text-xs">
                  #{selectedVec.id}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Vector Inspection</h3>
                  <p className="text-xs text-slate-400">{selectedVec.category}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedVec(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div>
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Concept Label</span>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{selectedVec.metadata}</p>
              </div>

              <div>
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-2">
                  Full 16D Float Coordinates
                </span>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 font-mono text-slate-700 text-[11px] grid grid-cols-4 gap-2">
                  {selectedVec.embedding.map((val, i) => (
                    <div key={i} className="bg-white p-1.5 rounded-md border border-slate-200/60 shadow-2xs">
                      <span className="text-[9px] text-slate-400 block font-sans">d{i}</span>
                      <span className="font-bold text-indigo-600">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 flex justify-end">
              <Button size="sm" variant="secondary" onClick={() => setSelectedVec(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="surface-card w-full max-w-md p-6 shadow-elevation">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Plus className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Add New Vector</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Vector Label / Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Graph Convolutional Networks"
                  value={newMeta}
                  onChange={(e) => setNewMeta(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Category</label>
                <select
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Food">Food</option>
                  <option value="Sports">Sports</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Insert into HNSW
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
