// frontend/app/dashboard/deploy-dock/page.tsx
"use client";

/**
 * Deploy Dock — Build → Assign → Launch
 *
 * The deployment center where ACHEEVY turns plans into running outcomes.
 * Users interact ONLY with ACHEEVY; downstream agents (Boomer_Angs, Chicken Hawk, Lil_Hawks)
 * are invoked via deterministic job packets and emit proof-linked events only.
 *
 * tool_id: deploy_dock
 * service_key: DEPLOYMENT
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Anchor,
  ArrowRight,
  Box,
  CheckCircle2,
  ChevronRight,
  Clock,
  Container,
  ExternalLink,
  FileCheck,
  FileText,
  Layers,
  Link2,
  Loader2,
  Lock,
  MessageSquare,
  Network,
  Package,
  Play,
  Plus,
  RefreshCw,
  Rocket,
  Send,
  Settings,
  Shield,
  Ship,
  Sparkles,
  Terminal,
  Users,
  Workflow,
  Zap,
} from "lucide-react";
import { ParticleLazer } from "@/components/deploy-dock/ParticleLazer";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type DeployTab = "hatch" | "assign" | "launch" | "logs";
type AcheevyMode = "recommend" | "explain" | "execute" | "prove";

interface DeploymentEvent {
  id: string;
  timestamp: Date;
  stage: "ingest" | "plan" | "quote" | "approved" | "hatch" | "assign" | "launch" | "verify" | "done";
  title: string;
  description: string;
  proof?: {
    type: "manifest" | "hash" | "scan" | "attestation" | "artifact";
    label: string;
    value: string;
  };
  agent?: "ACHEEVY" | "Boomer_Ang" | "Chicken Hawk" | "Lil_Hawk";
}

interface AgentRoster {
  id: string;
  name: string;
  role: string;
  type: "boomer_ang" | "chicken_hawk" | "lil_hawk";
  status: "idle" | "active" | "complete";
  capabilities: string[];
  image?: string;
}

interface JobPacket {
  id: string;
  name: string;
  assignedTo: string;
  scope: string[];
  gates: string[];
  lucBudget: number;
  status: "pending" | "approved" | "running" | "complete";
}

// ─────────────────────────────────────────────────────────────
// Motion Variants
// ─────────────────────────────────────────────────────────────

const materialize = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
  exit: { opacity: 0, y: -10, filter: "blur(4px)", transition: { duration: 0.3 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

const pulseGlow = {
  animate: {
    boxShadow: [
      "0 0 0 0 rgba(212, 168, 67, 0)",
      "0 0 20px 4px rgba(212, 168, 67, 0.3)",
      "0 0 0 0 rgba(212, 168, 67, 0)",
    ],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
  },
};

// ─────────────────────────────────────────────────────────────
// API Helpers
// ─────────────────────────────────────────────────────────────

async function fetchJSON<T = any>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, init);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

interface PlugInstance {
  instanceId: string;
  plugId: string;
  name: string;
  status: string;
  assignedPort: number;
  healthStatus: string;
  deliveryMode?: string;
  uptimeSeconds?: number;
  lastHealthCheck?: string;
  createdAt?: string;
}

interface ServiceHealth {
  name: string;
  status: "up" | "down" | "degraded";
  responseTime: number;
  lastCheck: string;
}

interface CircuitDashboard {
  overall: string;
  uptimePercent: number;
  services: ServiceHealth[];
  plugInstances: { totalInstances: number; runningInstances: number; stoppedInstances: number; portCapacity: { used: number; total: number; percentage: number }; healthStats: { healthy: number; unhealthy: number; unknown: number } } | null;
  historyPoints: number;
}

interface CatalogPlug {
  id: string;
  name: string;
  tagline: string;
  category: string;
  tier: string;
  tags: string[];
  delivery: string[];
  resources: { cpu: string; memory: string; gpu: boolean };
}

// ─────────────────────────────────────────────────────────────
// Sub-Components
// ─────────────────────────────────────────────────────────────

function TabButton({
  tab,
  activeTab,
  icon: Icon,
  label,
  onClick,
}: {
  tab: DeployTab;
  activeTab: DeployTab;
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) {
  const active = tab === activeTab;
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium uppercase tracking-wider transition-all ${
        active
          ? "bg-gold/10 text-gold border border-gold/30 shadow-[0_0_15px_rgba(212,168,67,0.15)]"
          : "text-zinc-500 border border-transparent hover:text-zinc-400 hover:bg-white/5"
      }`}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}

function GlassBoxEvent({ event }: { event: DeploymentEvent }) {
  const stageColors: Record<string, string> = {
    ingest: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    plan: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    quote: "bg-gold/20 text-gold border-gold/30",
    approved: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    hatch: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    assign: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    launch: "bg-pink-500/20 text-pink-400 border-pink-500/30",
    verify: "bg-lime-500/20 text-lime-400 border-lime-500/30",
    done: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  };

  return (
    <motion.div
      variants={staggerItem}
      className="relative pl-6 pb-6 border-l border-wireframe-stroke last:pb-0"
    >
      {/* Timeline dot */}
      <div className={`absolute -left-[5px] top-0 h-2.5 w-2.5 rounded-full border-2 ${stageColors[event.stage] || "bg-[#1F1F23] border-white/10"}`} />

      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${stageColors[event.stage]}`}>
            {event.stage}
          </span>
          <span className="text-xs text-zinc-500 font-mono">
            {event.timestamp.toLocaleTimeString()}
          </span>
          {event.agent && (
            <span className="text-xs text-gold/50 font-mono">
              via {event.agent}
            </span>
          )}
        </div>

        <p className="text-sm font-medium text-zinc-100">{event.title}</p>
        <p className="text-xs text-zinc-500">{event.description}</p>

        {event.proof && (
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#18181B] border border-wireframe-stroke text-xs">
              <FileCheck size={10} className="text-emerald-400" />
              <span className="text-zinc-400">{event.proof.label}:</span>
              <code className="text-gold font-mono">{event.proof.value}</code>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function AgentCard({ agent, onActivate }: { agent: AgentRoster; onActivate?: () => void }) {
  const typeColors = {
    boomer_ang: "border-gold/30 bg-gold/5",
    chicken_hawk: "border-cyan-500/30 bg-cyan-500/5",
    lil_hawk: "border-amber-500/30 bg-amber-500/5",
  };

  const statusColors = {
    idle: "bg-[#1F1F23]",
    active: "bg-emerald-400 animate-pulse",
    complete: "bg-emerald-400",
  };

  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ scale: 1.02 }}
      className={`relative rounded-2xl border p-4 backdrop-blur-xl transition-all ${typeColors[agent.type]}`}
    >
      {/* Status indicator */}
      <div className={`absolute top-3 right-3 h-2 w-2 rounded-full ${statusColors[agent.status]}`} />

      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-[#18181B] border border-wireframe-stroke flex items-center justify-center overflow-hidden">
          {agent.image ? (
            <img src={agent.image} alt={agent.name} className="h-full w-full object-cover" />
          ) : (
            <Users size={18} className="text-zinc-500" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-100 truncate">{agent.name}</p>
          <p className="text-xs text-zinc-500 uppercase tracking-wider">{agent.role}</p>

          <div className="flex flex-wrap gap-1 mt-2">
            {agent.capabilities.slice(0, 3).map((cap) => (
              <span
                key={cap}
                className="px-1.5 py-0.5 rounded text-[8px] font-mono uppercase bg-[#18181B] text-zinc-500 border border-wireframe-stroke"
              >
                {cap}
              </span>
            ))}
          </div>
        </div>
      </div>

      {onActivate && agent.status === "idle" && (
        <button
          onClick={onActivate}
          className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gold/10 text-gold text-xs font-semibold uppercase tracking-wider hover:bg-gold/20 transition-colors"
        >
          <Zap size={10} />
          Hatch
        </button>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// ACHEEVY Master Control Panel
// ─────────────────────────────────────────────────────────────

function AcheevyPanel() {
  const [mode, setMode] = useState<AcheevyMode>("recommend");
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "acheevy"; content: string }[]>([
    { role: "acheevy", content: "Welcome to Deploy Dock. I'm ACHEEVY, your deployment orchestrator. How can I help you today?" },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const modeConfig: Record<AcheevyMode, { icon: React.ElementType; label: string; placeholder: string }> = {
    recommend: { icon: Sparkles, label: "Recommend", placeholder: "Describe what you want to deploy..." },
    explain: { icon: MessageSquare, label: "Explain", placeholder: "Ask about deployment steps or status..." },
    execute: { icon: Play, label: "Execute", placeholder: "Confirm deployment action..." },
    prove: { icon: Shield, label: "Prove", placeholder: "Request evidence or attestation..." },
  };

  const handleSubmit = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setIsProcessing(true);

    try {
      const data = await fetchJSON<{
        reply?: string;
        intent?: { name: string; confidence: number };
        actionPlan?: Array<{ step: number; action: string; status: string }>;
        source?: string;
      }>("/api/acheevy/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          context: { mode },
        }),
      });

      const reply = data?.reply || "I received your request. The backend services may be starting up — please try again in a moment.";
      setMessages((prev) => [...prev, { role: "acheevy", content: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "acheevy", content: "Connection to ACHEEVY failed. Please check that services are running." }]);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <motion.div
      variants={materialize}
      initial="hidden"
      animate="visible"
      className="rounded-2xl border border-gold/20 bg-[#111113]/80 backdrop-blur-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gold/10 bg-gold/5">
        <div className="flex items-center gap-2">
          <motion.div
            animate={pulseGlow.animate}
            className="h-8 w-8 rounded-xl bg-gold/20 flex items-center justify-center"
          >
            <Sparkles size={16} className="text-gold" />
          </motion.div>
          <div>
            <p className="text-sm font-semibold text-gold">Ask ACHEEVY</p>
            <p className="text-xs text-gold/50 uppercase tracking-wider">Master Control Interface</p>
          </div>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="flex border-b border-wireframe-stroke">
        {(Object.keys(modeConfig) as AcheevyMode[]).map((m) => {
          const { icon: Icon, label } = modeConfig[m];
          return (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                mode === m
                  ? "text-gold bg-gold/10 border-b-2 border-gold"
                  : "text-zinc-500 hover:text-zinc-400 hover:bg-white/5"
              }`}
            >
              <Icon size={12} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Messages */}
      <div className="h-64 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "bg-gold/10 text-gold border border-gold/20"
                  : "bg-[#18181B] text-zinc-200 border border-wireframe-stroke"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-[#18181B] border border-wireframe-stroke rounded-2xl px-4 py-3 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-gold" />
              <span className="text-xs text-zinc-500">ACHEEVY is processing...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-wireframe-stroke">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder={modeConfig[mode].placeholder}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#18181B]/70 border border-wireframe-stroke text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-gold/40 transition-colors"
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isProcessing}
            className="px-4 rounded-xl bg-gold text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gold-light transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Transfer View Visualization
// ─────────────────────────────────────────────────────────────

function TransferView({ stage }: { stage: "idle" | "plan" | "quote" | "hatch" | "assign" | "launch" | "done" }) {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; progress: number }[]>([]);

  useEffect(() => {
    if (stage === "idle" || stage === "plan" || stage === "quote") {
      setParticles([]);
      return;
    }

    // Generate particles for animation
    const newParticles = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      progress: 0,
    }));
    setParticles(newParticles);
  }, [stage]);

  return (
    <div className="relative h-48 rounded-2xl border border-wireframe-stroke bg-[#111113]/60 overflow-hidden">
      {/* Lo-fi grain overlay */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: "url('/images/textures/grain.png')", backgroundSize: "128px" }} />

      {/* Scanline effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 animate-scan bg-gradient-to-b from-transparent via-gold/5 to-transparent" style={{ backgroundSize: "100% 4px" }} />
      </div>

      {/* Stage visualization */}
      <div className="absolute inset-0 flex items-center justify-center">
        {stage === "idle" && (
          <div className="text-center">
            <Ship size={40} className="text-zinc-600 mx-auto" />
            <p className="mt-2 text-xs text-zinc-600 uppercase tracking-wider">Deploy Dock Ready</p>
          </div>
        )}

        {stage === "hatch" && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative"
          >
            {particles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ x: p.x - 50, y: p.y - 50, opacity: 0 }}
                animate={{ x: 0, y: 0, opacity: 1 }}
                transition={{ duration: 1, delay: p.id * 0.1 }}
                className="absolute h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
              />
            ))}
            <div className="h-16 w-16 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
              <Box size={24} className="text-cyan-400" />
            </div>
          </motion.div>
        )}

        {stage === "assign" && (
          <motion.div className="flex items-center gap-8">
            <div className="h-12 w-12 rounded-xl bg-gold/20 border border-gold/40 flex items-center justify-center">
              <Network size={20} className="text-gold" />
            </div>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              className="h-0.5 w-24 bg-gradient-to-r from-gold to-cyan-400"
            />
            <div className="h-12 w-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
              <Workflow size={20} className="text-cyan-400" />
            </div>
          </motion.div>
        )}

        {stage === "launch" && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="relative"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-emerald-500/20"
            />
            <div className="h-16 w-16 rounded-full bg-emerald-500/30 border border-emerald-500/50 flex items-center justify-center">
              <Rocket size={24} className="text-emerald-400" />
            </div>
          </motion.div>
        )}
      </div>

      {/* Stage label */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
        <span className="text-xs text-zinc-500 uppercase tracking-wider font-mono">
          Transfer View
        </span>
        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
          stage === "idle" ? "bg-[#1F1F23] text-zinc-500" :
          stage === "hatch" ? "bg-cyan-500/20 text-cyan-400" :
          stage === "assign" ? "bg-gold/20 text-gold" :
          "bg-emerald-500/20 text-emerald-400"
        }`}>
          {stage === "idle" ? "Standby" : stage.toUpperCase()}
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function DeployDockPage() {
  const [activeTab, setActiveTab] = useState<DeployTab>("hatch");
  const [deploymentStage, setDeploymentStage] = useState<
    "idle" | "plan" | "quote" | "hatch" | "assign" | "launch" | "done"
  >("idle");
  const [isHatching, setIsHatching] = useState(false);

  const [roster, setRoster] = useState<AgentRoster[]>([]);
  const [events, setEvents] = useState<DeploymentEvent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [jobPackets, setJobPackets] = useState<JobPacket[]>([]);

  // Real data from APIs
  const [catalogPlugs, setCatalogPlugs] = useState<CatalogPlug[]>([]);
  const [instances, setInstances] = useState<PlugInstance[]>([]);
  const [selectedPlugId, setSelectedPlugId] = useState<string | null>(null);
  const [deploying, setDeploying] = useState(false);
  const [circuitData, setCircuitData] = useState<CircuitDashboard | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load catalog and instances on mount + auto-refresh
  useEffect(() => {
    fetchJSON<{ plugs: CatalogPlug[] }>("/api/plug-catalog")
      .then((data) => {
        if (data?.plugs) setCatalogPlugs(data.plugs.filter(p => !p.tags?.includes("coming-soon")));
      });
    loadInstances();
    loadCircuitMetrics();

    // Poll instances and circuit metrics every 15 seconds
    const interval = setInterval(() => {
      loadInstances();
      loadCircuitMetrics();
    }, 15_000);
    return () => clearInterval(interval);
  }, []);

  const loadInstances = () => {
    fetchJSON<{ instances: PlugInstance[] }>("/api/plug-instances?userId=web-user")
      .then((data) => {
        if (data?.instances) setInstances(data.instances);
      });
  };

  const loadCircuitMetrics = () => {
    fetchJSON<CircuitDashboard>("/api/circuit-metrics/dashboard")
      .then((data) => {
        if (data) setCircuitData(data);
      });
  };

  const handleInstanceAction = async (instanceId: string, action: "stop" | "restart" | "decommission") => {
    setActionLoading(instanceId);
    try {
      if (action === "decommission") {
        await fetchJSON(`/api/plug-instances/${instanceId}`, { method: "DELETE" });
      } else {
        await fetchJSON(`/api/plug-instances/${instanceId}/${action}`, { method: "POST" });
      }
      addEvent({
        stage: action === "decommission" ? "done" : "launch",
        title: `Instance ${action === "stop" ? "Stopped" : action === "restart" ? "Restarted" : "Decommissioned"}`,
        description: `Action: ${action} on ${instanceId}`,
        agent: "ACHEEVY",
      });
      loadInstances();
    } catch {
      addEvent({ stage: "verify", title: "Action Failed", description: `Failed to ${action} instance ${instanceId}`, agent: "ACHEEVY" });
    } finally {
      setActionLoading(null);
    }
  };

  const formatUptime = (seconds?: number) => {
    if (!seconds) return "—";
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
    return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`;
  };

  const triggerParticles = () => {
    setIsHatching(true);
    setTimeout(() => setIsHatching(false), 3000);
  };

  const addEvent = (partial: Partial<DeploymentEvent>) => {
    const newEvent: DeploymentEvent = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      stage: "plan",
      title: "New Event",
      description: "...",
      agent: "ACHEEVY",
      ...partial,
    };
    setEvents((prev) => [newEvent, ...prev]);
  };

  const handleHatchAgent = (agentId: string) => {
    triggerParticles();
    setRoster((prev) =>
      prev.map((a) => (a.id === agentId ? { ...a, status: "active" } : a))
    );
    addEvent({
      stage: "hatch",
      title: "Agent Hatched",
      description: `${roster.find((a) => a.id === agentId)?.name} has been activated`,
      agent: "ACHEEVY",
    });
  };

  // Select a plug from catalog → populate agent roster from its config
  const selectPlug = (plugId: string) => {
    const plug = catalogPlugs.find((p) => p.id === plugId);
    if (!plug) return;

    setSelectedPlugId(plugId);
    triggerParticles();
    setDeploymentStage("hatch");

    // Create agent roster from the plug's requirements
    const agents: AgentRoster[] = [
      { id: "acheevy-deploy", name: "ACHEEVY", role: "Orchestrator", type: "boomer_ang", status: "active", capabilities: ["deploy", "monitor", "verify"] },
      { id: "code-ang", name: "Code_Ang", role: "Build & Config", type: "chicken_hawk", status: "idle", capabilities: ["docker", "compose", "nginx"] },
      { id: "quality-ang", name: "Quality_Ang", role: "Health & Verify", type: "lil_hawk", status: "idle", capabilities: ["health-check", "port-scan", "verify"] },
    ];
    if (plug.resources.gpu) {
      agents.push({ id: "gpu-ang", name: "GPU_Ang", role: "GPU Config", type: "lil_hawk", status: "idle", capabilities: ["cuda", "vertex-ai", "inference"] });
    }

    setRoster(agents);
    addEvent({
      stage: "hatch",
      title: `Preparing ${plug.name}`,
      description: `${agents.length} agents assembled for ${plug.name} deployment`,
      agent: "ACHEEVY",
    });
  };

  // Real deployment via API
  const launchDeployment = async () => {
    if (!selectedPlugId) return;
    const plug = catalogPlugs.find((p) => p.id === selectedPlugId);
    if (!plug) return;

    triggerParticles();
    setDeploying(true);
    setDeploymentStage("launch");
    addEvent({
      stage: "launch",
      title: "Launch Sequence Initiated",
      description: `Deploying ${plug.name} via Port Authority`,
      agent: "ACHEEVY",
    });

    const data = await fetchJSON<{
      instance?: PlugInstance;
      deploymentId?: string;
      events?: Array<{ stage: string; message: string; timestamp: string }>;
      error?: string;
    }>("/api/plug-instances/spin-up", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plugId: selectedPlugId,
        userId: "web-user",
        instanceName: `${plug.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now().toString(36).slice(-4)}`,
        deliveryMode: "hosted",
      }),
    });

    setDeploying(false);

    if (data?.instance) {
      setDeploymentStage("done");
      addEvent({
        stage: "done",
        title: `${plug.name} Deployed`,
        description: `Instance ${data.instance.instanceId} — status: ${data.instance.status}`,
        agent: "ACHEEVY",
        proof: data.deploymentId
          ? { type: "manifest", label: "Deployment ID", value: data.deploymentId }
          : undefined,
      });
      // Log any deployment events from the API
      if (data.events) {
        for (const evt of data.events) {
          addEvent({
            stage: evt.stage as DeploymentEvent["stage"],
            title: evt.stage,
            description: evt.message,
            agent: "ACHEEVY",
          });
        }
      }
      loadInstances();
    } else {
      setDeploymentStage("hatch");
      addEvent({
        stage: "verify",
        title: "Deployment Issue",
        description: data?.error || "Deployment did not complete — check gateway connectivity",
        agent: "ACHEEVY",
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pb-20 text-zinc-200 font-sans selection:bg-gold/30"
    >
      <ParticleLazer isActive={isHatching} />
      
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 max-w-7xl mx-auto">
        {/* Left Column: Main Interface */}
        <div className="space-y-6">
          {/* Transfer View */}
          <TransferView stage={deploymentStage} />

          {/* Tab Navigation */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <TabButton tab="hatch" activeTab={activeTab} icon={Box} label="Hatch" onClick={() => setActiveTab("hatch")} />
            <TabButton tab="assign" activeTab={activeTab} icon={Link2} label="Assign" onClick={() => setActiveTab("assign")} />
            <TabButton tab="launch" activeTab={activeTab} icon={Rocket} label="Launch" onClick={() => setActiveTab("launch")} />
            <TabButton tab="logs" activeTab={activeTab} icon={Terminal} label="Logs" onClick={() => setActiveTab("logs")} />
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === "hatch" && (
              <motion.div
                key="hatch"
                variants={materialize}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-4"
              >
                {/* Step 1: Select a Plug to Deploy */}
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-200">
                    Select a Plug to Deploy
                  </h2>
                  <p className="text-xs text-zinc-500 mt-1">
                    Choose from the catalog — ACHEEVY will assemble the right agents
                  </p>
                </div>

                {catalogPlugs.length === 0 ? (
                  <div className="text-center py-8 rounded-2xl border border-wireframe-stroke bg-[#111113]/60">
                    <Loader2 size={24} className="animate-spin text-gold/40 mx-auto" />
                    <p className="mt-2 text-xs text-zinc-500">Loading catalog...</p>
                  </div>
                ) : (
                  <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="grid gap-3 sm:grid-cols-2"
                  >
                    {catalogPlugs.filter(p => !p.tags?.includes("coming-soon") && p.delivery?.includes("hosted")).map((plug) => (
                      <motion.button
                        key={plug.id}
                        variants={staggerItem}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => selectPlug(plug.id)}
                        className={`text-left rounded-2xl border p-4 backdrop-blur-xl transition-all ${
                          selectedPlugId === plug.id
                            ? "border-gold/40 bg-gold/10 ring-1 ring-gold/20"
                            : "border-wireframe-stroke bg-[#111113]/60 hover:border-gold/20"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 shrink-0 rounded-xl bg-[#18181B] border border-wireframe-stroke flex items-center justify-center">
                            <Container size={18} className={selectedPlugId === plug.id ? "text-gold" : "text-zinc-500"} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-zinc-100 truncate">{plug.name}</p>
                            <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{plug.tagline}</p>
                            <div className="flex items-center gap-2 mt-2 text-[9px] text-zinc-500 font-mono">
                              <span>{plug.resources?.cpu || "1"} CPU</span>
                              <span className="text-zinc-600">|</span>
                              <span>{plug.resources?.memory || "1G"}</span>
                              {plug.resources?.gpu && <span className="text-amber-400">GPU</span>}
                            </div>
                          </div>
                          {selectedPlugId === plug.id && (
                            <CheckCircle2 size={16} className="text-gold shrink-0" />
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </motion.div>
                )}

                {/* Step 2: Agent Roster (shown after plug selected) */}
                {roster.length > 0 && (
                  <>
                    <div className="flex items-center justify-between mt-6">
                      <div>
                        <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-200">
                          Agent Roster
                        </h2>
                        <p className="text-xs text-zinc-500 mt-1">
                          Agents assigned for this deployment
                        </p>
                      </div>
                    </div>

                    <motion.div
                      variants={staggerContainer}
                      initial="hidden"
                      animate="visible"
                      className="grid gap-4 sm:grid-cols-2"
                    >
                      {roster.map((agent) => (
                        <AgentCard
                          key={agent.id}
                          agent={agent}
                          onActivate={() => handleHatchAgent(agent.id)}
                        />
                      ))}
                    </motion.div>
                  </>
                )}

                {/* Platform Health Strip */}
                {circuitData && (
                  <div className="mt-6 rounded-2xl border border-wireframe-stroke bg-[#111113]/60 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`h-2 w-2 rounded-full ${circuitData.overall === "healthy" ? "bg-emerald-400" : "bg-amber-400"} animate-pulse`} />
                      <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Platform Health</span>
                      <span className="ml-auto text-xs text-zinc-500 font-mono">{circuitData.uptimePercent}% uptime</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {circuitData.services?.slice(0, 4).map((svc) => (
                        <div key={svc.name} className="text-center p-2 rounded-lg bg-[#18181B] border border-wireframe-stroke">
                          <div className={`h-1.5 w-1.5 rounded-full mx-auto mb-1 ${svc.status === "up" ? "bg-emerald-400" : svc.status === "degraded" ? "bg-amber-400" : "bg-red-400"}`} />
                          <p className="text-[9px] text-zinc-400 truncate">{svc.name}</p>
                          <p className="text-[9px] text-zinc-500 font-mono">{svc.responseTime}ms</p>
                        </div>
                      ))}
                    </div>
                    {circuitData.plugInstances && (
                      <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500 font-mono">
                        <span>{circuitData.plugInstances.runningInstances} running</span>
                        <span className="text-zinc-600">|</span>
                        <span>{circuitData.plugInstances.healthStats.healthy} healthy</span>
                        <span className="text-zinc-600">|</span>
                        <span>Ports: {circuitData.plugInstances.portCapacity.used}/{circuitData.plugInstances.portCapacity.total} ({circuitData.plugInstances.portCapacity.percentage}%)</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Running Instances */}
                {instances.length > 0 && (
                  <>
                    <div className="mt-6 flex items-center justify-between">
                      <div>
                        <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-200">
                          Running Instances
                        </h2>
                        <p className="text-xs text-zinc-500 mt-1">
                          {instances.length} instance{instances.length !== 1 ? "s" : ""} managed
                        </p>
                      </div>
                      <button onClick={loadInstances} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181B] text-zinc-500 text-xs font-semibold uppercase tracking-wider hover:bg-white/8 transition-colors">
                        <RefreshCw size={10} /> Refresh
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {instances.map((inst) => {
                        const isRunning = inst.status === "running";
                        const statusColor = isRunning
                          ? "border-emerald-500/20 bg-emerald-500/5"
                          : inst.status === "stopped"
                          ? "border-red-500/20 bg-red-500/5"
                          : "border-amber-500/20 bg-amber-500/5";
                        const healthColor = inst.healthStatus === "healthy" ? "text-emerald-400" : inst.healthStatus === "unhealthy" ? "text-red-400" : "text-amber-400";

                        return (
                          <div key={inst.instanceId} className={`rounded-2xl border p-4 ${statusColor}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`h-2 w-2 rounded-full ${isRunning ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
                              <p className="text-sm font-semibold text-zinc-100 truncate flex-1">{inst.name || inst.plugId}</p>
                            </div>
                            <div className="space-y-1 mb-3">
                              <p className="text-xs text-zinc-500 font-mono">
                                Port {inst.assignedPort} · {inst.status} · <span className={healthColor}>{inst.healthStatus || "checking"}</span>
                              </p>
                              <p className="text-xs text-zinc-500 font-mono">
                                Uptime: {formatUptime(inst.uptimeSeconds)} · Plug: {inst.plugId}
                              </p>
                            </div>
                            <div className="flex gap-1.5">
                              {isRunning ? (
                                <>
                                  <button
                                    onClick={() => handleInstanceAction(inst.instanceId, "stop")}
                                    disabled={actionLoading === inst.instanceId}
                                    className="flex-1 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-[9px] font-semibold uppercase tracking-wider hover:bg-amber-500/20 transition-colors disabled:opacity-30"
                                  >
                                    Stop
                                  </button>
                                  <button
                                    onClick={() => handleInstanceAction(inst.instanceId, "restart")}
                                    disabled={actionLoading === inst.instanceId}
                                    className="flex-1 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 text-[9px] font-semibold uppercase tracking-wider hover:bg-cyan-500/20 transition-colors disabled:opacity-30"
                                  >
                                    Restart
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleInstanceAction(inst.instanceId, "restart")}
                                  disabled={actionLoading === inst.instanceId}
                                  className="flex-1 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[9px] font-semibold uppercase tracking-wider hover:bg-emerald-500/20 transition-colors disabled:opacity-30"
                                >
                                  Start
                                </button>
                              )}
                              <button
                                onClick={() => handleInstanceAction(inst.instanceId, "decommission")}
                                disabled={actionLoading === inst.instanceId}
                                className="py-1.5 px-2 rounded-lg bg-red-500/10 text-red-400 text-[9px] font-semibold uppercase tracking-wider hover:bg-red-500/20 transition-colors disabled:opacity-30"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {activeTab === "assign" && (
              <motion.div
                key="assign"
                variants={materialize}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-4"
              >
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-200">
                    Workflow Assignment
                  </h2>
                  <p className="text-xs text-zinc-500 mt-1">
                    Bind roles and runbooks through n8n protocols
                  </p>
                </div>

                <div className="rounded-2xl border border-wireframe-stroke bg-[#111113]/60 p-6 backdrop-blur-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
                      <Workflow size={20} className="text-orange-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-100">n8n Workflow Binding</p>
                      <p className="text-xs text-zinc-500">Connect to automation protocols</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {["auth-deploy-v2", "build-pipeline", "health-check", "rollback-trigger"].map((workflow, i) => (
                      <div
                        key={workflow}
                        className="flex items-center justify-between p-3 rounded-xl bg-[#18181B] border border-wireframe-stroke"
                      >
                        <div className="flex items-center gap-2">
                          <Network size={14} className="text-orange-400" />
                          <span className="text-sm text-zinc-200">{workflow}</span>
                        </div>
                        <button
                          onClick={() => setDeploymentStage("assign")}
                          className="px-3 py-1 rounded-lg bg-orange-500/10 text-orange-400 text-xs font-semibold uppercase tracking-wider hover:bg-orange-500/20 transition-colors"
                        >
                          Bind
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Job Packets */}
                <div className="rounded-2xl border border-wireframe-stroke bg-[#111113]/60 p-6 backdrop-blur-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                      <Package size={20} className="text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-100">Job Packets</p>
                      <p className="text-xs text-zinc-500">Deterministic task bundles with gates</p>
                    </div>
                  </div>

                  {jobPackets.length === 0 ? (
                    <div className="text-center py-8">
                      <Package size={32} className="text-zinc-600 mx-auto" />
                      <p className="mt-2 text-xs text-zinc-500">No job packets created yet</p>
                      <button className="mt-3 px-4 py-2 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-semibold hover:bg-amber-500/20 transition-colors">
                        Create Job Packet
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Job packet list */}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "launch" && (
              <motion.div
                key="launch"
                variants={materialize}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-4"
              >
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-200">
                    Launch Control
                  </h2>
                  <p className="text-xs text-zinc-500 mt-1">
                    Deploy through Port Authority gateway
                  </p>
                </div>

                {/* Launch Panel */}
                <div className="rounded-2xl border border-wireframe-stroke bg-[#111113]/60 p-6 backdrop-blur-xl">
                  {/* Selected plug info */}
                  {selectedPlugId && (
                    <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-gold/5 border border-gold/20">
                      <Container size={20} className="text-gold" />
                      <div>
                        <p className="text-sm font-semibold text-zinc-100">
                          {catalogPlugs.find((p) => p.id === selectedPlugId)?.name || selectedPlugId}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {catalogPlugs.find((p) => p.id === selectedPlugId)?.tagline}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-3 mb-6">
                    <div className="p-4 rounded-xl bg-[#18181B] border border-wireframe-stroke">
                      <p className="text-xs text-zinc-500 uppercase tracking-wider">Agents Ready</p>
                      <p className="text-2xl font-bold text-gold mt-1">
                        {roster.filter((a) => a.status === "active").length}/{roster.length}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#18181B] border border-wireframe-stroke">
                      <p className="text-xs text-zinc-500 uppercase tracking-wider">Instances</p>
                      <p className="text-2xl font-bold text-emerald-400 mt-1">{instances.length}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#18181B] border border-wireframe-stroke">
                      <p className="text-xs text-zinc-500 uppercase tracking-wider">Catalog</p>
                      <p className="text-2xl font-bold text-cyan-400 mt-1">{catalogPlugs.length}</p>
                    </div>
                  </div>

                  {/* Pre-launch checklist */}
                  <div className="space-y-2 mb-6">
                    {[
                      { label: "Plug selected from catalog", done: !!selectedPlugId },
                      { label: "Agent roster assembled", done: roster.some((a) => a.status === "active") },
                      { label: "Ready to deploy", done: !!selectedPlugId && roster.length > 0 },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <div className={`h-4 w-4 rounded-full flex items-center justify-center ${
                          item.done ? "bg-emerald-500/20 text-emerald-400" : "bg-[#18181B] text-zinc-500"
                        }`}>
                          {item.done && <CheckCircle2 size={10} />}
                        </div>
                        <span className={item.done ? "text-zinc-200" : "text-zinc-500"}>{item.label}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={launchDeployment}
                    disabled={!selectedPlugId || deploying || deploymentStage === "done"}
                    className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-emerald-500/20 text-emerald-400 text-sm font-bold uppercase tracking-wider border border-emerald-500/30 hover:bg-emerald-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {deploying ? (
                      <><Loader2 size={18} className="animate-spin" /> Deploying...</>
                    ) : deploymentStage === "done" ? (
                      <><CheckCircle2 size={18} /> Deployed</>
                    ) : (
                      <><Rocket size={18} /> Deploy {catalogPlugs.find((p) => p.id === selectedPlugId)?.name || "Selected Plug"}</>
                    )}
                  </button>

                  {deploymentStage === "done" && (
                    <button
                      onClick={() => {
                        setSelectedPlugId(null);
                        setRoster([]);
                        setDeploymentStage("idle");
                      }}
                      className="w-full mt-3 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#18181B] text-zinc-400 text-xs font-semibold uppercase tracking-wider border border-wireframe-stroke hover:bg-white/8 transition-all"
                    >
                      <Plus size={14} /> Deploy Another
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "logs" && (
              <motion.div
                key="logs"
                variants={materialize}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-200">
                      Glass Box Events
                    </h2>
                    <p className="text-xs text-zinc-500 mt-1">
                      Proof-linked status feed
                    </p>
                  </div>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181B] text-zinc-500 text-xs font-semibold uppercase tracking-wider hover:bg-white/8 hover:text-zinc-400 transition-colors">
                    <RefreshCw size={12} />
                    Refresh
                  </button>
                </div>

                <div className="rounded-2xl border border-wireframe-stroke bg-[#111113]/60 p-6 backdrop-blur-xl">
                  <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="space-y-0"
                  >
                    {events.length === 0 ? (
                      <div className="text-center py-8">
                        <Terminal size={32} className="text-zinc-600 mx-auto" />
                        <p className="mt-2 text-xs text-zinc-500">No deployment events yet</p>
                      </div>
                    ) : (
                      events.map((event) => (
                        <GlassBoxEvent key={event.id} event={event} />
                      ))
                    )}
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: ACHEEVY Panel */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <AcheevyPanel />
        </div>
      </div>
    </motion.div>
  );
}
