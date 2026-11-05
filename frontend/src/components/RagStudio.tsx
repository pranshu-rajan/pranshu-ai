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
  Compass,
  Cpu,
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
            prev + "\n\n[Inference Notice: Local LLM socket or cloud API is warming up. Verify that the backend is responding.]"
        );
        setIsAsking(false);
      }
    );
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-start">
      {/* Left Column: Interactive Chat & Pipeline Controls (7 cols) */}
      <div className="flex flex-col gap-4 lg:col-span-7">
        {/* Pipeline Controls Bar */}
        <div className="surface-card p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#555C68]">
              Pipeline Modules:
            </span>

            <div className="flex flex-wrap items-center gap-3">
              {/* Hybrid Toggle */}
              <label className="flex cursor-pointer items-center gap-1.5 select-none">
                <input
                  type="checkbox"
                  checked={useHybrid}
                  onChange={(e) => setUseHybrid(e.target.checked)}
                  className="rounded border-[#DCD5C9] text-[#0935B8] focus:ring-[#0935B8]/20"
                />
                <span className={`text-xs font-mono ${useHybrid ? "text-[#0935B8] font-bold" : "text-[#7E8794]"}`}>
                  Hybrid (HNSW + BM25)
                </span>
              </label>

              {/* Rerank Toggle */}
              <label className="flex cursor-pointer items-center gap-1.5 select-none">
                <input
                  type="checkbox"
                  checked={useRerank}
                  onChange={(e) => setUseRerank(e.target.checked)}
                  className="rounded border-[#DCD5C9] text-[#0935B8] focus:ring-[#0935B8]/20"
                />
                <span className={`text-xs font-mono ${useRerank ? "text-[#0935B8] font-bold" : "text-[#7E8794]"}`}>
                  Cross-Rerank
                </span>
              </label>

              {/* HyDE Toggle */}
              <label className="flex cursor-pointer items-center gap-1.5 select-none">
                <input
                  type="checkbox"
                  checked={useHyde}
                  onChange={(e) => setUseHyde(e.target.checked)}
                  className="rounded border-[#DCD5C9] text-[#C2410C] focus:ring-[#C2410C]/20"
                />
                <span className={`text-xs font-mono ${useHyde ? "text-[#C2410C] font-bold" : "text-[#7E8794]"}`}>
                  HyDE Expansion
                </span>
              </label>

              {/* Top-K Select */}
              <div className="flex items-center gap-1 pl-2 border-l border-[#E3DED6]">
                <span className="text-[#7E8794] text-[10px] font-mono uppercase">TOP-K:</span>
                <select
                  value={topK}
                  onChange={(e) => setTopK(Number(e.target.value))}
                  className="rounded border border-[#DCD5C9] bg-white px-2 py-0.5 font-mono text-xs text-[#111315] focus:outline-none focus:border-[#0935B8] shadow-xs cursor-pointer"
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
          <div className="flex items-center justify-between border-b border-[#E3DED6] px-4 py-3 bg-[#FAF9F7]">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#0935B8]" />
              <h3 className="text-xs font-bold text-[#111315] uppercase tracking-wider font-mono">
                Live Retrieval-Augmented Synthesis
              </h3>
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
                <span className="flex items-center gap-1 font-mono text-[11px] text-[#0D5F52] bg-[#F0FDF4] px-2 py-0.5 rounded border border-[#BBF7D0] tabular-nums font-semibold">
                  <Clock className="h-3 w-3" />
                  {latency} ms
                </span>
              )}
            </div>
          </div>

          {/* Conversation Area */}
          <div className="p-4 sm:p-5 flex-1 space-y-3.5 overflow-y-auto max-h-[520px]">
            {/* Last Question Bubble */}
            {lastQuestion && (
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-md bg-[#111315] px-3.5 py-2 text-xs text-white shadow-xs font-medium leading-relaxed font-sans">
                  {lastQuestion}
                </div>
              </div>
            )}

            {/* HyDE Passage Pill if active */}
            {hydeText && (
              <div className="rounded border border-[#FED7AA] bg-[#FFF7ED] p-3 text-xs animate-slideInUp font-mono">
                <span className="font-bold text-[#9A3412] text-[10px] uppercase tracking-wider block mb-1">
                  [HyDE Hypothetical Passage Formulation]:
                </span>
                <p className="text-[#C2410C] leading-relaxed italic font-sans text-xs">{hydeText}</p>
              </div>
            )}

            {/* Answer Box */}
            <div className="rounded border border-[#E3DED6] bg-[#FAF9F7] p-4 min-h-[160px]">
              {currentAnswer ? (
                <div className="text-xs leading-relaxed text-[#111315] whitespace-pre-wrap font-sans">
                  {currentAnswer}
                  {isAsking && (
                    <span className="inline-block h-3.5 w-1.5 ml-1 bg-[#0935B8] animate-pulse" />
                  )}
                </div>
              ) : isAsking ? (
                <div className="flex items-center gap-2 text-xs text-[#0935B8] font-mono py-4">
                  <div className="w-3.5 h-3.5 border-2 border-[#0935B8] border-t-transparent rounded-full animate-spin" />
                  <span>Traversing HNSW layers & synthesizing answer...</span>
                </div>
              ) : (
                <div className="flex h-full min-h-[140px] flex-col items-center justify-center text-center text-[#7E8794] text-xs py-4">
                  <BookOpen className="h-7 w-7 text-[#A8A090] mb-2" />
                  <p className="font-bold text-[#111315] text-xs">Knowledge Retrieval Console Ready</p>
                  <p className="text-[11px] text-[#555C68] mt-1 max-w-sm font-sans">
                    Ask technical questions regarding your vector embeddings, HNSW algorithm graph, or uploaded PDF/text documents.
                  </p>
                </div>
              )}
            </div>

            {/* Attributed Context Sources */}
            {activeContexts.length > 0 && (
              <div className="pt-1 animate-fadeIn">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold font-mono text-[#555C68] uppercase tracking-wider">
                    Attributed Provenance Chunks ({activeContexts.length}):
                  </span>
                  <button
                    onClick={() => setKnowledgeTab("context")}
                    className="text-xs text-[#0935B8] hover:underline font-mono font-semibold"
                  >
                    Inspect Chunks →
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {activeContexts.map((ctx, idx) => (
                    <button
                      key={ctx.id}
                      onClick={() => {
                        setSelectedChunk(ctx);
                        setKnowledgeTab("context");
                      }}
                      className={`flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs transition ${
                        selectedChunk?.id === ctx.id
                          ? "border-[#0935B8] bg-[#EEF3FF] text-[#0935B8] font-bold shadow-xs"
                          : "border-[#E3DED6] bg-white text-[#111315] hover:border-[#0935B8] hover:bg-[#FAF9F7]"
                      }`}
                    >
                      <span className="font-mono text-[#0935B8] font-bold">[{idx + 1}]</span>
                      <span className="max-w-[130px] truncate font-sans text-xs">{ctx.title}</span>
                      {ctx.rerank_score && (
                        <span className="rounded bg-[#EDEAE3] px-1 py-0.2 font-mono text-[9px] text-[#555C68] font-semibold tabular-nums">
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
          <form onSubmit={handleAsk} className="flex gap-2 p-3.5 border-t border-[#E3DED6] bg-white">
            <input
              type="text"
              placeholder="Query vector database and indexed documents..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={isAsking}
              className="flex-1 rounded border border-[#DCD5C9] bg-[#FAF9F7] px-3.5 py-2 text-xs text-[#111315] placeholder-[#7E8794] focus:border-[#0935B8] focus:bg-white focus:outline-none transition font-sans"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isAsking || !question.trim()}
              loading={isAsking}
              icon={<Send className="h-3 w-3" />}
            >
              QUERY
            </Button>
          </form>
        </div>
      </div>

      {/* Right Column: Knowledge Hub (5 cols) */}
      <div className="flex flex-col gap-4 lg:col-span-5">
        <div className="surface-card p-4 sm:p-5">
          {/* Header & Tabs */}
          <div className="flex flex-col gap-2.5 pb-3.5 border-b border-[#E3DED6]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-[#0935B8]" />
                <h3 className="text-xs font-bold text-[#111315] uppercase tracking-wider font-mono">
                  Knowledge Hub
                </h3>
              </div>
              <Badge variant="slate" size="xs">
                {docs.length} DOCUMENTS
              </Badge>
            </div>

            <SegmentedControl
              size="sm"
              value={knowledgeTab}
              onChange={(v) => setKnowledgeTab(v as any)}
              options={[
                { value: "docs", label: "Documents", icon: <FileText className="h-3 w-3" /> },
                { value: "upload", label: "Ingest", icon: <Upload className="h-3 w-3" /> },
                {
                  value: "context",
                  label: "Chunks",
                  icon: <Layers className="h-3 w-3" />,
                  badge:
                    activeContexts.length > 0 ? (
                      <span className="ml-1 px-1 py-0.2 rounded bg-[#EEF3FF] text-[#0935B8] text-[9px] font-mono font-bold">
                        {activeContexts.length}
                      </span>
                    ) : undefined,
                },
              ]}
            />
          </div>

          {/* Tab 1: Documents List */}
          {knowledgeTab === "docs" && (
            <div className="mt-3.5 space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {docs.length === 0 ? (
                <EmptyState
                  icon={<BookOpen className="h-5 w-5" />}
                  title="No documents ingested"
                  description="Upload a PDF, Markdown, or text file to index into the HNSW database."
                  action={{
                    label: "Ingest Document",
                    onClick: () => setKnowledgeTab("upload"),
                    icon: <Upload className="h-3 w-3" />,
                  }}
                />
              ) : (
                docs.map((d) => (
                  <div
                    key={d.id}
                    className="group flex items-start justify-between rounded border border-[#E3DED6] bg-white p-3 transition hover:border-[#0935B8] hover:shadow-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <h4 className="text-xs font-bold text-[#111315] group-hover:text-[#0935B8] truncate">
                        {d.title}
                      </h4>
                      <p className="mt-0.5 text-[11px] text-[#555C68] line-clamp-2 leading-relaxed font-sans">
                        {d.preview}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="indigo" size="xs">
                          {d.chunk_count} CHUNKS
                        </Badge>
                        <span className="text-[10px] text-[#7E8794] font-mono tabular-nums">{d.created_at}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(d.id)}
                      className="p-1 rounded text-[#7E8794] hover:text-[#BE123C] hover:bg-[#FFF1F2] transition shrink-0"
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
            <div className="mt-3.5">
              {/* Mode Switcher */}
              <div className="flex rounded bg-[#EDEAE3] p-0.5 text-xs mb-3 border border-[#E1DBD0]">
                <button
                  type="button"
                  onClick={() => setUploadMode("file")}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded py-1 transition font-mono text-[11px] ${
                    uploadMode === "file"
                      ? "bg-white text-[#111315] shadow-xs font-bold"
                      : "text-[#555C68] hover:text-[#111315]"
                  }`}
                >
                  <Upload className="h-3 w-3" />
                  <span>FILE UPLOAD</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode("text")}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded py-1 transition font-mono text-[11px] ${
                    uploadMode === "text"
                      ? "bg-white text-[#111315] shadow-xs font-bold"
                      : "text-[#555C68] hover:text-[#111315]"
                  }`}
                >
                  <FileText className="h-3 w-3" />
                  <span>PASTE TEXT</span>
                </button>
              </div>

              <form onSubmit={handleUpload} className="space-y-3">
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
                      className={`group flex cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed p-5 text-center transition ${
                        isDragging
                          ? "border-[#0935B8] bg-[#EEF3FF]"
                          : selectedFile
                          ? "border-[#0D5F52] bg-[#F0FDF4]"
                          : "border-[#DCD5C9] bg-[#FAF9F7] hover:border-[#0935B8] hover:bg-[#EEF3FF]/30"
                      }`}
                    >
                      {selectedFile ? (
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex h-8 w-8 items-center justify-center rounded bg-[#DCFCE7] text-[#0D5F52]">
                            <CheckCircle className="h-4 w-4" />
                          </div>
                          <p className="text-xs font-bold text-[#111315] truncate max-w-[200px]">
                            {selectedFile.name}
                          </p>
                          <span className="font-mono text-[10px] text-[#7E8794]">
                            {(selectedFile.size / 1024).toFixed(1)} KB
                          </span>
                          <span className="text-[10px] text-[#0935B8] font-mono underline mt-0.5">
                            Select different file
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex h-8 w-8 items-center justify-center rounded bg-white border border-[#DCD5C9] text-[#0935B8]">
                            <Upload className="h-4 w-4" />
                          </div>
                          <p className="text-xs font-bold text-[#111315]">
                            Click or drag file to ingest
                          </p>
                          <p className="text-[10px] text-[#7E8794] font-mono">
                            PDF, Markdown, TXT, JSON, CSV, Source Code
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-2.5">
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#555C68]">
                        Document Title
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Distributed Consensus Raft Specification"
                        value={docTitle}
                        onChange={(e) => setDocTitle(e.target.value)}
                        className="mt-1 w-full rounded border border-[#DCD5C9] bg-white px-3 py-1.5 text-xs text-[#111315] placeholder-[#7E8794] focus:border-[#0935B8] focus:outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#555C68]">
                        Document Title
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. High-Dimensional Spatial Indexing"
                        value={docTitle}
                        onChange={(e) => setDocTitle(e.target.value)}
                        className="mt-1 w-full rounded border border-[#DCD5C9] bg-white px-3 py-1.5 text-xs text-[#111315] placeholder-[#7E8794] focus:border-[#0935B8] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#555C68]">
                        Raw Text Content
                      </label>
                      <textarea
                        rows={5}
                        placeholder="Paste technical documentation, notes, or articles..."
                        value={docText}
                        onChange={(e) => setDocText(e.target.value)}
                        className="mt-1 w-full rounded border border-[#DCD5C9] bg-white px-3 py-1.5 text-xs text-[#111315] placeholder-[#7E8794] focus:border-[#0935B8] focus:outline-none resize-none font-sans"
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
                    ? "CHUNKING & INDEXING HNSW..."
                    : selectedFile
                    ? `INDEX "${selectedFile.name}"`
                    : "INGEST & COMPUTE EMBEDDINGS"}
                </Button>
              </form>
            </div>
          )}

          {/* Tab 3: Retrieved Context Chunks */}
          {knowledgeTab === "context" && (
            <div className="mt-3.5 space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {activeContexts.length === 0 ? (
                <EmptyState
                  icon={<Layers className="h-5 w-5" />}
                  title="No chunks retrieved yet"
                  description="Submit a question in the RAG stream to inspect matching passages retrieved from the vector index."
                />
              ) : (
                activeContexts.map((ctx, idx) => (
                  <div
                    key={ctx.id}
                    onClick={() => setSelectedChunk(ctx)}
                    className={`p-3 rounded border transition cursor-pointer ${
                      selectedChunk?.id === ctx.id
                        ? "bg-[#EEF3FF] border-[#0935B8] shadow-xs"
                        : "bg-white border-[#E3DED6] hover:border-[#0935B8]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-bold text-[#0935B8] truncate max-w-[190px]">
                        [{idx + 1}] • {ctx.title}
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
                            s={ctx.rerank_score}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-[#555C68] leading-relaxed line-clamp-3 font-sans">
                      {ctx.text}
                    </p>
                    <div className="mt-2 pt-1.5 border-t border-[#EBE7DF] flex items-center justify-between text-[10px] text-[#7E8794] font-mono">
                      <span>Cosine Distance: {ctx.distance ?? "N/A"}</span>
                      <span className="text-[#0935B8] font-bold">CLICK TO INSPECT</span>
                    </div>
                  </div>
                ))
              )}

              {/* Expanded Chunk Details */}
              {selectedChunk && (
                <div className="mt-3 p-3.5 rounded border border-[#0935B8] bg-white shadow-specimen">
                  <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#EBE7DF]">
                    <span className="font-bold text-xs text-[#111315] font-mono truncate max-w-[260px]">
                      Full Chunk: {selectedChunk.title}
                    </span>
                    <button
                      onClick={() => setSelectedChunk(null)}
                      className="text-[#7E8794] hover:text-[#111315] p-0.5"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-[#111315] leading-relaxed bg-[#FAF9F7] p-2.5 rounded border border-[#E3DED6] font-sans whitespace-pre-wrap">
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
