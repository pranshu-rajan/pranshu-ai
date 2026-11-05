"use client";

import React, { useEffect, useState } from "react";
import { HnswGraphData } from "../lib/types";
import { fetchHnswInfo } from "../lib/api";
import { Network, Play, Zap, Info, ArrowDownRight, Activity } from "lucide-react";
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
        msg: `Greedy Hop: Traversed edge to Node #${nextId} ("${nextNode?.metadata || ""}") via minimum Cosine Distance`,
      });
    }

    steps.push({
      node: targetNode.id,
      edge: null,
      msg: `Local Minima Reached at Layer ${activeLayer}. Dropping down to Layer ${Math.max(0, activeLayer - 1)}...`,
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
    }, 700);
  };

  if (!data) {
    return (
      <div className="surface-card p-12 text-center text-[#7E8794]">
        <div className="w-7 h-7 mx-auto mb-3 rounded-full border-2 border-[#0935B8] border-t-transparent animate-spin" />
        <p className="text-xs font-mono">LOADING HNSW TOPOLOGY...</p>
      </div>
    );
  }

  const layersCount = data.topLayer + 1;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      {/* Graph Visualizer Canvas */}
      <div className="surface-card relative flex flex-col overflow-hidden lg:col-span-2">
        {/* Header Controls */}
        <div className="flex flex-wrap items-center justify-between border-b border-[#E3DED6] px-4 py-3 bg-[#FAF9F7]">
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-[#0935B8]" />
            <h3 className="text-xs font-bold text-[#111315] uppercase tracking-wider font-mono">
              Proximity Topology Graph
            </h3>
            <span className="text-[10px] text-[#7E8794] font-mono tabular-nums">
              [{layerNodes.length} NODES ACTIVE]
            </span>
          </div>

          <Button
            size="sm"
            variant="subtle"
            onClick={runSimulation}
            disabled={isSimulating}
            icon={<Play className="h-3 w-3" />}
          >
            {isSimulating ? "SIMULATING..." : "SIMULATE SEARCH HOP"}
          </Button>
        </div>

        {/* Layer Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-[#E3DED6] bg-[#EDEAE3]/50 px-4 py-2">
          <span className="text-[10px] font-mono uppercase text-[#7E8794] mr-1">Layer:</span>
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
                className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs transition font-mono ${
                  isActive
                    ? "bg-white text-[#111315] shadow-xs border border-[#DCD5C9] font-bold"
                    : "bg-transparent text-[#555C68] hover:bg-[#F3F1EC] border border-transparent"
                }`}
              >
                <span>L{lyr}</span>
                <span
                  className={`rounded px-1 py-0.2 text-[9px] font-mono ${
                    isActive ? "bg-[#EEF3FF] text-[#0935B8]" : "bg-[#EDEAE3] text-[#7E8794]"
                  }`}
                >
                  {nodeCount}n · {edgeCount}e
                </span>
              </button>
            );
          })}
        </div>

        {/* SVG Graph View */}
        <div className="relative h-[480px] w-full bg-[#F7F6F3]">
          <svg className="h-full w-full" viewBox="0 0 700 460">
            {/* Background decorative concentric guides */}
            <circle cx="350" cy="230" r="160" fill="none" stroke="rgba(227, 222, 214, 0.45)" strokeDasharray="3,3" />
            <circle cx="350" cy="230" r="260" fill="none" stroke="rgba(227, 222, 214, 0.35)" />
            <line x1="350" y1="20" x2="350" y2="440" stroke="rgba(227, 222, 214, 0.4)" strokeDasharray="2,2" />
            <line x1="50" y1="230" x2="650" y2="230" stroke="rgba(227, 222, 214, 0.4)" strokeDasharray="2,2" />

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
                  stroke={isEdgeHighlighted ? "#0935B8" : "#DCD5C9"}
                  strokeWidth={isEdgeHighlighted ? 2.5 : 1}
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
                      stroke="#0935B8"
                      strokeWidth={1.5}
                      className="animate-ping opacity-60"
                    />
                  )}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={isNodeHighlighted ? 11 : 8.5}
                    fill={isNodeHighlighted ? "#0935B8" : isTopLayerNode ? "#111315" : "#555C68"}
                    stroke="#FFFFFF"
                    strokeWidth={2}
                    className="shadow-sm"
                  />
                  <text
                    x={pos.x}
                    y={pos.y - 13}
                    fill={isNodeHighlighted ? "#0935B8" : "#111315"}
                    fontSize="10"
                    fontWeight={isNodeHighlighted ? "bold" : "500"}
                    fontFamily="monospace"
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
          <div className="pointer-events-none absolute bottom-3 left-4 text-[10px] font-mono text-[#7E8794] bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded border border-[#E3DED6]">
            {activeLayer === 0
              ? "Layer 0: Dense local neighborhood network with maximal spatial recall."
              : `Layer ${activeLayer}: Sparse expressway network with long-distance skip links.`}
          </div>
        </div>
      </div>

      {/* Traversal Telemetry & HNSW Architecture */}
      <div className="flex flex-col gap-4">
        {/* Traversal Console */}
        <div className="surface-card flex flex-col p-4 sm:p-5">
          <div className="flex items-center justify-between border-b border-[#EBE7DF] pb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#0935B8]" />
              <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-[#111315]">
                Routing Oscilloscope
              </h4>
            </div>
            {isSimulating && (
              <Badge variant="indigo" size="xs" dot>LIVE HOP</Badge>
            )}
          </div>

          <div className="mt-3 flex-1 overflow-y-auto space-y-1.5 min-h-[160px] max-h-[220px]">
            {simulationLog.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-7 text-center text-[#7E8794]">
                <ArrowDownRight className="w-5 h-5 mb-2 text-[#A8A090]" />
                <p className="text-[11px] font-mono max-w-xs">
                  Click &quot;Simulate Search Hop&quot; to inspect real-time greedy navigation through the HNSW hierarchy.
                </p>
              </div>
            ) : (
              simulationLog.map((log, i) => (
                <div
                  key={i}
                  className="rounded border border-[#CFDEFE] bg-[#EEF3FF] p-2 text-[11px] font-mono text-[#0935B8] leading-relaxed shadow-xs"
                >
                  <span className="text-[#5D94FA] font-bold mr-1">&gt;</span>
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* HNSW Skip-List Concept Card */}
        <div className="surface-card p-4 sm:p-5 border-l-2 border-l-[#111315]">
          <div className="flex items-center gap-1.5 text-[#111315] mb-2">
            <Info className="h-3.5 w-3.5 text-[#0935B8]" />
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider">
              HNSW Skip-Graph Complexity
            </h4>
          </div>
          <p className="text-xs leading-relaxed text-[#555C68]">
            HNSW generalizes the 1D <strong className="text-[#111315]">Skip-List</strong> data structure to metric vector spaces.
            Upper layers contain exponentially fewer nodes, serving as long-range expressways. Greedy navigation converges to the local nearest neighbor in logarithmic <strong className="text-[#0935B8] font-mono font-semibold">O(log N)</strong> time.
          </p>

          <div className="mt-3.5 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded border border-[#E3DED6] bg-[#FAF9F7] p-2">
              <span className="text-[#7E8794] text-[10px] font-mono uppercase">M Parameter</span>
              <p className="font-semibold text-[#111315] mt-0.5 font-mono text-xs">16 neighbors</p>
            </div>
            <div className="rounded border border-[#E3DED6] bg-[#FAF9F7] p-2">
              <span className="text-[#7E8794] text-[10px] font-mono uppercase">efConstruction</span>
              <p className="font-semibold text-[#111315] mt-0.5 font-mono text-xs">64 candidates</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
