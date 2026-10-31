"use client";

import React, { useEffect, useState } from "react";
import { HnswGraphData } from "../lib/types";
import { fetchHnswInfo } from "../lib/api";
import { Network, Play, Zap, Info, ArrowDownRight } from "lucide-react";
import Button from "./ui/Button";
import Badge from "./ui/Badge";

export const HnswInspector: React.FC = () => {
  const [data, setData] = useState<HnswGraphData | null>(null);
  const [activeLayer, setActiveLayer] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [highlightedNodes, setHighlightedNodes] = useState<number[]>([]);
  const [highlightedEdges, setHighlightedEdges] = useState<string[]>([]);
  const [simulationLog, setSimulationLog] = useState<string[]>([]);

  useEffect(() => {
    fetchHnswInfo().then((res) => {
      setData(res);
      setActiveLayer(res.topLayer > 0 ? 1 : 0);
    });
  }, []);

  // Filter nodes & edges present at activeLayer
  const layerNodes = React.useMemo(() => {
    if (!data) return [];
    return data.nodes.filter((n) => n.maxLyr >= activeLayer);
  }, [data, activeLayer]);

  const layerEdges = React.useMemo(() => {
    if (!data) return [];
    return data.edges.filter((e) => e.lyr === activeLayer);
  }, [data, activeLayer]);

  // Compute 2D layout positions for nodes on circle/ellipse for visual clarity
  const nodePositions = React.useMemo(() => {
    const pos: Record<number, { x: number; y: number }> = {};
    const count = layerNodes.length;
    if (count === 0) return pos;

    const cx = 350;
    const cy = 230;
    const rx = 260;
    const ry = 170;

    layerNodes.forEach((node, idx) => {
      const angle = (idx / count) * 2 * Math.PI - Math.PI / 2;
      pos[node.id] = {
        x: cx + rx * Math.cos(angle),
        y: cy + ry * Math.sin(angle),
      };
    });
    return pos;
  }, [layerNodes]);

  // Search traversal animation
  const runSimulation = () => {
    if (!data || isSimulating || layerNodes.length < 2) return;
    setIsSimulating(true);
    setHighlightedNodes([]);
    setHighlightedEdges([]);
    setSimulationLog([]);

    const entryNode = layerNodes[0];
    const targetNode = layerNodes[Math.min(layerNodes.length - 1, 3)];

    const steps: { node: number; edge: string | null; msg: string }[] = [
      {
        node: entryNode.id,
        edge: null,
        msg: `Entry Point: Node #${entryNode.id} ("${entryNode.metadata}") at Layer ${activeLayer}`,
      },
    ];

    // Find a link from entryNode
    const connectedEdges = layerEdges.filter(
      (e) => e.src === entryNode.id || e.dst === entryNode.id
    );

    if (connectedEdges.length > 0) {
      const edge = connectedEdges[0];
      const nextId = edge.src === entryNode.id ? edge.dst : edge.src;
      const nextNode = layerNodes.find((n) => n.id === nextId);
      steps.push({
        node: nextId,
        edge: `${edge.src}-${edge.dst}`,
        msg: `Greedy Hop: Evaluated cosine distance to neighbor Node #${nextId} ("${nextNode?.metadata || ""}")`,
      });
    }

    steps.push({
      node: targetNode.id,
      edge: null,
      msg: `Local Optimum Reached at Layer ${activeLayer}. Dropping down to Layer ${Math.max(0, activeLayer - 1)}...`,
    });

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep >= steps.length) {
        clearInterval(interval);
        setIsSimulating(false);
        return;
      }
      const s = steps[currentStep];
      setHighlightedNodes((prev) => [...prev, s.node]);
      const edgeVal = s.edge;
      if (edgeVal) {
        setHighlightedEdges((prev) => [...prev, edgeVal]);
      }
      setSimulationLog((prev) => [...prev, s.msg]);
      currentStep++;
    }, 800);
  };

  if (!data) {
    return (
      <div className="surface-card p-12 text-center text-slate-500">
        <div className="w-8 h-8 mx-auto mb-3 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
        <p className="text-sm font-medium">Loading HNSW topology...</p>
      </div>
    );
  }

  const layersCount = data.topLayer + 1;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Graph Visualizer Canvas */}
      <div className="surface-card relative flex flex-col overflow-hidden lg:col-span-2">
        {/* Header Controls */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-100 px-5 py-3.5 bg-white">
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-900">Hierarchical Proximity Graph</h3>
            <span className="text-xs text-slate-400 font-medium">({layerNodes.length} nodes active)</span>
          </div>

          <Button
            size="sm"
            variant="subtle"
            onClick={runSimulation}
            disabled={isSimulating}
            icon={<Play className="h-3.5 w-3.5" />}
          >
            {isSimulating ? "Traversing..." : "Simulate Search Hop"}
          </Button>
        </div>

        {/* Layer Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50/70 px-5 py-2.5">
          <span className="text-xs text-slate-500 font-medium mr-1">Layer Level:</span>
          {Array.from({ length: layersCount }).map((_, lyr) => {
            const nodeCount = data.nodesPerLayer[lyr] || 0;
            const edgeCount = data.edgesPerLayer[lyr] || 0;
            const isActive = activeLayer === lyr;
            return (
              <button
                key={lyr}
                onClick={() => {
                  setActiveLayer(lyr);
                  setHighlightedNodes([]);
                  setHighlightedEdges([]);
                  setSimulationLog([]);
                }}
                className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs transition font-medium ${
                  isActive
                    ? "bg-white text-indigo-700 shadow-sm border border-indigo-200/80 font-semibold"
                    : "bg-transparent text-slate-600 hover:bg-slate-200/50"
                }`}
              >
                <span>Layer {lyr}</span>
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-mono ${
                    isActive ? "bg-indigo-50 text-indigo-600" : "bg-slate-200/60 text-slate-500"
                  }`}
                >
                  {nodeCount}n • {edgeCount}e
                </span>
              </button>
            );
          })}
        </div>

        {/* SVG Graph View */}
        <div className="relative h-[480px] w-full bg-[#FAFBFD]">
          <svg className="h-full w-full" viewBox="0 0 700 460">
            {/* Edges */}
            {layerEdges.map((e, idx) => {
              const srcPos = nodePositions[e.src];
              const dstPos = nodePositions[e.dst];
              if (!srcPos || !dstPos) return null;

              const edgeKey = `${e.src}-${e.dst}`;
              const isEdgeHighlighted =
                highlightedEdges.includes(edgeKey) ||
                highlightedEdges.includes(`${e.dst}-${e.src}`);

              return (
                <line
                  key={idx}
                  x1={srcPos.x}
                  y1={srcPos.y}
                  x2={dstPos.x}
                  y2={dstPos.y}
                  stroke={isEdgeHighlighted ? "#6366F1" : "#E2E8F0"}
                  strokeWidth={isEdgeHighlighted ? 2.5 : 1.2}
                  strokeDasharray={isEdgeHighlighted ? "4,4" : undefined}
                />
              );
            })}

            {/* Nodes */}
            {layerNodes.map((n) => {
              const pos = nodePositions[n.id];
              if (!pos) return null;

              const isNodeHighlighted = highlightedNodes.includes(n.id);
              const isTopLayerNode = n.maxLyr === data.topLayer;

              return (
                <g key={n.id} className="cursor-pointer transition-transform">
                  {isNodeHighlighted && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={22}
                      fill="none"
                      stroke="#6366F1"
                      strokeWidth={2}
                      className="animate-ping opacity-60"
                    />
                  )}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={isNodeHighlighted ? 12 : 9}
                    fill={isNodeHighlighted ? "#6366F1" : isTopLayerNode ? "#8B5CF6" : "#475569"}
                    stroke="#FFFFFF"
                    strokeWidth={2.5}
                    className="shadow-sm"
                  />
                  <text
                    x={pos.x}
                    y={pos.y - 14}
                    fill={isNodeHighlighted ? "#4338CA" : "#475569"}
                    fontSize="11"
                    fontWeight={isNodeHighlighted ? "bold" : "500"}
                    fontFamily="sans-serif"
                    textAnchor="middle"
                  >
                    {n.metadata.length > 20 ? `${n.metadata.slice(0, 18)}…` : n.metadata}
                  </text>
                  <text
                    x={pos.x}
                    y={pos.y + 3}
                    fill="#FFFFFF"
                    fontSize="8"
                    fontWeight="bold"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    #{n.id}
                  </text>
                </g>
              );
            })}
          </svg>
          <div className="pointer-events-none absolute bottom-3 left-4 text-[11px] text-slate-500 bg-white/80 backdrop-blur-xs px-2.5 py-1 rounded-md border border-slate-200/60">
            {activeLayer === 0
              ? "Layer 0: Dense local neighborhood network with highest recall."
              : `Layer ${activeLayer}: Sparse expressway network with long-distance skip connections.`}
          </div>
        </div>
      </div>

      {/* Traversal Log & HNSW Theory */}
      <div className="flex flex-col gap-5">
        {/* Traversal Console */}
        <div className="surface-card flex flex-col p-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-indigo-600" />
              <h4 className="text-sm font-semibold text-slate-900">Search Traversal Telemetry</h4>
            </div>
            {isSimulating && (
              <Badge variant="indigo" size="xs" dot>Live Routing</Badge>
            )}
          </div>

          <div className="mt-3 flex-1 overflow-y-auto space-y-2 min-h-[160px] max-h-[220px]">
            {simulationLog.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
                <ArrowDownRight className="w-6 h-6 mb-2 text-slate-300" />
                <p className="text-xs">
                  Click &quot;Simulate Search Hop&quot; to inspect real-time greedy navigation through HNSW layers.
                </p>
              </div>
            ) : (
              simulationLog.map((log, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-2.5 text-xs font-mono text-indigo-900 leading-relaxed shadow-xs"
                >
                  <span className="text-indigo-400 font-bold mr-1.5">&gt;</span>
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* HNSW Skip-List Concept Card */}
        <div className="surface-card p-5 bg-gradient-to-br from-purple-50/40 via-white to-indigo-50/40 border-purple-100/70">
          <div className="flex items-center gap-2 text-purple-700 mb-2">
            <Info className="h-4 w-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">How HNSW Beats Brute Force</h4>
          </div>
          <p className="text-xs leading-relaxed text-slate-600">
            HNSW extends the 1D <strong className="text-slate-800">Skip-List</strong> data structure to multi-dimensional metric spaces.
            Upper layers contain exponentially fewer nodes, serving as long-range &quot;expressways&quot;. Search starts at the top entry point, navigates greedily to the local nearest neighbor, then descends to lower layers for precise convergence in <strong className="text-indigo-600 font-mono font-semibold">O(log N)</strong> time.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2.5 text-xs">
            <div className="rounded-xl bg-white border border-slate-200/80 p-2.5 shadow-xs">
              <span className="text-slate-400 text-[11px] font-medium">M Parameter</span>
              <p className="font-semibold text-slate-800 mt-0.5">16 neighbors</p>
            </div>
            <div className="rounded-lg bg-white border border-slate-200/80 p-2.5 shadow-xs">
              <span className="text-slate-400 text-[11px] font-medium">efConstruction</span>
              <p className="font-semibold text-slate-800 mt-0.5">64 candidates</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
