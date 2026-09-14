"use client";

import React, { useState, useEffect } from "react";
import { DocumentItem, DocumentChunk } from "../lib/types";
import { fetchDocuments, uploadDocument, deleteDocument, askRagStream } from "../lib/api";
import {
  Sparkles, FileText, Upload, Trash2, Send, CheckCircle,
  Cpu, Layers, BookOpen, AlertCircle, Clock, ExternalLink
} from "lucide-react";

export const RagStudio: React.FC = () => {
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [docTitle, setDocTitle] = useState("");
  const [docText, setDocText] = useState("");
  const [uploading, setUploading] = useState(false);

  // RAG Chat State
  const [question, setQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [activeContexts, setActiveContexts] = useState<DocumentChunk[]>([]);
  const [selectedChunk, setSelectedChunk] = useState<DocumentChunk | null>(null);
  const [hydeText, setHydeText] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);

  // Advanced RAG Controls
  const [useHybrid, setUseHybrid] = useState(true);
  const [useRerank, setUseRerank] = useState(true);
  const [useHyde, setUseHyde] = useState(false);
  const [topK, setTopK] = useState(3);

  const loadDocs = async () => {
    const list = await fetchDocuments();
    setDocs(list);
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle || !docText) return;
    setUploading(true);
    try {
      await uploadDocument(docTitle, docText);
      setDocTitle("");
      setDocText("");
      await loadDocs();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    await deleteDocument(id);
    await loadDocs();
  };

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isAsking) return;

    setIsAsking(true);
    setCurrentAnswer("");
    setActiveContexts([]);
    setSelectedChunk(null);
    setHydeText(null);
    setLatency(null);

    await askRagStream(
      question,
      topK,
      { useHybrid, useRerank, useHyde },
      (meta) => {
        setActiveContexts(meta.contexts);
        if (meta.hydePassage) setHydeText(meta.hydePassage);
      },
      (token) => {
        setCurrentAnswer((prev) => prev + token);
      },
      (timeMs) => {
        setLatency(timeMs);
        setIsAsking(false);
      },
      (err) => {
        console.error(err);
        setCurrentAnswer((prev) => prev + "\n[Error connecting to RAG backend. Make sure FastAPI is running.]");
        setIsAsking(false);
      }
    );
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Left Column: Knowledge Base & Ingestion (5 cols) */}
      <div className="flex flex-col gap-6 lg:col-span-5">
        {/* Ingestion Panel */}
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Upload className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Ingest Documents</h3>
          </div>

          <form onSubmit={handleUpload} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-300">Document Title</label>
              <input
                type="text"
                placeholder="e.g. Distributed Consensus Systems"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#12141c] px-3 py-2 text-xs text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300">Content / Article</label>
              <textarea
                rows={4}
                placeholder="Paste text, documentation, or notes..."
                value={docText}
                onChange={(e) => setDocText(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#12141c] px-3 py-2 text-xs text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={uploading || !docTitle || !docText}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500/20 py-2 text-xs font-semibold text-cyan-300 border border-cyan-500/40 transition hover:bg-cyan-500/30 disabled:opacity-40"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{uploading ? "Chunking & Embedding into HNSW..." : "Embed & Ingest Document"}</span>
            </button>
          </form>
        </div>

        {/* Knowledge Base Documents List */}
        <div className="glass-panel flex-1 rounded-2xl p-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-purple-400" />
              <h3 className="text-sm font-semibold text-white">Indexed Documents ({docs.length})</h3>
            </div>
          </div>

          <div className="mt-3 space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
            {docs.map((d) => (
              <div
                key={d.id}
                className="group flex items-start justify-between rounded-xl border border-white/5 bg-[#12141c] p-3 transition hover:border-white/20"
              >
                <div>
                  <h4 className="text-xs font-semibold text-gray-200 group-hover:text-cyan-300">
                    {d.title}
                  </h4>
                  <p className="mt-1 text-[11px] text-gray-400 line-clamp-2">{d.preview}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-mono text-cyan-400">
                      {d.chunk_count} chunks
                    </span>
                    <span className="text-[10px] text-gray-500">{d.created_at}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(d.id)}
                  className="p-1 text-gray-500 hover:text-rose-400 transition"
                  title="Delete Document"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Interactive RAG Chat & Telemetry (7 cols) */}
      <div className="flex flex-col gap-6 lg:col-span-7">
        {/* Advanced Pipeline Controls Bar */}
        <div className="glass-panel rounded-2xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-semibold text-gray-300">RAG Pipeline Enhancements:</span>

            <div className="flex flex-wrap items-center gap-3">
              {/* Hybrid Toggle */}
              <label className="flex cursor-pointer items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={useHybrid}
                  onChange={(e) => setUseHybrid(e.target.checked)}
                  className="rounded border-white/20 bg-[#12141c] text-cyan-500 focus:ring-0"
                />
                <span className={useHybrid ? "text-cyan-300 font-medium" : "text-gray-400"}>
                  Hybrid (HNSW + BM25)
                </span>
              </label>

              {/* Rerank Toggle */}
              <label className="flex cursor-pointer items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={useRerank}
                  onChange={(e) => setUseRerank(e.target.checked)}
                  className="rounded border-white/20 bg-[#12141c] text-cyan-500 focus:ring-0"
                />
                <span className={useRerank ? "text-cyan-300 font-medium" : "text-gray-400"}>
                  Contextual Rerank
                </span>
              </label>

              {/* HyDE Toggle */}
              <label className="flex cursor-pointer items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={useHyde}
                  onChange={(e) => setUseHyde(e.target.checked)}
                  className="rounded border-white/20 bg-[#12141c] text-purple-400 focus:ring-0"
                />
                <span className={useHyde ? "text-purple-300 font-medium" : "text-gray-400"}>
                  HyDE Expansion
                </span>
              </label>

              {/* Top-K Select */}
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400">K:</span>
                <select
                  value={topK}
                  onChange={(e) => setTopK(Number(e.target.value))}
                  className="rounded bg-[#12141c] px-2 py-0.5 font-mono text-white border border-white/10"
                >
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* RAG Chat Terminal */}
        <div className="glass-panel flex min-h-[460px] flex-col rounded-2xl p-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">Live RAG Knowledge Stream</h3>
            </div>
            {latency && (
              <span className="flex items-center gap-1 font-mono text-[11px] text-cyan-400">
                <Clock className="h-3 w-3" />
                {latency} ms
              </span>
            )}
          </div>

          {/* Chat Response Area */}
          <div className="my-4 flex-1 space-y-4 overflow-y-auto">
            {/* HyDE Passage Pill if active */}
            {hydeText && (
              <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-3 text-xs">
                <span className="font-semibold text-purple-300">Hypothetical Document (HyDE):</span>
                <p className="mt-1 text-purple-200/80 italic">{hydeText}</p>
              </div>
            )}

            {/* Answer Box */}
            <div className="rounded-xl border border-white/5 bg-[#090a0f] p-4 min-h-[140px]">
              {currentAnswer ? (
                <div className="prose prose-invert max-w-none text-xs leading-relaxed text-gray-200 whitespace-pre-wrap">
                  {currentAnswer}
                  {isAsking && <span className="inline-block h-3 w-1.5 ml-1 bg-cyan-400 animate-pulse" />}
                </div>
              ) : (
                <div className="flex h-full min-h-[120px] flex-col items-center justify-center text-center text-gray-500 text-xs">
                  <BookOpen className="h-6 w-6 text-gray-600 mb-2" />
                  <p>Ask a question based on your indexed documents above.</p>
                  <p className="text-[10px] text-gray-600 mt-1">
                    Try: &quot;How does HNSW achieve O(log N) search complexity?&quot;
                  </p>
                </div>
              )}
            </div>

            {/* Retrieved Context Chunks / Citation Pills */}
            {activeContexts.length > 0 && (
              <div>
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Attributed Sources ({activeContexts.length}):
                </span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {activeContexts.map((ctx, idx) => (
                    <button
                      key={ctx.id}
                      onClick={() => setSelectedChunk(ctx)}
                      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition ${
                        selectedChunk?.id === ctx.id
                          ? "border-cyan-400 bg-cyan-500/20 text-white"
                          : "border-white/10 bg-[#12141c] text-gray-300 hover:border-white/20"
                      }`}
                    >
                      <span className="font-mono text-cyan-400">[{idx + 1}]</span>
                      <span className="max-w-[140px] truncate">{ctx.title}</span>
                      {ctx.rerank_score && (
                        <span className="rounded bg-white/5 px-1 font-mono text-[9px] text-gray-400">
                          s={ctx.rerank_score}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Chunk Details Modal/Drawer */}
            {selectedChunk && (
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-3.5 text-xs animate-in fade-in duration-200">
                <div className="flex items-center justify-between font-semibold text-cyan-300">
                  <span>Source Chunk Inspector: {selectedChunk.title}</span>
                  <button
                    onClick={() => setSelectedChunk(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    ×
                  </button>
                </div>
                <p className="mt-2 text-gray-300 leading-relaxed bg-[#08090d] p-3 rounded-lg border border-white/5">
                  {selectedChunk.text}
                </p>
                <div className="mt-2 flex items-center gap-3 text-[10px] text-gray-400 font-mono">
                  <span>Cosine Distance: {selectedChunk.distance ?? "N/A"}</span>
                  {selectedChunk.rerank_score && <span>Rerank Score: {selectedChunk.rerank_score}</span>}
                </div>
              </div>
            )}
          </div>

          {/* Question Input Form */}
          <form onSubmit={handleAsk} className="flex gap-2 border-t border-white/10 pt-3">
            <input
              type="text"
              placeholder="Ask anything about your vector database and documents..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="flex-1 rounded-xl border border-white/10 bg-[#12141c] px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isAsking || !question.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-semibold text-black shadow-glow transition hover:bg-cyan-400 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Ask</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
