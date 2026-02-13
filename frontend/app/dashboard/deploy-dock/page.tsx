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
// Mock Data (replace with real API calls)
// ─────────────────────────────────────────────────────────────

const MOCK_ROSTER: AgentRoster[] = [
  { id: "ba-1", name: "Code_Ang", role: "Lead Engineer", type: "boomer_ang", status: "idle", capabilities: ["code-gen", "review", "deploy"], image: "/images/angs/code-ang.png" },
  { id: "ba-2", name: "Quality_Ang", role: "QA Lead", type: "boomer_ang", status: "idle", capabilities: ["test", "audit", "validate"], image: "/images/angs/quality-ang.png" },
  { id: "ch-1", name: "Chicken Hawk", role: "Execution Supervisor", type: "chicken_hawk", status: "idle", capabilities: ["orchestrate", "gate", "dispatch"] },
  { id: "lh-1", name: "Build_Hawk", role: "Build Runner", type: "lil_hawk", status: "idle", capabilities: ["compile", "bundle", "artifact"] },
  { id: "lh-2", name: "Deploy_Hawk", role: "Deploy Runner", type: "lil_hawk", status: "idle", capabilities: ["container", "publish", "verify"] },
];

const MOCK_EVENTS: DeploymentEvent[] = [
  { id: "e1", timestamp: new Date(Date.now() - 300000), stage: "ingest", title: "Intent Received", description: "User requested deployment of auth-service v2.1", agent: "ACHEEVY" },
  { id: "e2", timestamp: new Date(Date.now() - 240000), stage: "plan", title: "Plan Generated", description: "3-stage deployment plan created with rollback gates", agent: "ACHEEVY", proof: { type: "manifest", label: "Plan Manifest", value: "sha256:a8f3..." } },
  { id: "e3", timestamp: new Date(Date.now() - 180000), stage: "quote", title: "LUC Quote", description: "Estimated cost: 150 LUC tokens", agent: "ACHEEVY", proof: { type: "artifact", label: "Quote Document", value: "QT-2026-0210" } },
];

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
          : "text-white/40 border border-transparent hover:text-white/60 hover:bg-white/5"
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
    plan: "bg-violet-500/20 text-violet-400 border-violet-500/30",
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
      <div className={`absolute -left-[5px] top-0 h-2.5 w-2.5 rounded-full border-2 ${stageColors[event.stage] || "bg-white/20 border-white/30"}`} />

      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${stageColors[event.stage]}`}>
            {event.stage}
          </span>
          <span className="text-[10px] text-white/30 font-mono">
            {event.timestamp.toLocaleTimeString()}
          </span>
          {event.agent && (
            <span className="text-[10px] text-gold/50 font-mono">
              via {event.agent}
            </span>
          )}
        </div>

        <p className="text-sm font-medium text-white">{event.title}</p>
        <p className="text-xs text-white/40">{event.description}</p>

        {event.proof && (
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-wireframe-stroke text-[10px]">
              <FileCheck size={10} className="text-emerald-400" />
              <span className="text-white/60">{event.proof.label}:</span>
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
    lil_hawk: "border-violet-500/30 bg-violet-500/5",
  };

  const statusColors = {
    idle: "bg-white/20",
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
        <div className="h-10 w-10 rounded-xl bg-white/5 border border-wireframe-stroke flex items-center justify-center overflow-hidden">
          {agent.image ? (
            <img src={agent.image} alt={agent.name} className="h-full w-full object-cover" />
          ) : (
            <Users size={18} className="text-white/30" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{agent.name}</p>
          <p className="text-[10px] text-white/40 uppercase tracking-wider">{agent.role}</p>

          <div className="flex flex-wrap gap-1 mt-2">
            {agent.capabilities.slice(0, 3).map((cap) => (
              <span
                key={cap}
                className="px-1.5 py-0.5 rounded text-[8px] font-mono uppercase bg-white/5 text-white/40 border border-wireframe-stroke"
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
          className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gold/10 text-gold text-[10px] font-semibold uppercase tracking-wider hover:bg-gold/20 transition-colors"
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

    setMessages((prev) => [...prev, { role: "user", content: input }]);
    setInput("");
    setIsProcessing(true);

    // Simulate ACHEEVY response
    setTimeout(() => {
      const responses: Record<AcheevyMode, string> = {
        recommend: `Based on your request, I recommend a 3-stage deployment:\n\n1. **Hatch** - Assemble Code_Ang and Quality_Ang\n2. **Assign** - Bind to n8n workflow #auth-deploy-v2\n3. **Launch** - Execute with rollback gates\n\nEstimated LUC cost: 150 tokens. Shall I proceed?`,
        explain: `The deployment process follows the ACHEEVY delegation model:\n\n• I handle all user communication\n• Boomer_Angs supervise specialized work\n• Chicken Hawk converts plans to job packets\n• Lil_Hawks execute bounded tasks with proofs\n\nEach step produces verifiable artifacts.`,
        execute: `Initiating deployment sequence...\n\n✓ Job packet created: JP-2026-0210-AUTH\n✓ Gates configured: pre-deploy, health-check, rollback\n✓ LUC budget locked: 150 tokens\n\nAwaiting your approval to proceed to Hatch stage.`,
        prove: `Evidence bundle for current deployment:\n\n• Plan Manifest: sha256:a8f3e2...\n• Quote Document: QT-2026-0210\n• Agent Roster: 5 agents assigned\n• Gate Config: 3 approval gates\n\nAll artifacts are cryptographically signed.`,
      };

      setMessages((prev) => [...prev, { role: "acheevy", content: responses[mode] }]);
      setIsProcessing(false);
    }, 1500);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <motion.div
      variants={materialize}
      initial="hidden"
      animate="visible"
      className="rounded-2xl border border-gold/20 bg-[#0A0A0A]/80 backdrop-blur-2xl overflow-hidden"
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
            <p className="text-[10px] text-gold/50 uppercase tracking-wider">Master Control Interface</p>
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
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-semibold uppercase tracking-wider transition-all ${
                mode === m
                  ? "text-gold bg-gold/10 border-b-2 border-gold"
                  : "text-white/40 hover:text-white/60 hover:bg-white/5"
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
                  : "bg-white/5 text-white/80 border border-wireframe-stroke"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-wireframe-stroke rounded-2xl px-4 py-3 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-gold" />
              <span className="text-xs text-white/40">ACHEEVY is processing...</span>
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
            className="flex-1 px-4 py-2.5 rounded-xl bg-black/60 border border-wireframe-stroke text-sm text-white placeholder:text-white/30 outline-none focus:border-gold/40 transition-colors"
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
    <div className="relative h-48 rounded-2xl border border-wireframe-stroke bg-[#0A0A0A]/60 overflow-hidden">
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
            <Ship size={40} className="text-white/10 mx-auto" />
            <p className="mt-2 text-xs text-white/20 uppercase tracking-wider">Deploy Dock Ready</p>
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
        <span className="text-[10px] text-white/30 uppercase tracking-wider font-mono">
          Transfer View
        </span>
        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
          stage === "idle" ? "bg-white/10 text-white/30" :
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
    "plan" | "quote" | "hatch" | "assign" | "launch" | "done"
  >("plan");
  const [isHatching, setIsHatching] = useState(false); // Controls particle effect

  const [roster, setRoster] = useState<AgentRoster[]>([]);
  const [events, setEvents] = useState<DeploymentEvent[]>(MOCK_EVENTS);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  const [jobPackets, setJobPackets] = useState<JobPacket[]>([]);

  // Trigger particle effect for 3s
  const triggerParticles = () => {
    setIsHatching(true);
    setTimeout(() => setIsHatching(false), 3000);
  };

  const handleHatchAgent = (agentId: string) => {
    triggerParticles();
    setRoster((prev) =>
      prev.map((a) =>
        a.id === agentId ? { ...a, status: "active" } : a
      )
    );
    addEvent({
      stage: "hatch",
      title: "Agent Hatched",
      description: `${roster.find((a) => a.id === agentId)?.name} has been activated`,
      agent: "ACHEEVY",
    });
  };

  const hatchAgents = async () => {
    triggerParticles();
    setDeploymentStage("hatch");
    // Simulate API call
    setTimeout(() => {
      setRoster(MOCK_ROSTER);
      addEvent({
        stage: "hatch",
        title: "Agents Hatched",
        description: "5 agents instantiated from templates",
        agent: "ACHEEVY",
      });
      setDeploymentStage("assign");
    }, 2500);
  };

  const launchDeployment = async () => {
    triggerParticles();
    setDeploymentStage("launch");
    addEvent({
      stage: "launch",
      title: "Launch Sequence Initiated",
      description: "Deployment pipeline started",
      agent: "Chicken Hawk",
    });
    // Simulate completion
    setTimeout(() => setDeploymentStage("done"), 5000);
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
  // The original handleHatchAgent is replaced by hatchAgents and addEvent
  // The original handleHatchAgent function is removed as per the instruction's implied change.

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pb-20 text-white/80 font-sans selection:bg-gold/30"
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
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80">
                      Agent Roster
                    </h2>
                    <p className="text-xs text-white/40 mt-1">
                      Assemble your deployment squad from House of Ang
                    </p>
                  </div>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold/10 text-gold text-[10px] font-semibold uppercase tracking-wider hover:bg-gold/20 transition-colors">
                    <Plus size={12} />
                    Add Agent
                  </button>
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
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80">
                    Workflow Assignment
                  </h2>
                  <p className="text-xs text-white/40 mt-1">
                    Bind roles and runbooks through n8n protocols
                  </p>
                </div>

                <div className="rounded-2xl border border-wireframe-stroke bg-[#0A0A0A]/60 p-6 backdrop-blur-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
                      <Workflow size={20} className="text-orange-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">n8n Workflow Binding</p>
                      <p className="text-[10px] text-white/40">Connect to automation protocols</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {["auth-deploy-v2", "build-pipeline", "health-check", "rollback-trigger"].map((workflow, i) => (
                      <div
                        key={workflow}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-wireframe-stroke"
                      >
                        <div className="flex items-center gap-2">
                          <Network size={14} className="text-orange-400" />
                          <span className="text-sm text-white/80">{workflow}</span>
                        </div>
                        <button
                          onClick={() => setDeploymentStage("assign")}
                          className="px-3 py-1 rounded-lg bg-orange-500/10 text-orange-400 text-[10px] font-semibold uppercase tracking-wider hover:bg-orange-500/20 transition-colors"
                        >
                          Bind
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Job Packets */}
                <div className="rounded-2xl border border-wireframe-stroke bg-[#0A0A0A]/60 p-6 backdrop-blur-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center">
                      <Package size={20} className="text-violet-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Job Packets</p>
                      <p className="text-[10px] text-white/40">Deterministic task bundles with gates</p>
                    </div>
                  </div>

                  {jobPackets.length === 0 ? (
                    <div className="text-center py-8">
                      <Package size={32} className="text-white/10 mx-auto" />
                      <p className="mt-2 text-xs text-white/30">No job packets created yet</p>
                      <button className="mt-3 px-4 py-2 rounded-lg bg-violet-500/10 text-violet-400 text-xs font-semibold hover:bg-violet-500/20 transition-colors">
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
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80">
                    Launch Control
                  </h2>
                  <p className="text-xs text-white/40 mt-1">
                    Deploy through Port Authority gateway
                  </p>
                </div>

                {/* Launch Panel */}
                <div className="rounded-2xl border border-wireframe-stroke bg-[#0A0A0A]/60 p-6 backdrop-blur-xl">
                  <div className="grid gap-4 sm:grid-cols-3 mb-6">
                    <div className="p-4 rounded-xl bg-white/5 border border-wireframe-stroke">
                      <p className="text-[10px] text-white/30 uppercase tracking-wider">Agents Ready</p>
                      <p className="text-2xl font-bold text-gold mt-1">
                        {roster.filter((a) => a.status === "active").length}/{roster.length}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-wireframe-stroke">
                      <p className="text-[10px] text-white/30 uppercase tracking-wider">LUC Budget</p>
                      <p className="text-2xl font-bold text-emerald-400 mt-1">150</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-wireframe-stroke">
                      <p className="text-[10px] text-white/30 uppercase tracking-wider">Gates</p>
                      <p className="text-2xl font-bold text-cyan-400 mt-1">3</p>
                    </div>
                  </div>

                  {/* Pre-launch checklist */}
                  <div className="space-y-2 mb-6">
                    {[
                      { label: "Agent roster assembled", done: roster.some((a) => a.status === "active") },
                      { label: "Workflows bound", done: deploymentStage === "assign" || deploymentStage === "launch" },
                      { label: "LUC budget approved", done: true },
                      { label: "Gates configured", done: true },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <div className={`h-4 w-4 rounded-full flex items-center justify-center ${
                          item.done ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-white/30"
                        }`}>
                          {item.done && <CheckCircle2 size={10} />}
                        </div>
                        <span className={item.done ? "text-white/80" : "text-white/30"}>{item.label}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={launchDeployment}
                    disabled={deploymentStage !== "assign"}
                    className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-emerald-500/20 text-emerald-400 text-sm font-bold uppercase tracking-wider border border-emerald-500/30 hover:bg-emerald-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Rocket size={18} />
                    Initiate Launch Sequence
                  </button>
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
                    <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80">
                      Glass Box Events
                    </h2>
                    <p className="text-xs text-white/40 mt-1">
                      Proof-linked status feed
                    </p>
                  </div>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-white/40 text-[10px] font-semibold uppercase tracking-wider hover:bg-white/10 hover:text-white/60 transition-colors">
                    <RefreshCw size={12} />
                    Refresh
                  </button>
                </div>

                <div className="rounded-2xl border border-wireframe-stroke bg-[#0A0A0A]/60 p-6 backdrop-blur-xl">
                  <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="space-y-0"
                  >
                    {events.length === 0 ? (
                      <div className="text-center py-8">
                        <Terminal size={32} className="text-white/10 mx-auto" />
                        <p className="mt-2 text-xs text-white/30">No deployment events yet</p>
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
