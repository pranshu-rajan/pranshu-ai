"use client";

import React, { useState, useEffect } from "react";
import { DocumentItem, DocumentChunk } from "../lib/types";
import { fetchDocuments, uploadDocument, deleteDocument, askRagStream } from "../lib/api";
import {
  Sparkles,
  FileText,
  Upload,
  Trash2,
  Send,
  CheckCircle,
  BookOpen,
  Clock,
  Layers,
  Search,
  Sliders,
  X,
  FileCode,
  Check,
} from "lucide-react";
import Button from "./ui/Button";
import Badge from "./ui/Badge";
import SegmentedControl from "./ui/SegmentedControl";
import EmptyState from "./ui/EmptyState";

export const RagStudio: React.FC = () => {
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [docTitle, setDocTitle] = useState("");
  const [docText, setDocText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<"file" | "text">("file");
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // RAG Chat State
  const [question, setQuestion] = useState("");
  const [lastQuestion, setLastQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [activeContexts, setActiveContexts] = useState<DocumentChunk[]>([]);
  const [selectedChunk, setSelectedChunk] = useState<DocumentChunk | null>(null);
  const [hydeText, setHydeText] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [retrievalConfidence, setRetrievalConfidence] = useState<string | null>(null);

  // Knowledge Hub tab
  const [knowledgeTab, setKnowledgeTab] = useState<"docs" | "upload" | "context">("docs");

  // Advanced RAG Controls
  const [useHybrid, setUseHybrid] = useState(true);
  const [useRerank, setUseRerank] = useState(true);
  const [useHyde, setUseHyde] = useState(false);
  const [topK, setTopK] = useState(3);

  const loadDocs = async () => {
    try {
      const list = await fetchDocuments();
      setDocs(list);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const handleFileChange = (file: File) => {
    setSelectedFile(file);
    if (!docTitle) {
      const cleanName = file.name.replace(/\.[^/.]+$/, "");
      setDocTitle(cleanName);
    }
    if (file.name.match(/\.(txt|md|json|csv|py|cpp|js|ts)$/i)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (content) setDocText(content);
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && (!docTitle || !docText)) return;
    setUploading(true);
    try {
      await uploadDocument(docTitle, docText, selectedFile || undefined);
      setDocTitle("");
      setDocText("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadDocs();
      setKnowledgeTab("docs");
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

    const q = question;
    setLastQuestion(q);
    setQuestion("");
    setIsAsking(true);
    setCurrentAnswer("");
    setActiveContexts([]);
    setSelectedChunk(null);
    setHydeText(null);
    setLatency(null);
    setRetrievalConfidence(null);

    await askRagStream(
      q,
      topK,
      { useHybrid, useRerank, useHyde },
      (meta) => {
        setActiveContexts(meta.contexts);
        if (meta.hydePassage) setHydeText(meta.hydePassage);
        if (meta.confidence) setRetrievalConfidence(meta.confidence);
        if (meta.contexts && meta.contexts.length > 0) {
          // Switch tab to context if desired
          setKnowledgeTab("context");
        }
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
        setCurrentAnswer(
          (prev) =>
            prev + "\n\n[Backend connection notice: The model inference engine or database is preparing. Verify that the backend is responding.]"
        );
        setIsAsking(false);
      }
    );
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
      {/* Left Column: Interactive Chat & Pipeline Controls (7 cols) */}
      <div className="flex flex-col gap-5 lg:col-span-7">
        {/* Pipeline Controls Bar */}
        <div className="surface-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-semibold text-slate-700">RAG Pipeline Enhancements:</span>

            <div className="flex flex-wrap items-center gap-3">
              {/* Hybrid Toggle */}
              <label className="flex cursor-pointer items-center gap-1.5 select-none">
                <input
                  type="checkbox"
                  checked={useHybrid}
                  onChange={(e) => setUseHybrid(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20"
                />
                <span className={useHybrid ? "text-indigo-700 font-semibold" : "text-slate-500"}>
                  Hybrid (HNSW + BM25)
                </span>
              </label>

              {/* Rerank Toggle */}
              <label className="flex cursor-pointer items-center gap-1.5 select-none">
                <input
                  type="checkbox"
                  checked={useRerank}
                  onChange={(e) => setUseRerank(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20"
                />
                <span className={useRerank ? "text-indigo-700 font-semibold" : "text-slate-500"}>
                  Contextual Rerank
                </span>
              </label>

              {/* HyDE Toggle */}
              <label className="flex cursor-pointer items-center gap-1.5 select-none">
                <input
                  type="checkbox"
                  checked={useHyde}
                  onChange={(e) => setUseHyde(e.target.checked)}
                  className="rounded border-slate-300 text-purple-600 focus:ring-purple-500/20"
                />
                <span className={useHyde ? "text-purple-700 font-semibold" : "text-slate-500"}>
                  HyDE Expansion
                </span>
              </label>

              {/* Top-K Select */}
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                <span className="text-slate-400 font-medium">Top-K:</span>
                <select
                  value={topK}
                  onChange={(e) => setTopK(Number(e.target.value))}
                  className="rounded-lg bg-white border border-slate-200 px-2 py-0.5 font-mono text-xs text-slate-800 focus:outline-none focus:border-indigo-500 shadow-2xs"
                >
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={5}>5</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Live Conversation Terminal */}
        <div className="surface-card flex min-h-[500px] flex-col justify-between overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 bg-white">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-semibold text-slate-900">Live RAG Knowledge Stream</h3>
            </div>
            <div className="flex items-center gap-2">
              {retrievalConfidence && (
                <Badge
                  variant={
                    retrievalConfidence === "high"
                      ? "emerald"
                      : retrievalConfidence === "medium"
                      ? "amber"
                      : "slate"
                  }
                  size="xs"
                  dot
                >
                  CRAG: {retrievalConfidence.toUpperCase()}
                </Badge>
              )}
              {latency !== null && (
                <span className="flex items-center gap-1 font-mono text-xs text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60 font-semibold">
                  <Clock className="h-3 w-3" />
                  {latency} ms
                </span>
              )}
            </div>
          </div>

          {/* Conversation Area */}
          <div className="p-5 flex-1 space-y-4 overflow-y-auto max-h-[520px]">
            {/* Last Question Bubble */}
            {lastQuestion && (
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-tr-xs bg-indigo-600 px-4 py-2.5 text-xs text-white shadow-sm leading-relaxed">
                  {lastQuestion}
                </div>
              </div>
            )}

            {/* HyDE Passage Pill if active */}
            {hydeText && (
              <div className="rounded-2xl border border-purple-200 bg-purple-50/60 p-4 text-xs animate-slide-in-up">
                <span className="font-bold text-purple-900 block mb-1">
                  ✨ Hypothetical Document Expansion (HyDE):
                </span>
                <p className="text-purple-800 leading-relaxed italic">{hydeText}</p>
              </div>
            )}

            {/* Answer Box */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-5 min-h-[160px]">
              {currentAnswer ? (
                <div className="text-xs leading-relaxed text-slate-800 whitespace-pre-wrap font-sans">
                  {currentAnswer}
                  {isAsking && (
                    <span className="inline-block h-3.5 w-1.5 ml-1 bg-indigo-600 animate-pulse" />
                  )}
                </div>
              ) : isAsking ? (
                <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium py-4">
                  <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <span>Retrieving context & generating answer...</span>
                </div>
              ) : (
                <div className="flex h-full min-h-[140px] flex-col items-center justify-center text-center text-slate-400 text-xs py-4">
                  <BookOpen className="h-8 w-8 text-slate-300 mb-2.5" />
                  <p className="font-semibold text-slate-600">Ask a question based on your indexed documents.</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                    e.g. &quot;How does HNSW achieve O(log N) search complexity?&quot; or &quot;What are the core advantages of hybrid retrieval?&quot;
                  </p>
                </div>
              )}
            </div>

            {/* Attributed Context Sources */}
            {activeContexts.length > 0 && (
              <div className="pt-2 animate-fade-in">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Attributed Sources ({activeContexts.length}):
                  </span>
                  <button
                    onClick={() => setKnowledgeTab("context")}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    View in Knowledge Hub →
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeContexts.map((ctx, idx) => (
                    <button
                      key={ctx.id}
                      onClick={() => {
                        setSelectedChunk(ctx);
                        setKnowledgeTab("context");
                      }}
                      className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs transition ${
                        selectedChunk?.id === ctx.id
                          ? "border-indigo-400 bg-indigo-50 text-indigo-700 font-semibold shadow-xs"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-2xs"
                      }`}
                    >
                      <span className="font-mono text-indigo-600 font-bold">[{idx + 1}]</span>
                      <span className="max-w-[130px] truncate">{ctx.title}</span>
                      {ctx.rerank_score && (
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.2 font-mono text-[10px] text-slate-600 font-semibold">
                          s={ctx.rerank_score}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Question Input Form */}
          <form onSubmit={handleAsk} className="flex gap-2.5 p-4 border-t border-slate-100 bg-white">
            <input
              type="text"
              placeholder="Ask anything about your vector database and documents..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={isAsking}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition shadow-2xs"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isAsking || !question.trim()}
              loading={isAsking}
              icon={<Send className="h-3.5 w-3.5" />}
            >
              Ask
            </Button>
          </form>
        </div>
      </div>

      {/* Right Column: Knowledge Hub (5 cols) */}
      <div className="flex flex-col gap-5 lg:col-span-5">
        <div className="surface-card p-5">
          {/* Header & Tabs */}
          <div className="flex flex-col gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Knowledge Hub</h3>
              </div>
              <Badge variant="slate" size="xs">
                {docs.length} Documents
              </Badge>
            </div>

            <SegmentedControl
              size="sm"
              value={knowledgeTab}
              onChange={(v) => setKnowledgeTab(v as any)}
              options={[
                { value: "docs", label: "Documents", icon: <FileText className="h-3.5 w-3.5" /> },
                { value: "upload", label: "Upload & Ingest", icon: <Upload className="h-3.5 w-3.5" /> },
                {
                  value: "context",
                  label: "Retrieved Chunks",
                  icon: <Layers className="h-3.5 w-3.5" />,
                  badge:
                    activeContexts.length > 0 ? (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700 text-[9px] font-bold">
                        {activeContexts.length}
                      </span>
                    ) : undefined,
                },
              ]}
            />
          </div>

          {/* Tab 1: Documents List */}
          {knowledgeTab === "docs" && (
            <div className="mt-4 space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {docs.length === 0 ? (
                <EmptyState
                  icon={<BookOpen className="h-6 w-6" />}
                  title="No documents ingested"
                  description="Upload a document or paste raw text to query with RAG."
                  action={{
                    label: "Upload Document",
                    onClick: () => setKnowledgeTab("upload"),
                    icon: <Upload className="h-3.5 w-3.5" />,
                  }}
                />
              ) : (
                docs.map((d) => (
                  <div
                    key={d.id}
                    className="group flex items-start justify-between rounded-xl border border-slate-200/80 bg-white p-3.5 transition hover:border-indigo-200 hover:shadow-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-700 truncate">
                        {d.title}
                      </h4>
                      <p className="mt-1 text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {d.preview}
                      </p>
                      <div className="mt-2.5 flex items-center gap-2">
                        <Badge variant="indigo" size="xs">
                          {d.chunk_count} chunks
                        </Badge>
                        <span className="text-[10px] text-slate-400 font-mono">{d.created_at}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(d.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition shrink-0"
                      title="Delete Document"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 2: Upload / Ingestion Form */}
          {knowledgeTab === "upload" && (
            <div className="mt-4">
              {/* Mode Switcher */}
              <div className="flex rounded-xl bg-slate-100 p-1 text-xs mb-4">
                <button
                  type="button"
                  onClick={() => setUploadMode("file")}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 transition font-semibold ${
                    uploadMode === "file"
                      ? "bg-white text-indigo-700 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload File</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode("text")}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 transition font-semibold ${
                    uploadMode === "text"
                      ? "bg-white text-indigo-700 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Paste Text</span>
                </button>
              </div>

              <form onSubmit={handleUpload} className="space-y-3.5">
                {uploadMode === "file" ? (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".txt,.md,.pdf,.json,.csv,.py,.cpp,.js,.ts,.doc"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileChange(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      className={`group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${
                        isDragging
                          ? "border-indigo-500 bg-indigo-50/60"
                          : selectedFile
                          ? "border-emerald-500 bg-emerald-50/30"
                          : "border-slate-200 bg-slate-50/50 hover:border-indigo-400 hover:bg-indigo-50/20"
                      }`}
                    >
                      {selectedFile ? (
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                            <CheckCircle className="h-5 w-5" />
                          </div>
                          <p className="text-xs font-bold text-slate-800 truncate max-w-[220px]">
                            {selectedFile.name}
                          </p>
                          <span className="font-mono text-[10px] text-slate-400">
                            {(selectedFile.size / 1024).toFixed(1)} KB
                          </span>
                          <span className="text-[10px] text-indigo-600 font-semibold underline mt-1">
                            Choose another file
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-105 transition">
                            <Upload className="h-5 w-5" />
                          </div>
                          <p className="text-xs font-semibold text-slate-700">
                            Click to browse or drag file here
                          </p>
                          <p className="text-[10px] text-slate-400">
                            PDF, Markdown, TXT, CSV, Code files
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-3">
                      <label className="block text-[11px] font-semibold text-slate-700">
                        Document Label / Title
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Deep Learning Architecture"
                        value={docTitle}
                        onChange={(e) => setDocTitle(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700">
                        Document Title
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Distributed Consensus Systems"
                        value={docTitle}
                        onChange={(e) => setDocTitle(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700">
                        Content / Article Text
                      </label>
                      <textarea
                        rows={5}
                        placeholder="Paste article text, research papers, notes..."
                        value={docText}
                        onChange={(e) => setDocText(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none resize-none"
                      />
                    </div>
                  </>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full"
                  disabled={uploading || (!selectedFile && (!docTitle || !docText))}
                  loading={uploading}
                  icon={<Sparkles className="h-3.5 w-3.5" />}
                >
                  {uploading
                    ? "Chunking & Indexing into HNSW..."
                    : selectedFile
                    ? `Upload & Index "${selectedFile.name}"`
                    : "Embed & Ingest Document"}
                </Button>
              </form>
            </div>
          )}

          {/* Tab 3: Retrieved Context Chunks */}
          {knowledgeTab === "context" && (
            <div className="mt-4 space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {activeContexts.length === 0 ? (
                <EmptyState
                  icon={<Layers className="h-6 w-6" />}
                  title="No context retrieved yet"
                  description="Ask a question in the RAG stream to inspect matching passages retrieved from the vector index."
                />
              ) : (
                activeContexts.map((ctx, idx) => (
                  <div
                    key={ctx.id}
                    onClick={() => setSelectedChunk(ctx)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer ${
                      selectedChunk?.id === ctx.id
                        ? "bg-indigo-50/70 border-indigo-300 shadow-xs"
                        : "bg-white border-slate-200/80 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-xs font-bold text-indigo-600 truncate max-w-[200px]">
                        Source [{idx + 1}] • {ctx.title}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        {ctx.confidence && (
                          <Badge
                            variant={
                              ctx.confidence === "high"
                                ? "emerald"
                                : ctx.confidence === "medium"
                                ? "amber"
                                : "slate"
                            }
                            size="xs"
                          >
                            {ctx.confidence}
                          </Badge>
                        )}
                        {ctx.rerank_score && (
                          <Badge variant="indigo" size="xs">
                            score: {ctx.rerank_score}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {ctx.text}
                    </p>
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>Distance: {ctx.distance ?? "N/A"}</span>
                      <span className="text-indigo-600 font-sans font-medium">Click to inspect</span>
                    </div>
                  </div>
                ))
              )}

              {/* Expanded Chunk Details */}
              {selectedChunk && (
                <div className="mt-3 p-4 rounded-xl border border-indigo-200 bg-white shadow-card">
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
                    <span className="font-bold text-xs text-slate-900">
                      Full Chunk Inspector: {selectedChunk.title}
                    </span>
                    <button
                      onClick={() => setSelectedChunk(null)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200/60 font-sans whitespace-pre-wrap">
                    {selectedChunk.text}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
