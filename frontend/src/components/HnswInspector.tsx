"use client";

import React, { useEffect, useState } from "react";
import { HnswGraphData, HnswNode, HnswEdge } from "../lib/types";
import { fetchHnswInfo } from "../lib/api";
import { Layers, Play, RefreshCw, Network, Zap, Info } from "lucide-react";

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
    return <div className="glass-panel p-8 text-center text-gray-400">Loading HNSW topology...</div>;
  }

  const layersCount = data.topLayer + 1;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Graph Visualizer Canvas */}
      <div className="glass-panel relative flex flex-col overflow-hidden rounded-2xl lg:col-span-2">
        {/* Header Controls */}
        <div className="flex flex-wrap items-center justify-between border-b border-white/10 px-5 py-3 bg-[#0d0f16]/60">
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Hierarchical Multilayer Graph</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={runSimulation}
              disabled={isSimulating}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition ${
                isSimulating
                  ? "bg-cyan-500/10 text-cyan-400 opacity-50 cursor-not-allowed"
                  : "bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40"
              }`}
            >
              <Play className="h-3.5 w-3.5" />
              <span>{isSimulating ? "Traversing..." : "Simulate Search Hop"}</span>
            </button>
          </div>
        </div>

        {/* Layer Selector Tabs */}
        <div className="flex items-center gap-2 border-b border-white/5 bg-[#090a0f] px-5 py-2.5">
          <span className="text-xs text-gray-400 mr-2">Layer Hierarchy:</span>
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
                className={`flex items-center gap-2 rounded-lg px-3 py-1 text-xs transition ${
                  isActive
                    ? "border border-cyan-500/40 bg-cyan-500/20 text-cyan-300 font-semibold shadow-sm"
                    : "border border-white/5 bg-white/5 text-gray-400 hover:text-white"
                }`}
              >
                <span>Layer {lyr}</span>
                <span className="rounded bg-black/40 px-1.5 py-0.2 text-[10px] text-gray-300">
                  {nodeCount} nodes • {edgeCount} edges
                </span>
              </button>
            );
          })}
        </div>

        {/* SVG Graph View */}
        <div className="relative h-[480px] w-full bg-cyber-grid bg-[#08090d]">
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
                  stroke={isEdgeHighlighted ? "#06b6d4" : "rgba(255, 255, 255, 0.12)"}
                  strokeWidth={isEdgeHighlighted ? 3 : 1.2}
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
                      r={20}
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      className="animate-ping opacity-75"
                    />
                  )}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={isNodeHighlighted ? 12 : 9}
                    fill={isNodeHighlighted ? "#06b6d4" : isTopLayerNode ? "#8b5cf6" : "#1e293b"}
                    stroke={isNodeHighlighted ? "#ffffff" : isTopLayerNode ? "#a855f7" : "#475569"}
                    strokeWidth={2}
                  />
                  <text
                    x={pos.x}
                    y={pos.y - 14}
                    fill={isNodeHighlighted ? "#67e8f9" : "#94a3b8"}
                    fontSize="11"
                    fontFamily="sans-serif"
                    textAnchor="middle"
                  >
                    {n.metadata.length > 20 ? `${n.metadata.slice(0, 18)}…` : n.metadata}
                  </text>
                  <text
                    x={pos.x}
                    y={pos.y + 3}
                    fill="#ffffff"
                    fontSize="8"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    #{n.id}
                  </text>
                </g>
              );
            })}
          </svg>
          <div className="pointer-events-none absolute bottom-3 left-4 text-[11px] text-gray-500">
            {activeLayer === 0
              ? "Layer 0: Dense local neighborhood network with highest recall."
              : `Layer ${activeLayer}: Sparse expressway network with long-distance skip connections.`}
          </div>
        </div>
      </div>

      {/* Traversal Log & HNSW Theory */}
      <div className="flex flex-col gap-6">
        {/* Traversal Console */}
        <div className="glass-panel flex flex-col rounded-2xl p-5">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Zap className="h-4 w-4 text-cyan-400" />
            <h4 className="text-sm font-semibold text-white">Search Traversal Telemetry</h4>
          </div>

          <div className="mt-3 flex-1 overflow-y-auto space-y-2 min-h-[160px] max-h-[220px]">
            {simulationLog.length === 0 ? (
              <p className="text-xs text-gray-500 italic">
                Click &quot;Simulate Search Hop&quot; to inspect real-time greedy navigation through HNSW layers.
              </p>
            ) : (
              simulationLog.map((log, i) => (
                <div key={i} className="rounded-lg border border-white/5 bg-[#12141c] p-2 text-xs font-mono text-cyan-300">
                  <span className="text-gray-500 mr-1.5">&gt;</span>
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* HNSW Skip-List Concept Card */}
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center gap-2 text-purple-400 mb-2">
            <Info className="h-4 w-4" />
            <h4 className="text-xs font-semibold uppercase tracking-wider">How HNSW Beats Brute Force</h4>
          </div>
          <p className="text-xs leading-relaxed text-gray-400">
            HNSW extends the 1D <em>Skip-List</em> data structure to multi-dimensional metric spaces.
            Upper layers contain exponentially fewer nodes, serving as long-range &quot;expressways&quot;. Search starts at the top entry point, navigates greedily to the local nearest neighbor, then descends to lower layers for precise convergence in <strong className="text-cyan-300 font-mono">O(log N)</strong> time.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-white/5 p-2">
              <span className="text-gray-500">M Parameter</span>
              <p className="font-semibold text-white">16 neighbors</p>
            </div>
            <div className="rounded-lg bg-white/5 p-2">
              <span className="text-gray-500">efConstruction</span>
              <p className="font-semibold text-white">64 candidates</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
