"use client";

import React, { useState, useEffect } from "react";
import { VectorItem } from "../lib/types";
import { Database, Plus, Trash2, Search, Tag, Eye } from "lucide-react";

export const VectorCatalog: React.FC = () => {
  const [items, setItems] = useState<VectorItem[]>([]);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMeta, setNewMeta] = useState("");
  const [newCat, setNewCat] = useState("Computer Science");
  const [selectedVec, setSelectedVec] = useState<VectorItem | null>(null);

  const loadVectors = async () => {
    try {
      const res = await fetch("/api/vectors");
      if (res.ok) {
        const data = await res.json();
        setItems(data);
        return;
      }
    } catch (e) {
      // Fallback
    }
    // Fallback items
    setItems([
      { id: 1, metadata: "Quantum Computing & Qubits", category: "Computer Science", embedding: [0.91, 0.85, 0.78, 0.65, 0.12, 0.05, 0.08, 0.15, 0.03, 0.01, 0.02, 0.04, 0.01, 0.02, 0.05, 0.03] },
      { id: 2, metadata: "Neural Networks & Deep Learning", category: "Computer Science", embedding: [0.88, 0.92, 0.82, 0.70, 0.15, 0.08, 0.05, 0.12, 0.02, 0.03, 0.01, 0.02, 0.04, 0.01, 0.02, 0.05] },
      { id: 6, metadata: "Calculus & Derivatives", category: "Mathematics", embedding: [0.62, 0.71, 0.58, 0.92, 0.08, 0.03, 0.04, 0.07, 0.01, 0.02, 0.03, 0.05, 0.02, 0.01, 0.04, 0.02] },
      { id: 11, metadata: "Neapolitan Sourdough Pizza", category: "Food", embedding: [0.05, 0.08, 0.02, 0.04, 0.92, 0.88, 0.85, 0.76, 0.02, 0.04, 0.01, 0.03, 0.05, 0.02, 0.01, 0.04] },
      { id: 16, metadata: "Football UEFA Champions League", category: "Sports", embedding: [0.08, 0.05, 0.03, 0.02, 0.04, 0.06, 0.02, 0.05, 0.94, 0.91, 0.88, 0.82, 0.03, 0.02, 0.04, 0.01] }
    ]);
  };

  useEffect(() => {
    loadVectors();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeta) return;
    // Generate normalized 16D pseudo vector
    const vec = Array.from({ length: 16 }, () => Number((Math.random() * 0.9).toFixed(2)));
    try {
      await fetch("/api/vectors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metadata: newMeta, category: newCat, embedding: vec }),
      });
      await loadVectors();
      setNewMeta("");
      setShowAddModal(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/vectors/${id}`, { method: "DELETE" });
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
      <div className="glass-panel flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <Database className="h-5 w-5 text-cyan-400" />
          <div>
            <h2 className="text-sm font-bold text-white sm:text-base">Indexed Vector Registry</h2>
            <p className="text-xs text-gray-400">Manage 16D semantic vectors and ground truth records</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#12141c] px-3 py-1.5 text-xs">
            <Search className="h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search vectors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-white placeholder-gray-500 focus:outline-none"
            />
          </div>

          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="rounded-xl border border-white/10 bg-[#12141c] px-3 py-1.5 text-xs text-gray-300 focus:outline-none"
          >
            <option value="All">All Categories</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Food">Food</option>
            <option value="Sports">Sports</option>
          </select>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-cyan-500/20 px-3.5 py-1.5 text-xs font-semibold text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Vector</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="border-b border-white/10 bg-[#0d0f16] text-[11px] uppercase text-gray-400">
              <tr>
                <th className="px-5 py-3.5">ID</th>
                <th className="px-5 py-3.5">Label / Concept</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">16D Embedding Preview</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-white/5 transition">
                  <td className="px-5 py-3 font-mono text-cyan-400">#{item.id}</td>
                  <td className="px-5 py-3 font-medium text-white">{item.metadata}</td>
                  <td className="px-5 py-3">
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-gray-300 border border-white/10">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono text-[10px] text-gray-400 max-w-[260px] truncate">
                    [{item.embedding?.slice(0, 5).join(", ")}...]
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedVec(item)}
                        className="rounded p-1 text-gray-400 hover:text-cyan-400 transition"
                        title="Inspect Vector"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="rounded p-1 text-gray-400 hover:text-rose-400 transition"
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

      {/* Vector Detail Modal */}
      {selectedVec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-panel-glow w-full max-w-lg rounded-2xl p-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-semibold text-white">Vector #{selectedVec.id} Details</h3>
              <button onClick={() => setSelectedVec(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="mt-4 space-y-3 text-xs">
              <p><strong className="text-gray-400">Label:</strong> {selectedVec.metadata}</p>
              <p><strong className="text-gray-400">Category:</strong> {selectedVec.category}</p>
              <div>
                <strong className="text-gray-400 block mb-1">Full 16D Float Coordinates:</strong>
                <div className="bg-[#08090d] p-3 rounded-xl border border-white/5 font-mono text-cyan-300 text-[11px] grid grid-cols-4 gap-2">
                  {selectedVec.embedding.map((val, i) => (
                    <span key={i}>dim_{i}: {val}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-semibold text-white">Add New Vector</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleAdd} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-gray-300 font-medium mb-1">Vector Label / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Graph Convolutional Networks"
                  value={newMeta}
                  onChange={(e) => setNewMeta(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#12141c] px-3 py-2 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-300 font-medium mb-1">Category</label>
                <select
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#12141c] px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Food">Food</option>
                  <option value="Sports">Sports</option>
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-xl border border-white/10 text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-cyan-500 text-black font-semibold shadow-glow hover:bg-cyan-400"
                >
                  Insert into HNSW
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
