"use client";

import React, { useEffect, useRef, useState } from "react";
import { PcaPoint } from "../lib/types";
import { fetchPcaPoints } from "../lib/api";
import { Compass, ZoomIn, ZoomOut, RotateCcw, Target, Sparkles, Filter } from "lucide-react";

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  "Computer Science": { bg: "#06b6d4", border: "#22d3ee", text: "#67e8f9", glow: "rgba(6,182,212,0.4)" },
  "Mathematics": { bg: "#a855f7", border: "#c084fc", text: "#d8b4fe", glow: "rgba(168,85,247,0.4)" },
  "Food": { bg: "#f59e0b", border: "#fbbf24", text: "#fde68a", glow: "rgba(245,158,11,0.4)" },
  "Sports": { bg: "#10b981", border: "#34d399", text: "#a7f3d0", glow: "rgba(16,185,129,0.4)" },
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

      // 1. Draw Radar Grid
      ctx.save();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
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

        nearestNeighbors.forEach(({ point: nPoint, dist }, idx) => {
          const nx = centerX + nPoint.x * scale;
          const ny = centerY + nPoint.y * scale;

          ctx.save();
          // Glowing gradient beam
          const grad = ctx.createLinearGradient(sx, sy, nx, ny);
          grad.addColorStop(0, "rgba(6, 182, 212, 0.8)");
          grad.addColorStop(1, "rgba(168, 85, 247, 0.2)");
          ctx.strokeStyle = grad;
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(nx, ny);
          ctx.stroke();

          // Draw distance tag
          const midX = (sx + nx) / 2;
          const midY = (sy + ny) / 2;
          ctx.fillStyle = "#08090d";
          ctx.strokeStyle = "rgba(6, 182, 212, 0.4)";
          ctx.lineWidth = 1;
          ctx.fillRect(midX - 22, midY - 10, 44, 18);
          ctx.strokeRect(midX - 22, midY - 10, 44, 18);
          ctx.fillStyle = "#67e8f9";
          ctx.font = "10px monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(`d=${dist}`, midX, midY);
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
        // Glow effect
        if (isSelected || isNeighbor || isHovered) {
          ctx.shadowColor = isSelected ? "#06b6d4" : style.border;
          ctx.shadowBlur = isSelected ? 20 : 12;
        }

        ctx.beginPath();
        const radius = isSelected ? 9 : isHovered ? 8 : isNeighbor ? 7 : 5.5;
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? "#ffffff" : style.bg;
        ctx.fill();
        ctx.lineWidth = isSelected ? 3 : 1.5;
        ctx.strokeStyle = isSelected ? "#06b6d4" : style.border;
        ctx.stroke();

        // Label on hover or selected
        if (isSelected || isHovered || isNeighbor) {
          ctx.shadowBlur = 0;
          ctx.fillStyle = isSelected ? "#ffffff" : style.text;
          ctx.font = isSelected ? "bold 11px sans-serif" : "10px sans-serif";
          ctx.textAlign = "left";
          ctx.fillText(p.metadata, px + 12, py + 4);
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
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
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

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (hoveredPoint) {
      setSelectedPoint(hoveredPoint);
    }
  };

  const categories = ["All", "Computer Science", "Mathematics", "Food", "Sports"];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* 2D Space Canvas */}
      <div className="glass-panel relative flex flex-col overflow-hidden rounded-2xl lg:col-span-2">
        {/* Radar Controls Header */}
        <div className="flex flex-wrap items-center justify-between border-b border-white/10 px-4 py-3 bg-[#0d0f16]/60">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-semibold text-white">2D Semantic Space (PCA Projection)</span>
            <span className="text-xs text-gray-400">({points.length} vectors)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom((z) => Math.min(z + 0.2, 2.5))}
              className="rounded-lg border border-white/10 p-1.5 text-gray-400 hover:bg-white/5 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(z - 0.2, 0.6))}
              className="rounded-lg border border-white/10 p-1.5 text-gray-400 hover:bg-white/5 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setZoom(1.0);
                setPan({ x: 0, y: 0 });
              }}
              className="rounded-lg border border-white/10 p-1.5 text-gray-400 hover:bg-white/5 hover:text-white"
              title="Reset View"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2 border-b border-white/5 px-4 py-2 text-xs">
          <Filter className="h-3.5 w-3.5 text-gray-400" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-2.5 py-0.5 transition ${
                selectedCategory === cat
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-medium"
                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Canvas Area */}
        <div className="relative h-[480px] w-full bg-cyber-grid bg-[#08090d]">
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
          <div className="pointer-events-none absolute bottom-3 left-3 text-[11px] text-gray-500">
            Drag to pan • Scroll / buttons to zoom • Click a vector to cast search beam
          </div>
        </div>
      </div>

      {/* Selected Vector & Nearest Neighbor Inspector */}
      <div className="flex flex-col gap-6">
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">Target Vector</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Top-K:</span>
              <select
                value={kNearest}
                onChange={(e) => setKNearest(Number(e.target.value))}
                className="rounded-lg border border-white/10 bg-[#12141c] px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-cyan-500"
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
                <span className="text-xs text-gray-400">Label</span>
                <p className="font-semibold text-white">{selectedPoint.metadata}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-white/5 bg-[#12141c] p-2.5">
                  <span className="text-gray-400">Category</span>
                  <p className="mt-0.5 font-medium text-cyan-300">{selectedPoint.category}</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-[#12141c] p-2.5">
                  <span className="text-gray-400">PCA Coordinates</span>
                  <p className="mt-0.5 font-mono text-gray-300">
                    ({selectedPoint.x}, {selectedPoint.y})
                  </p>
                </div>
              </div>

              {/* Nearest Neighbors List */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-300">
                    Nearest Neighbors in Space:
                  </span>
                  <span className="text-[10px] text-cyan-400">HNSW / Cosine</span>
                </div>
                <div className="space-y-2">
                  {nearestNeighbors.map(({ point: np, dist }, idx) => (
                    <div
                      key={np.id}
                      onClick={() => setSelectedPoint(np)}
                      className="group flex cursor-pointer items-center justify-between rounded-xl border border-white/5 bg-[#12141c] p-2.5 transition hover:border-cyan-500/40 hover:bg-cyan-500/5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white/5 text-[10px] font-mono text-gray-400 group-hover:text-cyan-300">
                          #{idx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-medium text-gray-200 group-hover:text-white">
                            {np.metadata}
                          </p>
                          <span className="text-[10px] text-gray-400">{np.category}</span>
                        </div>
                      </div>
                      <span className="font-mono text-xs text-cyan-400">d={dist}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-xs text-gray-500">Click any point on the radar to inspect.</p>
          )}
        </div>

        {/* Algorithm Insight Card */}
        <div className="glass-panel rounded-2xl p-5 bg-gradient-to-br from-[#0d0f16] to-[#121626]">
          <div className="flex items-center gap-2 text-cyan-400">
            <Sparkles className="h-4 w-4" />
            <h4 className="text-xs font-semibold uppercase tracking-wider">Dimensionality Reduction</h4>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-gray-400">
            The original vectors live in a <strong className="text-gray-200">16-dimensional</strong> semantic space. Principal Component Analysis (PCA) projects these hyper-dimensional clusters onto a 2D plane while preserving the maximum variance of cosine angles.
          </p>
        </div>
      </div>
    </div>
  );
};
