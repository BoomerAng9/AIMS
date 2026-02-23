// frontend/components/mind-map/PlatformMindMap.tsx
"use client";

/**
 * PlatformMindMap — Interactive node-graph visualization of the AIMS platform.
 *
 * Renders a draggable, zoomable mind map where each node represents a
 * real, deployed/testable surface in the app. Connections (edges) show
 * relationships and data flow between surfaces.
 *
 * Only nodes that are READY TO TEST link anywhere — everything else
 * is dimmed with a "coming soon" state.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  MessageSquare, Zap, Layers, Shield, Rocket, Bot, CreditCard,
  Settings, Cpu, Terminal, Monitor, Trophy, Mic, FlaskConical,
  Globe, PenTool, Users, Store, ShoppingCart, Calculator,
  Activity, BookOpen, FolderKanban, Search, BarChart3, Wrench,
  Box, Network, ArrowRight, ZoomIn, ZoomOut, Maximize2, Home,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────

export interface MapNode {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  href: string | null;               // null = not yet wired
  status: "live" | "partial" | "planned";
  category: "core" | "tool" | "agent" | "vertical" | "infra";
  x: number;                         // initial position (percentage of canvas)
  y: number;
  accentColor: string;
  description: string;
}

export interface MapEdge {
  from: string;
  to: string;
  label?: string;
}

// ── Icon helper ────────────────────────────────────────────

const STATUS_STYLES = {
  live: {
    ring: "ring-emerald-400/40",
    bg: "bg-emerald-400/10",
    dot: "bg-emerald-400",
    label: "Live",
    labelColor: "text-emerald-400",
  },
  partial: {
    ring: "ring-gold/40",
    bg: "bg-gold/10",
    dot: "bg-gold",
    label: "Partial",
    labelColor: "text-gold",
  },
  planned: {
    ring: "ring-slate-200",
    bg: "bg-slate-50",
    dot: "bg-white/30",
    label: "Planned",
    labelColor: "text-slate-400",
  },
};

const CATEGORY_COLORS: Record<string, string> = {
  core: "border-gold/30",
  tool: "border-blue-400/30",
  agent: "border-violet-400/30",
  vertical: "border-emerald-400/30",
  infra: "border-cyan-400/30",
};

// ── Nodes — ONLY wire href for products that are ready to test ──

const NODES: MapNode[] = [
  // ── Core (center cluster) ──
  {
    id: "acheevy",
    label: "ACHEEVY",
    icon: Zap,
    href: "/dashboard/acheevy",
    status: "live",
    category: "core",
    x: 50, y: 38,
    accentColor: "#D4AF37",
    description: "Executive AI Orchestrator — chat, command, deploy",
  },
  {
    id: "chat",
    label: "Chat",
    icon: MessageSquare,
    href: "/dashboard/chat",
    status: "live",
    category: "core",
    x: 38, y: 28,
    accentColor: "#D4AF37",
    description: "Streaming chat with ACHEEVY via OpenRouter",
  },
  {
    id: "dashboard",
    label: "Overview",
    icon: BarChart3,
    href: "/dashboard",
    status: "live",
    category: "core",
    x: 62, y: 28,
    accentColor: "#D4AF37",
    description: "Platform overview with health status and tool grid",
  },

  // ── Infrastructure (top) ──
  {
    id: "circuit-box",
    label: "Circuit Box",
    icon: Shield,
    href: "/dashboard/circuit-box",
    status: "live",
    category: "infra",
    x: 50, y: 12,
    accentColor: "#22D3EE",
    description: "System panel — services, integrations, settings",
  },
  {
    id: "deploy-dock",
    label: "Deploy Dock",
    icon: Rocket,
    href: "/dashboard/deploy-dock",
    status: "live",
    category: "infra",
    x: 35, y: 14,
    accentColor: "#22D3EE",
    description: "Build → Assign → Launch deployment center",
  },
  {
    id: "operations",
    label: "Operations",
    icon: Network,
    href: "/dashboard/operations",
    status: "live",
    category: "infra",
    x: 65, y: 14,
    accentColor: "#22D3EE",
    description: "Service health, container status, logs",
  },

  // ── Tools (left cluster) ──
  {
    id: "plug-catalog",
    label: "Plug Catalog",
    icon: Layers,
    href: "/dashboard/plug-catalog",
    status: "live",
    category: "tool",
    x: 18, y: 35,
    accentColor: "#3B82F6",
    description: "Browse and deploy AI tools, agents, platforms",
  },
  {
    id: "playground",
    label: "Playground",
    icon: FlaskConical,
    href: "/dashboard/playground",
    status: "live",
    category: "tool",
    x: 12, y: 50,
    accentColor: "#3B82F6",
    description: "Code, prompt, and agent sandboxes",
  },
  {
    id: "custom-hawks",
    label: "Custom Hawks",
    icon: Bot,
    href: "/dashboard/custom-hawks",
    status: "live",
    category: "tool",
    x: 18, y: 65,
    accentColor: "#3B82F6",
    description: "Create your own Lil_Hawks — custom AI bots",
  },
  {
    id: "model-garden",
    label: "Model Garden",
    icon: Cpu,
    href: "/dashboard/model-garden",
    status: "live",
    category: "tool",
    x: 8, y: 42,
    accentColor: "#3B82F6",
    description: "Browse and compare AI models",
  },
  {
    id: "build",
    label: "Chicken Hawk",
    icon: Terminal,
    href: "/dashboard/build",
    status: "live",
    category: "tool",
    x: 24, y: 22,
    accentColor: "#3B82F6",
    description: "Autonomous code build & execution engine",
  },

  // ── Verticals (right cluster) ──
  {
    id: "luc",
    label: "LUC Calculator",
    icon: Calculator,
    href: "/dashboard/luc",
    status: "live",
    category: "vertical",
    x: 82, y: 35,
    accentColor: "#22C55E",
    description: "Usage credits calculator & billing dashboard",
  },
  {
    id: "garage",
    label: "Garage to Global",
    icon: Store,
    href: "/dashboard/garage-to-global",
    status: "live",
    category: "vertical",
    x: 88, y: 50,
    accentColor: "#22C55E",
    description: "5-stage business scaling journey",
  },
  {
    id: "buy-in-bulk",
    label: "Buy in Bulk",
    icon: ShoppingCart,
    href: "/dashboard/buy-in-bulk",
    status: "live",
    category: "vertical",
    x: 82, y: 65,
    accentColor: "#22C55E",
    description: "AI-powered wholesale shopping assistant",
  },
  {
    id: "needs-analysis",
    label: "Needs Analysis",
    icon: Search,
    href: "/dashboard/needs-analysis",
    status: "live",
    category: "vertical",
    x: 88, y: 42,
    accentColor: "#22C55E",
    description: "Business requirements assessment",
  },

  // ── Sports / Per|Form (bottom cluster) ──
  {
    id: "perform",
    label: "Per|Form",
    icon: Trophy,
    href: "/sandbox/perform",
    status: "live",
    category: "vertical",
    x: 40, y: 72,
    accentColor: "#F59E0B",
    description: "Sports analytics — Big Board, Mock Draft, Directory",
  },
  {
    id: "film-room",
    label: "Film Room",
    icon: Monitor,
    href: "/dashboard/film-room",
    status: "live",
    category: "vertical",
    x: 30, y: 82,
    accentColor: "#F59E0B",
    description: "Video intelligence via Twelve Labs",
  },
  {
    id: "sports-tracker",
    label: "Sports Tracker",
    icon: Activity,
    href: "/dashboard/sports-tracker",
    status: "live",
    category: "vertical",
    x: 50, y: 85,
    accentColor: "#F59E0B",
    description: "Live scores and nixie tube displays",
  },
  {
    id: "nil",
    label: "N.I.L.",
    icon: Trophy,
    href: "/dashboard/nil",
    status: "live",
    category: "vertical",
    x: 60, y: 78,
    accentColor: "#F59E0B",
    description: "Name-Image-Likeness tracking",
  },

  // ── Agent / Simulation (bottom-left) ──
  {
    id: "livesim",
    label: "LiveSim",
    icon: Globe,
    href: "/dashboard/livesim",
    status: "live",
    category: "agent",
    x: 22, y: 78,
    accentColor: "#A78BFA",
    description: "Real-time autonomous agent observation feed",
  },
  {
    id: "boomerangs",
    label: "Boomer_Angs",
    icon: Bot,
    href: "/dashboard/boomerangs",
    status: "live",
    category: "agent",
    x: 72, y: 72,
    accentColor: "#A78BFA",
    description: "Specialist agent team registry",
  },

  // ── Planned (dimmed, no href) ──
  {
    id: "computer-control",
    label: "Computer Control",
    icon: Monitor,
    href: null,
    status: "planned",
    category: "tool",
    x: 10, y: 22,
    accentColor: "#6B7280",
    description: "Sandboxed desktop control via Claude/Gemini",
  },
  {
    id: "playbook-engine",
    label: "Playbook Engine",
    icon: PenTool,
    href: null,
    status: "planned",
    category: "vertical",
    x: 42, y: 95,
    accentColor: "#6B7280",
    description: "Voice-to-play-diagram with SVG animation",
  },
  {
    id: "prompt-agent",
    label: "Prompt Agent",
    icon: Wrench,
    href: null,
    status: "planned",
    category: "agent",
    x: 78, y: 82,
    accentColor: "#6B7280",
    description: "Cross-platform prompt engineering agent",
  },
];

// ── Edges — connections between nodes ──

const EDGES: MapEdge[] = [
  // Core hub
  { from: "acheevy", to: "chat", label: "streams" },
  { from: "acheevy", to: "dashboard" },
  { from: "acheevy", to: "circuit-box", label: "manages" },
  { from: "acheevy", to: "deploy-dock", label: "deploys" },
  { from: "acheevy", to: "operations", label: "monitors" },

  // Tools branch
  { from: "acheevy", to: "plug-catalog", label: "catalog" },
  { from: "plug-catalog", to: "playground" },
  { from: "plug-catalog", to: "custom-hawks" },
  { from: "plug-catalog", to: "model-garden" },
  { from: "deploy-dock", to: "build" },

  // Verticals branch
  { from: "acheevy", to: "luc" },
  { from: "acheevy", to: "needs-analysis" },
  { from: "luc", to: "garage" },
  { from: "needs-analysis", to: "buy-in-bulk" },

  // Sports branch
  { from: "acheevy", to: "perform" },
  { from: "perform", to: "film-room" },
  { from: "perform", to: "sports-tracker" },
  { from: "perform", to: "nil" },

  // Agents branch
  { from: "acheevy", to: "livesim" },
  { from: "acheevy", to: "boomerangs" },

  // Planned connections
  { from: "plug-catalog", to: "computer-control" },
  { from: "perform", to: "playbook-engine" },
  { from: "boomerangs", to: "prompt-agent" },
];

// ── Canvas dimensions ──

const CANVAS_W = 1200;
const CANVAS_H = 900;

// ── Helpers ──

function nodePos(node: MapNode) {
  return {
    cx: (node.x / 100) * CANVAS_W,
    cy: (node.y / 100) * CANVAS_H,
  };
}

function getEdgePath(from: MapNode, to: MapNode): string {
  const a = nodePos(from);
  const b = nodePos(to);
  // Curved path
  const mx = (a.cx + b.cx) / 2;
  const my = (a.cy + b.cy) / 2;
  const dx = b.cx - a.cx;
  const dy = b.cy - a.cy;
  // Perpendicular offset for curve
  const offset = Math.min(Math.abs(dx) * 0.15, 30);
  const cpx = mx + (dy > 0 ? offset : -offset) * 0.3;
  const cpy = my + (dx > 0 ? -offset : offset) * 0.3;
  return `M ${a.cx} ${a.cy} Q ${cpx} ${cpy} ${b.cx} ${b.cy}`;
}

// ── Main Component ──

export function PlatformMindMap() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Fit to container on mount
  useEffect(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = rect.width / CANVAS_W;
    const scaleY = rect.height / CANVAS_H;
    const fitScale = Math.min(scaleX, scaleY) * 0.9;
    setScale(fitScale);
    setOffset({
      x: (rect.width - CANVAS_W * fitScale) / 2,
      y: (rect.height - CANVAS_H * fitScale) / 2,
    });
  }, []);

  // Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-node]")) return;
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  }, [offset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }, [dragging, dragStart]);

  const handleMouseUp = useCallback(() => setDragging(false), []);

  // Zoom handlers
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((s) => Math.max(0.3, Math.min(3, s * delta)));
  }, []);

  const zoomIn = () => setScale((s) => Math.min(3, s * 1.2));
  const zoomOut = () => setScale((s) => Math.max(0.3, s / 1.2));
  const resetView = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = rect.width / CANVAS_W;
    const scaleY = rect.height / CANVAS_H;
    const fitScale = Math.min(scaleX, scaleY) * 0.9;
    setScale(fitScale);
    setOffset({
      x: (rect.width - CANVAS_W * fitScale) / 2,
      y: (rect.height - CANVAS_H * fitScale) / 2,
    });
  };

  const handleNodeClick = (node: MapNode) => {
    if (node.href) {
      router.push(node.href);
    } else {
      setSelectedNode(node.id === selectedNode ? null : node.id);
    }
  };

  const selectedNodeData = NODES.find((n) => n.id === selectedNode);

  // Build lookup
  const nodeMap = new Map(NODES.map((n) => [n.id, n]));

  return (
    <div className="relative w-full h-full min-h-[500px] flex flex-col">
      {/* ── Controls ── */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5">
        <button
          onClick={zoomIn}
          className="p-2 rounded-lg border border-wireframe-stroke bg-slate-50/70 text-slate-500 hover:text-gold hover:border-gold/30 transition-all backdrop-blur-md"
          title="Zoom In"
        >
          <ZoomIn size={16} />
        </button>
        <button
          onClick={zoomOut}
          className="p-2 rounded-lg border border-wireframe-stroke bg-slate-50/70 text-slate-500 hover:text-gold hover:border-gold/30 transition-all backdrop-blur-md"
          title="Zoom Out"
        >
          <ZoomOut size={16} />
        </button>
        <button
          onClick={resetView}
          className="p-2 rounded-lg border border-wireframe-stroke bg-slate-50/70 text-slate-500 hover:text-gold hover:border-gold/30 transition-all backdrop-blur-md"
          title="Fit to View"
        >
          <Maximize2 size={16} />
        </button>
      </div>

      {/* ── Legend ── */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-3 text-xs">
        {(["live", "partial", "planned"] as const).map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${STATUS_STYLES[s].dot}`} />
            <span className={STATUS_STYLES[s].labelColor}>{STATUS_STYLES[s].label}</span>
          </div>
        ))}
        <div className="w-px h-4 bg-wireframe-stroke" />
        {([
          ["core", "Core", "border-gold/30"],
          ["tool", "Tools", "border-blue-400/30"],
          ["vertical", "Verticals", "border-emerald-400/30"],
          ["agent", "Agents", "border-violet-400/30"],
          ["infra", "Infra", "border-cyan-400/30"],
        ] as const).map(([key, label, border]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded border-2 ${border} bg-transparent`} />
            <span className="text-slate-400">{label}</span>
          </div>
        ))}
      </div>

      {/* ── SVG Canvas ── */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: "0 0",
          }}
        >
          {/* Background grid */}
          <defs>
            <pattern id="mindmap-grid" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
              <circle cx="24" cy="24" r="0.8" fill="rgba(255,255,255,0.04)" />
            </pattern>
            {/* Glow filter for active nodes */}
            <filter id="glow-gold" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feFlood floodColor="#D4AF37" floodOpacity="0.3" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-blue" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feFlood floodColor="#3B82F6" floodOpacity="0.25" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <rect width={CANVAS_W} height={CANVAS_H} fill="url(#mindmap-grid)" />

          {/* ── Edges ── */}
          <g>
            {EDGES.map((edge) => {
              const fromNode = nodeMap.get(edge.from);
              const toNode = nodeMap.get(edge.to);
              if (!fromNode || !toNode) return null;

              const isHighlighted =
                hoveredNode === edge.from || hoveredNode === edge.to;
              const isPlanned =
                fromNode.status === "planned" || toNode.status === "planned";

              return (
                <g key={`${edge.from}-${edge.to}`}>
                  <path
                    d={getEdgePath(fromNode, toNode)}
                    fill="none"
                    stroke={isHighlighted ? "rgba(212,175,55,0.5)" : isPlanned ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.08)"}
                    strokeWidth={isHighlighted ? 2 : 1}
                    strokeDasharray={isPlanned ? "4 4" : undefined}
                    className="transition-all duration-300"
                  />
                  {/* Animated particle along edge when highlighted */}
                  {isHighlighted && (
                    <circle r="3" fill="#D4AF37" opacity="0.8">
                      <animateMotion
                        dur="2s"
                        repeatCount="indefinite"
                        path={getEdgePath(fromNode, toNode)}
                      />
                    </circle>
                  )}
                </g>
              );
            })}
          </g>

          {/* ── Nodes ── */}
          <g>
            {NODES.map((node) => {
              const pos = nodePos(node);
              const style = STATUS_STYLES[node.status];
              const isHovered = hoveredNode === node.id;
              const isSelected = selectedNode === node.id;
              const isClickable = node.href !== null;
              const Icon = node.icon;

              const nodeRadius = 28;
              const labelY = pos.cy + nodeRadius + 16;

              return (
                <g
                  key={node.id}
                  data-node
                  className={`${isClickable ? "cursor-pointer" : "cursor-default"} transition-transform`}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => handleNodeClick(node)}
                >
                  {/* Outer glow ring */}
                  {(isHovered || isSelected) && node.status !== "planned" && (
                    <circle
                      cx={pos.cx}
                      cy={pos.cy}
                      r={nodeRadius + 8}
                      fill="none"
                      stroke={node.accentColor}
                      strokeWidth="1"
                      opacity="0.3"
                      className="animate-pulse"
                    />
                  )}

                  {/* Node background */}
                  <circle
                    cx={pos.cx}
                    cy={pos.cy}
                    r={nodeRadius}
                    fill={node.status === "planned" ? "rgba(255,255,255,0.02)" : `${node.accentColor}15`}
                    stroke={node.status === "planned" ? "rgba(255,255,255,0.08)" : `${node.accentColor}40`}
                    strokeWidth={isHovered ? 2 : 1}
                    filter={isHovered && node.status !== "planned" ? "url(#glow-gold)" : undefined}
                    className="transition-all duration-200"
                  />

                  {/* Status dot */}
                  <circle
                    cx={pos.cx + nodeRadius * 0.6}
                    cy={pos.cy - nodeRadius * 0.6}
                    r={4}
                    fill={node.status === "live" ? "#22C55E" : node.status === "partial" ? "#D4AF37" : "rgba(255,255,255,0.2)"}
                    stroke="#0A0A0A"
                    strokeWidth="2"
                  />

                  {/* Icon — foreignObject for React icon */}
                  <foreignObject
                    x={pos.cx - 12}
                    y={pos.cy - 12}
                    width={24}
                    height={24}
                    className="pointer-events-none"
                  >
                    <div className="flex items-center justify-center w-full h-full">
                      <Icon
                        size={18}
                        className={node.status === "planned" ? "text-slate-300" : ""}
                        style={node.status !== "planned" ? { color: node.accentColor } : undefined}
                      />
                    </div>
                  </foreignObject>

                  {/* Label */}
                  <text
                    x={pos.cx}
                    y={labelY}
                    textAnchor="middle"
                    fill={node.status === "planned" ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.8)"}
                    fontSize="11"
                    fontFamily="Inter, system-ui, sans-serif"
                    fontWeight="500"
                  >
                    {node.label}
                  </text>

                  {/* Navigate hint on hover */}
                  {isHovered && isClickable && (
                    <text
                      x={pos.cx}
                      y={labelY + 14}
                      textAnchor="middle"
                      fill={node.accentColor}
                      fontSize="9"
                      fontFamily="Inter, system-ui, sans-serif"
                      opacity="0.7"
                    >
                      Click to open
                    </text>
                  )}
                  {isHovered && !isClickable && (
                    <text
                      x={pos.cx}
                      y={labelY + 14}
                      textAnchor="middle"
                      fill="rgba(255,255,255,0.2)"
                      fontSize="9"
                      fontFamily="Inter, system-ui, sans-serif"
                    >
                      Coming Soon
                    </text>
                  )}
                </g>
              );
            })}
          </g>

          {/* ── Central label ── */}
          <text
            x={CANVAS_W / 2}
            y={CANVAS_H / 2 + 5}
            textAnchor="middle"
            fill="rgba(212,175,55,0.08)"
            fontSize="80"
            fontFamily="Doto, monospace"
            fontWeight="900"
          >
            A.I.M.S.
          </text>
        </svg>
      </div>

      {/* ── Info Panel (shows on hover/select) ── */}
      <AnimatePresence>
        {hoveredNode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 max-w-md w-full px-4"
          >
            {(() => {
              const node = nodeMap.get(hoveredNode);
              if (!node) return null;
              const style = STATUS_STYLES[node.status];
              return (
                <div className="rounded-xl border border-wireframe-stroke bg-white/80 backdrop-blur-md px-5 py-3 flex items-center gap-4 shadow-2xl">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
                    style={{
                      borderColor: `${node.accentColor}40`,
                      backgroundColor: `${node.accentColor}10`,
                    }}
                  >
                    <node.icon size={18} style={{ color: node.accentColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-800">{node.label}</span>
                      <span className={`flex items-center gap-1 text-[10px] font-mono uppercase ${style.labelColor}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                        {style.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{node.description}</p>
                  </div>
                  {node.href && (
                    <ArrowRight size={14} className="text-gold/60 shrink-0" />
                  )}
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
