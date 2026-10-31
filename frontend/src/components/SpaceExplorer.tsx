"use client";

import React, { useEffect, useRef, useState } from "react";
import { PcaPoint } from "../lib/types";
import { fetchPcaPoints } from "../lib/api";
import { Compass, ZoomIn, ZoomOut, RotateCcw, Target, Sparkles, Filter } from "lucide-react";
import Badge from "./ui/Badge";

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  "Computer Science": { bg: "#4F46E5", border: "#6366F1", text: "#312E81", glow: "rgba(99, 102, 241, 0.25)" },
  "Mathematics": { bg: "#8B5CF6", border: "#A78BFA", text: "#4C1D95", glow: "rgba(139, 92, 246, 0.25)" },
  "Food": { bg: "#D97706", border: "#FBBF24", text: "#78350F", glow: "rgba(217, 119, 6, 0.25)" },
  "Sports": { bg: "#059669", border: "#34D399", text: "#064E3B", glow: "rgba(5, 150, 105, 0.25)" },
};

export const SpaceExplorer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [points, setPoints] = useState<PcaPoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<PcaPoint | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<PcaPoint | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [kNearest, setKNearest] = useState<number>(3);
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    fetchPcaPoints().then((pts) => {
      setPoints(pts);
      if (pts.length > 0) setSelectedPoint(pts[0]);
    });
  }, []);

  // Compute nearest neighbors to selectedPoint based on 2D euclidean distance on PCA plane
  const nearestNeighbors = React.useMemo(() => {
    if (!selectedPoint || points.length === 0) return [];
    return points
      .filter((p) => p.id !== selectedPoint.id)
      .map((p) => {
        const dx = p.x - selectedPoint.x;
        const dy = p.y - selectedPoint.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return { point: p, dist: (dist / 100).toFixed(3) };
      })
      .sort((a, b) => parseFloat(a.dist) - parseFloat(b.dist))
      .slice(0, kNearest);
  }, [selectedPoint, points, kNearest]);

  // Canvas drawing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2 + pan.x;
      const centerY = height / 2 + pan.y;
      const scale = (Math.min(width, height) / 220) * zoom;

      ctx.clearRect(0, 0, width, height);

      // Light background fill
      ctx.fillStyle = "#F8FAFC";
      ctx.fillRect(0, 0, width, height);

      // 1. Draw Radar Grid
      ctx.save();
      ctx.strokeStyle = "#E2E8F0";
      ctx.lineWidth = 1;

      // Concentric circles
      [40, 80, 120, 160].forEach((r) => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r * scale * 0.4, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Axis lines
      ctx.beginPath();
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, height);
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();
      ctx.restore();

      // 2. Draw Distance Beams to Nearest Neighbors
      if (selectedPoint) {
        const sx = centerX + selectedPoint.x * scale;
        const sy = centerY + selectedPoint.y * scale;

        nearestNeighbors.forEach(({ point: nPoint, dist }) => {
          const nx = centerX + nPoint.x * scale;
          const ny = centerY + nPoint.y * scale;

          ctx.save();
          // Soft modern gradient beam
          const grad = ctx.createLinearGradient(sx, sy, nx, ny);
          grad.addColorStop(0, "rgba(79, 70, 229, 0.75)");
          grad.addColorStop(1, "rgba(139, 92, 246, 0.3)");
          ctx.strokeStyle = grad;
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(nx, ny);
          ctx.stroke();

          // Draw distance tag pill
          const midX = (sx + nx) / 2;
          const midY = (sy + ny) / 2;
          ctx.fillStyle = "#FFFFFF";
          ctx.shadowColor = "rgba(0, 0, 0, 0.08)";
          ctx.shadowBlur = 6;
          ctx.shadowOffsetY = 2;
          ctx.beginPath();
          ctx.roundRect ? ctx.roundRect(midX - 24, midY - 10, 48, 20, 10) : ctx.rect(midX - 24, midY - 10, 48, 20);
          ctx.fill();

          ctx.shadowColor = "transparent";
          ctx.strokeStyle = "#CBD5E1";
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = "#4F46E5";
          ctx.font = "bold 10px monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(`d=${dist}`, midX, midY + 1);
          ctx.restore();
        });
      }

      // 3. Draw Points
      points.forEach((p) => {
        if (selectedCategory !== "All" && p.category !== selectedCategory) return;

        const px = centerX + p.x * scale;
        const py = centerY + p.y * scale;
        const isSelected = selectedPoint?.id === p.id;
        const isHovered = hoveredPoint?.id === p.id;
        const isNeighbor = nearestNeighbors.some((n) => n.point.id === p.id);
        const style = CATEGORY_COLORS[p.category] || CATEGORY_COLORS["Computer Science"];

        ctx.save();

        // Shadow / halo
        if (isSelected || isNeighbor || isHovered) {
          ctx.shadowColor = isSelected ? "rgba(79, 70, 229, 0.4)" : "rgba(0, 0, 0, 0.15)";
          ctx.shadowBlur = isSelected ? 16 : 8;
          ctx.shadowOffsetY = isSelected ? 4 : 2;
        }

        ctx.beginPath();
        const radius = isSelected ? 9 : isHovered ? 8 : isNeighbor ? 7 : 5.5;
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? "#4F46E5" : style.bg;
        ctx.fill();

        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.strokeStyle = "#FFFFFF";
        ctx.stroke();

        // Label on hover or selected
        if (isSelected || isHovered || isNeighbor) {
          ctx.shadowBlur = 0;
          ctx.fillStyle = isSelected ? "#0F172A" : "#334155";
          ctx.font = isSelected ? "bold 11px sans-serif" : "500 10px sans-serif";
          ctx.textAlign = "left";

          // Text background for legibility
          const textMetrics = ctx.measureText(p.metadata);
          ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
          ctx.fillRect(px + 12, py - 9, textMetrics.width + 8, 18);

          ctx.fillStyle = isSelected ? "#4F46E5" : "#1E293B";
          ctx.fillText(p.metadata, px + 16, py + 4);
        }

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [points, selectedPoint, hoveredPoint, selectedCategory, nearestNeighbors, zoom, pan]);

  // Handle canvas mouse interactions
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - dragStart.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
      return;
    }

    // Hit test for points
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2 + pan.x;
    const centerY = height / 2 + pan.y;
    const scale = (Math.min(width, height) / 220) * zoom;

    let found: PcaPoint | null = null;
    for (const p of points) {
      if (selectedCategory !== "All" && p.category !== selectedCategory) continue;
      const px = centerX + p.x * scale;
      const py = centerY + p.y * scale;
      const dist = Math.hypot(mouseX - px, mouseY - py);
      if (dist < 12) {
        found = p;
        break;
      }
    }
    setHoveredPoint(found);
    canvas.style.cursor = found ? "pointer" : isDragging ? "grabbing" : "grab";
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleClick = () => {
    if (hoveredPoint) {
      setSelectedPoint(hoveredPoint);
    }
  };

  const categories = ["All", "Computer Science", "Mathematics", "Food", "Sports"];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* 2D Space Canvas */}
      <div className="surface-card relative flex flex-col overflow-hidden lg:col-span-2">
        {/* Radar Controls Header */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-100 px-4 py-3 bg-white">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-indigo-600" />
            <span className="text-sm font-semibold text-slate-800">2D Semantic Space (PCA Projection)</span>
            <span className="text-xs text-slate-500">({points.length} vectors)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setZoom((z) => Math.min(z + 0.2, 2.5))}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(z - 0.2, 0.6))}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setZoom(1.0);
                setPan({ x: 0, y: 0 });
              }}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
              title="Reset View"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-4 py-2.5 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 mr-1">
            <Filter className="h-3.5 w-3.5" />
            <span className="font-medium text-[11px]">Filter:</span>
          </div>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-3 py-1 transition font-medium text-xs ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Canvas Area */}
        <div className="relative h-[480px] w-full bg-[#F8FAFC]">
          <canvas
            ref={canvasRef}
            width={800}
            height={480}
            className="h-full w-full"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onClick={handleClick}
          />
          <div className="pointer-events-none absolute bottom-3 left-3 text-[11px] text-slate-400 bg-white/80 backdrop-blur-xs px-2.5 py-1 rounded-md border border-slate-200/60">
            Drag to pan • Zoom with buttons • Click any point to cast search beam
          </div>
        </div>
      </div>

      {/* Selected Vector & Nearest Neighbor Inspector */}
      <div className="flex flex-col gap-5">
        <div className="surface-card p-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-semibold text-slate-900">Target Vector</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Top-K:</span>
              <select
                value={kNearest}
                onChange={(e) => setKNearest(Number(e.target.value))}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 shadow-xs"
              >
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={5}>5</option>
              </select>
            </div>
          </div>

          {selectedPoint ? (
            <div className="mt-4 space-y-4">
              <div>
                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Label</span>
                <p className="text-base font-semibold text-slate-900 mt-0.5">{selectedPoint.metadata}</p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                  <span className="text-slate-500 text-[11px]">Category</span>
                  <p className="mt-0.5 font-semibold text-indigo-700">{selectedPoint.category}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                  <span className="text-slate-500 text-[11px]">PCA Coordinates</span>
                  <p className="mt-0.5 font-mono text-slate-700 font-medium">
                    ({selectedPoint.x}, {selectedPoint.y})
                  </p>
                </div>
              </div>

              {/* Nearest Neighbors List */}
              <div className="pt-2">
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800">
                    Nearest Neighbors in Space:
                  </span>
                  <Badge variant="indigo" size="xs">HNSW Cosine</Badge>
                </div>
                <div className="space-y-2">
                  {nearestNeighbors.map(({ point: np, dist }, idx) => (
                    <div
                      key={np.id}
                      onClick={() => setSelectedPoint(np)}
                      className="group flex cursor-pointer items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 transition hover:border-indigo-200 hover:bg-indigo-50/50"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white border border-slate-200 text-[10px] font-mono text-slate-600 font-bold group-hover:border-indigo-300 group-hover:text-indigo-700">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0 truncate">
                          <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-indigo-900">
                            {np.metadata}
                          </p>
                          <span className="text-[10px] text-slate-500">{np.category}</span>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-semibold text-indigo-600 shrink-0 ml-2">d={dist}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-xs text-slate-400">Click any point on the radar to inspect.</p>
          )}
        </div>

        {/* Algorithm Insight Card */}
        <div className="surface-card p-5 bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/30 border-indigo-100/70">
          <div className="flex items-center gap-2 text-indigo-700 mb-2">
            <Sparkles className="h-4 w-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Dimensionality Reduction</h4>
          </div>
          <p className="text-xs leading-relaxed text-slate-600">
            The original vectors live in a <strong className="text-slate-900 font-semibold">16-dimensional</strong> semantic space. Principal Component Analysis (PCA) projects these hyper-dimensional clusters onto a 2D plane while preserving the maximum variance of cosine angles.
          </p>
        </div>
      </div>
    </div>
  );
};
