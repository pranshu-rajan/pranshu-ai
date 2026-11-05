"use client";

import React, { useEffect, useRef, useState } from "react";
import { PcaPoint } from "../lib/types";
import { fetchPcaPoints } from "../lib/api";
import { Compass, ZoomIn, ZoomOut, RotateCcw, Target, Sparkles, Filter, Crosshair } from "lucide-react";
import Badge from "./ui/Badge";

const CATEGORY_SPECS: Record<
  string,
  { color: string; border: string; bgLight: string; text: string; shape: "diamond" | "square" | "circle" | "triangle"; symbol: string }
> = {
  "Computer Science": { color: "#0935B8", border: "#082B96", bgLight: "#EEF3FF", text: "#0935B8", shape: "diamond", symbol: "◆" },
  "Mathematics": { color: "#4338CA", border: "#3730A3", bgLight: "#EEF2FF", text: "#4338CA", shape: "square", symbol: "■" },
  "Food": { color: "#C2410C", border: "#9A3412", bgLight: "#FFF7ED", text: "#C2410C", shape: "circle", symbol: "●" },
  "Sports": { color: "#0D5F52", border: "#064E3B", bgLight: "#F0FDF4", text: "#0D5F52", shape: "triangle", symbol: "▲" },
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

  // Compute nearest neighbors to selectedPoint based on 2D Euclidean distance on PCA plane
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

    const drawGlyph = (
      context: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number,
      shape: "diamond" | "square" | "circle" | "triangle"
    ) => {
      context.beginPath();
      if (shape === "circle") {
        context.arc(x, y, size, 0, Math.PI * 2);
      } else if (shape === "square") {
        context.rect(x - size, y - size, size * 2, size * 2);
      } else if (shape === "diamond") {
        context.moveTo(x, y - size * 1.3);
        context.lineTo(x + size * 1.3, y);
        context.lineTo(x, y + size * 1.3);
        context.lineTo(x - size * 1.3, y);
        context.closePath();
      } else if (shape === "triangle") {
        context.moveTo(x, y - size * 1.3);
        context.lineTo(x + size * 1.2, y + size * 0.9);
        context.lineTo(x - size * 1.2, y + size * 0.9);
        context.closePath();
      }
    };

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2 + pan.x;
      const centerY = height / 2 + pan.y;
      const scale = (Math.min(width, height) / 220) * zoom;

      ctx.clearRect(0, 0, width, height);

      // Warm Alabaster Canvas Base
      ctx.fillStyle = "#F7F6F3";
      ctx.fillRect(0, 0, width, height);

      // 1. Technical Cartographic Gridlines
      ctx.save();
      ctx.strokeStyle = "rgba(227, 222, 214, 0.65)";
      ctx.lineWidth = 1;

      // Concentric Range Rings
      [40, 80, 120, 160].forEach((r) => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r * scale * 0.4, 0, Math.PI * 2);
        ctx.stroke();

        // Distance range label
        ctx.fillStyle = "#A8A090";
        ctx.font = "9px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(`r=${r}`, centerX + r * scale * 0.4, centerY - 2);
      });

      // Axis Crosshairs
      ctx.strokeStyle = "rgba(200, 193, 180, 0.85)";
      ctx.beginPath();
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, height);
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();

      // Axis Tick Marks every 30px
      const tickSpacing = 30 * scale * 0.4;
      for (let offset = tickSpacing; offset < Math.max(width, height); offset += tickSpacing) {
        // X-axis ticks
        ctx.beginPath();
        ctx.moveTo(centerX + offset, centerY - 3);
        ctx.lineTo(centerX + offset, centerY + 3);
        ctx.moveTo(centerX - offset, centerY - 3);
        ctx.lineTo(centerX - offset, centerY + 3);
        // Y-axis ticks
        ctx.moveTo(centerX - 3, centerY + offset);
        ctx.lineTo(centerX + 3, centerY + offset);
        ctx.moveTo(centerX - 3, centerY - offset);
        ctx.lineTo(centerX + 3, centerY - offset);
        ctx.stroke();
      }
      ctx.restore();

      // 2. Nearest Neighbor Distance Calipers
      if (selectedPoint) {
        const sx = centerX + selectedPoint.x * scale;
        const sy = centerY + selectedPoint.y * scale;

        nearestNeighbors.forEach(({ point: nPoint, dist }) => {
          const nx = centerX + nPoint.x * scale;
          const ny = centerY + nPoint.y * scale;

          ctx.save();
          // Crisp dashed measurement line
          ctx.strokeStyle = "#0935B8";
          ctx.lineWidth = 1.2;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(nx, ny);
          ctx.stroke();

          // Caliper numeric pill at midpoint
          const midX = (sx + nx) / 2;
          const midY = (sy + ny) / 2;
          ctx.fillStyle = "#FFFFFF";
          ctx.shadowColor = "rgba(17, 19, 21, 0.08)";
          ctx.shadowBlur = 4;
          ctx.shadowOffsetY = 1;
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(midX - 26, midY - 9, 52, 18, 4);
          } else {
            ctx.rect(midX - 26, midY - 9, 52, 18);
          }
          ctx.fill();

          ctx.shadowColor = "transparent";
          ctx.strokeStyle = "#DCD5C9";
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = "#0935B8";
          ctx.font = "bold 9px monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(`d=${dist}`, midX, midY + 0.5);
          ctx.restore();
        });

        // Targeting reticle around selected point
        ctx.save();
        ctx.strokeStyle = "#0935B8";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(sx, sy, 18, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = "rgba(9, 53, 184, 0.4)";
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.arc(sx, sy, 24, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 3. Draw All Projected Points
      points.forEach((p) => {
        if (selectedCategory !== "All" && p.category !== selectedCategory) return;

        const px = centerX + p.x * scale;
        const py = centerY + p.y * scale;
        const isSelected = selectedPoint?.id === p.id;
        const isHovered = hoveredPoint?.id === p.id;
        const isNeighbor = nearestNeighbors.some((n) => n.point.id === p.id);
        const spec = CATEGORY_SPECS[p.category] || CATEGORY_SPECS["Computer Science"];

        ctx.save();

        const baseSize = isSelected ? 8 : isHovered ? 7.5 : isNeighbor ? 6.5 : 5;

        // Subtle shadow
        if (isSelected || isNeighbor || isHovered) {
          ctx.shadowColor = "rgba(17, 19, 21, 0.12)";
          ctx.shadowBlur = 6;
          ctx.shadowOffsetY = 2;
        }

        drawGlyph(ctx, px, py, baseSize, spec.shape);
        ctx.fillStyle = isSelected ? "#0935B8" : spec.color;
        ctx.fill();

        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        ctx.strokeStyle = "#FFFFFF";
        ctx.stroke();

        // Technical coordinate label on hover or selection
        if (isSelected || isHovered || isNeighbor) {
          ctx.shadowBlur = 0;
          ctx.font = isSelected ? "bold 10px monospace" : "500 10px sans-serif";
          ctx.textAlign = "left";

          const labelText = isSelected
            ? `${p.metadata} [${p.x}, ${p.y}]`
            : p.metadata;

          const textMetrics = ctx.measureText(labelText);
          ctx.fillStyle = "#FFFFFF";
          ctx.strokeStyle = "#E3DED6";
          ctx.lineWidth = 1;

          const boxX = px + 12;
          const boxY = py - 8;
          const boxW = textMetrics.width + 10;
          const boxH = 17;

          if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(boxX, boxY, boxW, boxH, 3);
            ctx.fill();
            ctx.stroke();
          } else {
            ctx.fillRect(boxX, boxY, boxW, boxH);
            ctx.strokeRect(boxX, boxY, boxW, boxH);
          }

          ctx.fillStyle = isSelected ? "#0935B8" : "#111315";
          ctx.fillText(labelText, boxX + 5, boxY + 12);
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
    canvas.style.cursor = found ? "pointer" : isDragging ? "grabbing" : "crosshair";
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleClick = () => {
    if (hoveredPoint) {
      setSelectedPoint(hoveredPoint);
    }
  };

  const categories = ["All", "Computer Science", "Mathematics", "Food", "Sports"];

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      {/* 2D Space Canvas Container */}
      <div className="surface-card relative flex flex-col overflow-hidden lg:col-span-2">
        {/* Radar Controls Header */}
        <div className="flex flex-wrap items-center justify-between border-b border-[#E3DED6] px-4 py-3 bg-[#FAF9F7]">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-[#0935B8]" />
            <span className="text-xs font-bold text-[#111315] uppercase tracking-wider font-mono">
              2D Manifold Projection (PCA)
            </span>
            <span className="text-[10px] text-[#7E8794] font-mono tabular-nums">
              [{points.length} VECTORS]
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setZoom((z) => Math.min(z + 0.2, 2.5))}
              className="rounded border border-[#DCD5C9] bg-white p-1 text-[#555C68] hover:text-[#111315] hover:bg-[#F3F1EC] transition shadow-xs"
              title="Zoom In"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(z - 0.2, 0.6))}
              className="rounded border border-[#DCD5C9] bg-white p-1 text-[#555C68] hover:text-[#111315] hover:bg-[#F3F1EC] transition shadow-xs"
              title="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => {
                setZoom(1.0);
                setPan({ x: 0, y: 0 });
              }}
              className="rounded border border-[#DCD5C9] bg-white p-1 text-[#555C68] hover:text-[#111315] hover:bg-[#F3F1EC] transition shadow-xs"
              title="Reset View"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-[#E3DED6] bg-[#EDEAE3]/50 px-4 py-2 text-xs">
          <div className="flex items-center gap-1 text-[#7E8794] mr-1">
            <Filter className="h-3 w-3" />
            <span className="font-mono text-[10px] uppercase">Filter:</span>
          </div>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const spec = CATEGORY_SPECS[cat];
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded px-2.5 py-0.5 transition font-mono text-[11px] flex items-center gap-1 ${
                  isSelected
                    ? "bg-[#111315] text-white shadow-xs font-semibold"
                    : "bg-white text-[#555C68] hover:bg-[#F3F1EC] border border-[#DCD5C9]"
                }`}
              >
                {spec && <span style={{ color: isSelected ? "#FFFFFF" : spec.color }}>{spec.symbol}</span>}
                <span>{cat}</span>
              </button>
            );
          })}
        </div>

        {/* Canvas Area */}
        <div className="relative h-[490px] w-full bg-[#F7F6F3]">
          <canvas
            ref={canvasRef}
            width={800}
            height={490}
            className="h-full w-full"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onClick={handleClick}
          />
          <div className="pointer-events-none absolute bottom-3 left-3 text-[10px] font-mono text-[#7E8794] bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded border border-[#E3DED6]">
            Pan: Drag • Zoom: Controls • Reticle: Click node to cast distance calipers
          </div>
        </div>
      </div>

      {/* Target Specimen Inspector Panel */}
      <div className="flex flex-col gap-4">
        <div className="surface-card p-4 sm:p-5">
          <div className="flex items-center justify-between border-b border-[#EBE7DF] pb-3">
            <div className="flex items-center gap-2">
              <Crosshair className="h-4 w-4 text-[#0935B8]" />
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-[#111315]">
                Target Vector
              </h3>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-[#7E8794] font-mono">TOP-K:</span>
              <select
                value={kNearest}
                onChange={(e) => setKNearest(Number(e.target.value))}
                className="rounded border border-[#DCD5C9] bg-white px-2 py-0.5 text-xs font-mono text-[#111315] focus:outline-none focus:border-[#0935B8] shadow-xs"
              >
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={5}>5</option>
              </select>
            </div>
          </div>

          {selectedPoint ? (
            <div className="mt-3.5 space-y-3.5">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#7E8794]">Label</span>
                <p className="text-sm font-semibold text-[#111315] mt-0.5">{selectedPoint.metadata}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded border border-[#E3DED6] bg-[#FAF9F7] p-2.5">
                  <span className="text-[#7E8794] text-[10px] font-mono uppercase">Category</span>
                  <p className="mt-0.5 font-semibold text-[#0935B8] text-xs">
                    {selectedPoint.category}
                  </p>
                </div>
                <div className="rounded border border-[#E3DED6] bg-[#FAF9F7] p-2.5">
                  <span className="text-[#7E8794] text-[10px] font-mono uppercase">PCA Coordinate</span>
                  <p className="mt-0.5 font-mono text-[#111315] text-xs tabular-nums">
                    [{selectedPoint.x}, {selectedPoint.y}]
                  </p>
                </div>
              </div>

              {/* Nearest Neighbors List */}
              <div className="pt-1">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider font-mono text-[#555C68]">
                    Nearest Neighbors:
                  </span>
                  <Badge variant="indigo" size="xs">COSINE</Badge>
                </div>
                <div className="space-y-1.5">
                  {nearestNeighbors.map(({ point: np, dist }, idx) => (
                    <div
                      key={np.id}
                      onClick={() => setSelectedPoint(np)}
                      className="group flex cursor-pointer items-center justify-between rounded border border-[#E3DED6] bg-[#FAF9F7] p-2 transition hover:border-[#0935B8] hover:bg-white"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-white border border-[#DCD5C9] text-[10px] font-mono text-[#555C68] font-bold group-hover:border-[#0935B8] group-hover:text-[#0935B8]">
                          {idx + 1}
                        </span>
                        <div className="min-w-0 truncate">
                          <p className="text-xs font-medium text-[#111315] truncate group-hover:text-[#0935B8]">
                            {np.metadata}
                          </p>
                          <span className="text-[10px] text-[#7E8794] font-mono">{np.category}</span>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-semibold text-[#0935B8] shrink-0 ml-2 tabular-nums">
                        d={dist}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-xs text-[#7E8794] font-mono">Click any reticle on the manifold to inspect.</p>
          )}
        </div>

        {/* Algorithm Insight Card */}
        <div className="surface-card p-4 sm:p-5 border-l-2 border-l-[#0935B8]">
          <div className="flex items-center gap-1.5 text-[#0935B8] mb-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider">
              Dimensionality Reduction Spec
            </h4>
          </div>
          <p className="text-xs leading-relaxed text-[#555C68]">
            The original vectors occupy a <strong className="text-[#111315] font-semibold">16-dimensional</strong> mathematical manifold. Principal Component Analysis (PCA) projects these hyper-dimensional embeddings onto a 2D plane by computing the principal eigenvectors of the covariance matrix, preserving maximal angular variance.
          </p>
        </div>
      </div>
    </div>
  );
};
