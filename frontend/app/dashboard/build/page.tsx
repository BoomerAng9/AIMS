// frontend/app/dashboard/build/page.tsx
"use client";

/**
 * DEPLOYMENT HANGAR — Real n8n Workflow Hub
 *
 * Replaces the fake Build Wizard with a real workflow engine:
 * 1. Browse & deploy n8n workflow templates
 * 2. Live workflow builder via Juno_Ang schema pool
 * 3. Real execution tracking via n8n API
 * 4. Crew visibility (Boomer_Ang → Chicken Hawk → Lil_Hawks)
 *
 * "Activity breeds Activity — shipped beats perfect."
 */

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Code,
  Eye,
  FileJson,
  GitBranch,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  Rocket,
  Search,
  Send,
  Settings,
  Shield,
  Workflow,
  X,
  Zap,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Activity,
  Box,
  Users,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  nodes?: Array<{ id: string; name: string; type: string }>;
}

interface N8nExecution {
  id: string;
  workflowId: string;
  finished: boolean;
  status: "running" | "success" | "error" | "waiting";
  startedAt: string;
  stoppedAt?: string;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: "pmo" | "deploy" | "research" | "content" | "automation";
  nodeCount: number;
  webhookPath: string;
  crew: string[];
  tags: string[];
}

interface GeneratedWorkflow {
  workflowJson: Record<string, unknown>;
  manifest: {
    workflowId: string;
    name: string;
    description: string;
    nodeCount: number;
    dependencies: string[];
    secretsRequired: string[];
  };
  validation: { valid: boolean; issues: string[] };
  failures: Array<{ scenario: string; impact: string; handled: boolean }>;
  gate: { approved: boolean; reasons: string[] };
}

type HangarTab = "workflows" | "builder" | "executions" | "crew";

/* ------------------------------------------------------------------ */
/*  Built-in Workflow Templates                                        */
/* ------------------------------------------------------------------ */

const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: "pmo-intake",
    name: "PMO Intake Pipeline",
    description: "Full chain-of-command: ACHEEVY → Boomer_Ang → Chicken Hawk → Lil_Hawks → Receipt",
    category: "pmo",
    nodeCount: 12,
    webhookPath: "pmo-intake",
    crew: ["Boomer_CTO", "Chicken Hawk", "Lil_Dispatch_Hawk"],
    tags: ["chain-of-command", "production"],
  },
  {
    id: "deploy-dock-launch",
    name: "Deploy Dock Launch",
    description: "Hatch agents → Assign workflows → Launch execution → Verify gates",
    category: "deploy",
    nodeCount: 8,
    webhookPath: "deploy-dock/launch",
    crew: ["Code_Ang", "Quality_Ang", "Build_Hawk", "Deploy_Hawk"],
    tags: ["deployment", "gates"],
  },
  {
    id: "research-pipeline",
    name: "Research & Analysis",
    description: "Brave Search enrichment → Data analysis → Report generation",
    category: "research",
    nodeCount: 6,
    webhookPath: "pmo/execution",
    crew: ["Analyst_Ang", "Lil_Busy_Hawk"],
    tags: ["research", "analysis"],
  },
  {
    id: "content-pipeline",
    name: "Content Production",
    description: "Content strategy → Writing → SEO optimization → Publishing",
    category: "content",
    nodeCount: 7,
    webhookPath: "pmo/execution",
    crew: ["Marketer_Ang", "Lil_Scurry_Hawk"],
    tags: ["content", "seo", "publishing"],
  },
  {
    id: "workflow-forge",
    name: "Workflow Smith Forge",
    description: "AUTHOR → VALIDATE → FAILURE → GATE pipeline for new n8n workflow creation",
    category: "automation",
    nodeCount: 5,
    webhookPath: "pmo/execution",
    crew: ["Juno_Ang", "AUTHOR_LIL_HAWK", "VALIDATE_LIL_HAWK", "GATE_LIL_HAWK"],
    tags: ["meta", "workflow-creation"],
  },
  {
    id: "data-ingest",
    name: "Data Ingestion Pipeline",
    description: "CSV/API intake → Parse → Transform → PostgreSQL insert → Verification",
    category: "automation",
    nodeCount: 8,
    webhookPath: "pmo/execution",
    crew: ["Koda_Ang", "Lil_Parcel_Hawk"],
    tags: ["data", "etl", "database"],
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  pmo: "border-gold/30 text-gold bg-gold/10",
  deploy: "border-emerald-400/30 text-emerald-400 bg-emerald-400/10",
  research: "border-blue-400/30 text-blue-400 bg-blue-400/10",
  content: "border-violet-400/30 text-violet-400 bg-violet-400/10",
  automation: "border-cyan-400/30 text-cyan-400 bg-cyan-400/10",
};

const CREW_HIERARCHY = [
  {
    tier: "Boomer_Angs",
    role: "Directors",
    members: [
      { id: "boomer-cto", name: "Boomer_CTO", office: "Tech Office", status: "active" },
      { id: "boomer-coo", name: "Boomer_COO", office: "Ops Office", status: "active" },
      { id: "boomer-cmo", name: "Boomer_CMO", office: "Marketing Office", status: "standby" },
      { id: "juno-ang", name: "Juno_Ang", office: "Workflow Scribe", status: "active" },
      { id: "rio-ang", name: "Rio_Ang", office: "Builder", status: "active" },
      { id: "koda-ang", name: "Koda_Ang", office: "Joiner", status: "standby" },
    ],
  },
  {
    tier: "Chicken Hawks",
    role: "Execution Supervisors",
    members: [
      { id: "ch-main", name: "Chicken Hawk", office: "Shift Commander", status: "active" },
    ],
  },
  {
    tier: "Lil_Hawks",
    role: "Task Executors",
    members: [
      { id: "lh-author", name: "AUTHOR_LIL_HAWK", office: "Workflow Author", status: "active" },
      { id: "lh-validate", name: "VALIDATE_LIL_HAWK", office: "Schema Validator", status: "active" },
      { id: "lh-failure", name: "FAILURE_LIL_HAWK", office: "Failure Hunter", status: "standby" },
      { id: "lh-gate", name: "GATE_LIL_HAWK", office: "Final Gate", status: "standby" },
      { id: "lh-dispatch", name: "Lil_Dispatch_Hawk", office: "Task Dispatch", status: "active" },
      { id: "lh-build", name: "Lil_Packer_Hawk", office: "Container Packaging", status: "standby" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function DeploymentHangarPage() {
  const [activeTab, setActiveTab] = useState<HangarTab>("workflows");
  const [workflows, setWorkflows] = useState<N8nWorkflow[]>([]);
  const [executions, setExecutions] = useState<N8nExecution[]>([]);
  const [loading, setLoading] = useState(false);
  const [n8nHealthy, setN8nHealthy] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Builder state
  const [builderQuery, setBuilderQuery] = useState("");
  const [generatedWorkflow, setGeneratedWorkflow] = useState<GeneratedWorkflow | null>(null);
  const [generating, setGenerating] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<{ success: boolean; message: string } | null>(null);

  // Template trigger state
  const [triggeringTemplate, setTriggeringTemplate] = useState<string | null>(null);
  const [triggerResult, setTriggerResult] = useState<{ templateId: string; success: boolean; message: string } | null>(null);

  // ── n8n Health Check ──
  const checkN8nHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/n8n?action=health");
      if (res.ok) {
        const data = await res.json();
        setN8nHealthy(data.healthy);
      } else {
        setN8nHealthy(false);
      }
    } catch {
      setN8nHealthy(false);
    }
  }, []);

  // ── Fetch live workflows from n8n ──
  const fetchWorkflows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/n8n/workflows");
      if (res.ok) {
        const data = await res.json();
        setWorkflows(data.workflows || data.data || []);
      } else {
        setError(`Failed to fetch workflows: ${res.status}`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to n8n");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch recent executions ──
  const fetchExecutions = useCallback(async () => {
    try {
      const res = await fetch("/api/n8n?action=executions&limit=20");
      if (res.ok) {
        const data = await res.json();
        setExecutions(data.executions || data.data || []);
      }
    } catch {
      // Non-critical
    }
  }, []);

  // ── Trigger a workflow template via webhook ──
  const triggerTemplate = useCallback(async (template: WorkflowTemplate) => {
    setTriggeringTemplate(template.id);
    setTriggerResult(null);
    try {
      const res = await fetch("/api/n8n/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "trigger",
          webhookPath: template.webhookPath,
          payload: {
            message: `Execute ${template.name} pipeline`,
            templateId: template.id,
            source: "deployment-hangar",
            timestamp: new Date().toISOString(),
          },
        }),
      });

      const data = await res.json();
      setTriggerResult({
        templateId: template.id,
        success: res.ok,
        message: res.ok
          ? `Triggered ${template.name} — Execution ID: ${data.executionId || "pending"}`
          : data.error || "Trigger failed",
      });

      // Refresh executions
      setTimeout(fetchExecutions, 2000);
    } catch (err: any) {
      setTriggerResult({
        templateId: template.id,
        success: false,
        message: err.message || "Connection failed",
      });
    } finally {
      setTriggeringTemplate(null);
    }
  }, [fetchExecutions]);

  // ── Generate workflow via Juno_Ang (Workflow Smith Squad) ──
  const generateWorkflow = useCallback(async () => {
    if (!builderQuery.trim()) return;
    setGenerating(true);
    setGeneratedWorkflow(null);
    setDeployResult(null);

    try {
      const res = await fetch("/api/n8n/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          query: builderQuery,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedWorkflow(data);
      } else {
        const data = await res.json();
        setError(data.error || "Generation failed");
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate workflow");
    } finally {
      setGenerating(false);
    }
  }, [builderQuery]);

  // ── Deploy generated workflow to n8n ──
  const deployWorkflow = useCallback(async () => {
    if (!generatedWorkflow) return;
    setDeploying(true);
    setDeployResult(null);

    try {
      const res = await fetch("/api/n8n/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "deploy",
          workflow: generatedWorkflow.workflowJson,
        }),
      });

      const data = await res.json();
      setDeployResult({
        success: res.ok,
        message: res.ok
          ? `Deployed to n8n — Workflow ID: ${data.id || data.workflowId || "created"}`
          : data.error || "Deploy failed",
      });

      if (res.ok) fetchWorkflows();
    } catch (err: any) {
      setDeployResult({ success: false, message: err.message || "Deploy failed" });
    } finally {
      setDeploying(false);
    }
  }, [generatedWorkflow, fetchWorkflows]);

  // ── Initial load ──
  useEffect(() => {
    checkN8nHealth();
    fetchWorkflows();
    fetchExecutions();
  }, [checkN8nHealth, fetchWorkflows, fetchExecutions]);

  const tabs: { id: HangarTab; label: string; icon: React.ElementType }[] = [
    { id: "workflows", label: "Workflows", icon: Workflow },
    { id: "builder", label: "Builder", icon: Plus },
    { id: "executions", label: "Executions", icon: Activity },
    { id: "crew", label: "Crew", icon: Users },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      {/* Header */}
      <header className="flex items-start justify-between">
        <div>
          <p className="text-[0.6rem] uppercase tracking-[0.25em] text-gold/50 mb-1 font-mono">
            n8n Workflow Engine
          </p>
          <h1 className="text-2xl md:text-3xl font-display uppercase tracking-wider text-white">
            Deployment Hangar
          </h1>
          <p className="mt-1 text-xs text-white/40">
            Real workflows. Real execution. Juno_Ang + Workflow Smith Squad.
          </p>
        </div>

        {/* n8n Health Indicator */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-mono uppercase tracking-wider ${
            n8nHealthy === true
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-400"
              : n8nHealthy === false
                ? "border-red-400/30 bg-red-400/10 text-red-400"
                : "border-white/10 bg-white/5 text-white/30"
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${
              n8nHealthy === true ? "bg-emerald-400 animate-pulse" : n8nHealthy === false ? "bg-red-400" : "bg-white/30"
            }`} />
            {n8nHealthy === true ? "n8n online" : n8nHealthy === false ? "n8n offline" : "checking..."}
          </div>
          <button
            onClick={() => { checkN8nHealth(); fetchWorkflows(); fetchExecutions(); }}
            className="p-2 rounded-xl border border-wireframe-stroke bg-[#0A0A0A]/60 text-white/40 hover:text-gold hover:border-gold/20 transition-all"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="flex gap-1 rounded-2xl border border-wireframe-stroke bg-[#0A0A0A]/60 p-1.5 backdrop-blur-2xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === tab.id
                ? "bg-gold text-black shadow-[0_0_15px_rgba(251,191,36,0.2)]"
                : "text-white/40 hover:text-white hover:bg-white/5"
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3">
          <AlertTriangle size={16} className="text-red-400" />
          <span className="text-sm text-red-400">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400/60 hover:text-red-400">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* ── WORKFLOWS TAB ── */}
        {activeTab === "workflows" && (
          <motion.div key="workflows" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-6">
            {/* Template Gallery */}
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80 mb-4">
                Workflow Templates
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {WORKFLOW_TEMPLATES.map((template) => (
                  <div
                    key={template.id}
                    className="group relative overflow-hidden rounded-3xl border border-wireframe-stroke bg-[#0A0A0A]/60 p-6 backdrop-blur-2xl hover:border-gold/20 transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${CATEGORY_COLORS[template.category]}`}>
                        {template.category}
                      </span>
                      <span className="text-[10px] text-white/30 font-mono">{template.nodeCount} nodes</span>
                    </div>

                    <h3 className="text-sm font-semibold text-white mb-2">{template.name}</h3>
                    <p className="text-xs text-white/40 leading-relaxed mb-4">{template.description}</p>

                    {/* Crew */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {template.crew.map((member) => (
                        <span key={member} className="text-[9px] text-gold/60 bg-gold/5 border border-gold/10 rounded-full px-2 py-0.5">
                          {member}
                        </span>
                      ))}
                    </div>

                    {/* Trigger Result */}
                    {triggerResult?.templateId === template.id && (
                      <div className={`mb-3 rounded-lg p-2 text-[10px] ${
                        triggerResult.success ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20" : "bg-red-400/10 text-red-400 border border-red-400/20"
                      }`}>
                        {triggerResult.message}
                      </div>
                    )}

                    {/* Trigger Button */}
                    <button
                      onClick={() => triggerTemplate(template)}
                      disabled={triggeringTemplate === template.id || n8nHealthy === false}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-gold/10 border border-gold/20 py-2.5 text-xs font-medium text-gold hover:bg-gold hover:text-black transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {triggeringTemplate === template.id ? (
                        <><Loader2 size={12} className="animate-spin" /> Triggering...</>
                      ) : (
                        <><Play size={12} /> Trigger Workflow</>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Live n8n Workflows */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80">
                  Live n8n Workflows
                </h2>
                <button
                  onClick={fetchWorkflows}
                  disabled={loading}
                  className="flex items-center gap-1.5 text-[10px] text-white/40 hover:text-gold transition-colors"
                >
                  <RefreshCw size={10} className={loading ? "animate-spin" : ""} />
                  Refresh
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12 text-white/20">
                  <Loader2 size={20} className="animate-spin" />
                </div>
              ) : workflows.length > 0 ? (
                <div className="space-y-2">
                  {workflows.map((wf) => (
                    <div
                      key={wf.id}
                      className="flex items-center justify-between rounded-2xl border border-wireframe-stroke bg-[#0A0A0A]/60 px-5 py-3.5 backdrop-blur-2xl hover:border-gold/10 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${wf.active ? "bg-emerald-400 animate-pulse" : "bg-white/20"}`} />
                        <div>
                          <p className="text-sm font-medium text-white">{wf.name}</p>
                          <p className="text-[10px] text-white/30 font-mono">ID: {wf.id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          wf.active ? "border-emerald-400/30 text-emerald-400 bg-emerald-400/10" : "border-white/10 text-white/30 bg-white/5"
                        }`}>
                          {wf.active ? "Active" : "Inactive"}
                        </span>
                        <span className="text-[10px] text-white/20 font-mono">
                          {new Date(wf.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-white/20">
                  <Workflow size={32} className="mb-3 text-white/10" />
                  <p className="text-sm">No workflows found on n8n</p>
                  <p className="text-xs text-white/10 mt-1">
                    {n8nHealthy === false ? "n8n is offline — check your VPS" : "Deploy a template to get started"}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── BUILDER TAB ── */}
        {activeTab === "builder" && (
          <motion.div key="builder" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-6">
            <div className="rounded-3xl border border-wireframe-stroke bg-[#0A0A0A]/60 p-6 backdrop-blur-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gold/10 text-gold">
                  <FileJson size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">Workflow Builder</h2>
                  <p className="text-[10px] text-white/40">
                    Powered by Juno_Ang + Workflow Smith Squad (AUTHOR → VALIDATE → FAILURE → GATE)
                  </p>
                </div>
              </div>

              {/* Builder Input */}
              <div className="relative mb-4">
                <textarea
                  value={builderQuery}
                  onChange={(e) => setBuilderQuery(e.target.value)}
                  placeholder="Describe the workflow you need... e.g. 'Ingest CSV athlete data, enrich with Brave Search, grade and rank, then publish cards to CDN'"
                  rows={3}
                  className="w-full rounded-xl border border-wireframe-stroke bg-black/80 p-4 text-sm text-white outline-none focus:border-gold/40 placeholder:text-white/20 resize-none"
                />
              </div>

              <button
                onClick={generateWorkflow}
                disabled={generating || !builderQuery.trim()}
                className="flex items-center justify-center gap-2 rounded-xl bg-gold py-3 px-6 text-sm font-bold text-black transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <><Loader2 size={14} className="animate-spin" /> Generating via Workflow Smith Squad...</>
                ) : (
                  <><Zap size={14} /> Generate Workflow</>
                )}
              </button>
            </div>

            {/* Generated Workflow Result */}
            {generatedWorkflow && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Manifest */}
                <div className="rounded-3xl border border-wireframe-stroke bg-[#0A0A0A]/60 p-6 backdrop-blur-2xl">
                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <FileJson size={14} className="text-gold" />
                    {generatedWorkflow.manifest.name}
                  </h3>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-white/30">Nodes</p>
                      <p className="text-sm text-white font-mono">{generatedWorkflow.manifest.nodeCount}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-white/30">Dependencies</p>
                      <p className="text-sm text-white font-mono">{generatedWorkflow.manifest.dependencies.join(", ") || "None"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-white/30">Secrets Required</p>
                      <p className="text-sm text-white font-mono">{generatedWorkflow.manifest.secretsRequired.join(", ") || "None"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-white/30">Gate Status</p>
                      <p className={`text-sm font-mono font-bold ${generatedWorkflow.gate.approved ? "text-emerald-400" : "text-red-400"}`}>
                        {generatedWorkflow.gate.approved ? "APPROVED" : "BLOCKED"}
                      </p>
                    </div>
                  </div>

                  {/* Validation */}
                  <div className="flex items-center gap-2 mb-3">
                    <Shield size={12} className={generatedWorkflow.validation.valid ? "text-emerald-400" : "text-red-400"} />
                    <span className={`text-xs ${generatedWorkflow.validation.valid ? "text-emerald-400" : "text-red-400"}`}>
                      Validation: {generatedWorkflow.validation.valid ? "PASS" : `FAIL (${generatedWorkflow.validation.issues.length} issues)`}
                    </span>
                  </div>

                  {/* Failure Analysis */}
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle size={12} className="text-amber-400" />
                    <span className="text-xs text-amber-400">
                      {generatedWorkflow.failures.length} failure paths identified
                      ({generatedWorkflow.failures.filter(f => f.impact === "CRITICAL").length} critical)
                    </span>
                  </div>

                  {/* Gate Issues */}
                  {generatedWorkflow.gate.reasons.length > 0 && (
                    <div className="rounded-xl bg-red-400/5 border border-red-400/20 p-3 mb-4">
                      <p className="text-[10px] uppercase tracking-wider text-red-400 mb-2">Gate Blockers</p>
                      {generatedWorkflow.gate.reasons.map((reason, i) => (
                        <p key={i} className="text-xs text-red-400/80 flex items-center gap-1.5">
                          <X size={10} /> {reason}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* JSON Preview */}
                  <details className="group">
                    <summary className="flex items-center gap-2 cursor-pointer text-xs text-white/40 hover:text-gold transition-colors">
                      <ChevronRight size={12} className="group-open:rotate-90 transition-transform" />
                      View Workflow JSON
                    </summary>
                    <pre className="mt-3 rounded-xl bg-black/80 border border-wireframe-stroke p-4 text-xs text-white/60 font-mono overflow-x-auto max-h-64">
                      {JSON.stringify(generatedWorkflow.workflowJson, null, 2)}
                    </pre>
                  </details>
                </div>

                {/* Deploy Button */}
                {deployResult && (
                  <div className={`rounded-xl p-3 text-sm ${
                    deployResult.success
                      ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20"
                      : "bg-red-400/10 text-red-400 border border-red-400/20"
                  }`}>
                    {deployResult.success ? <Check size={14} className="inline mr-2" /> : <X size={14} className="inline mr-2" />}
                    {deployResult.message}
                  </div>
                )}

                <button
                  onClick={deployWorkflow}
                  disabled={deploying || !generatedWorkflow.gate.approved || n8nHealthy === false}
                  className="w-full flex items-center justify-center gap-3 rounded-2xl bg-gold py-4 text-sm font-bold text-black shadow-[0_0_30px_rgba(251,191,36,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {deploying ? (
                    <><Loader2 size={16} className="animate-spin" /> Deploying to n8n...</>
                  ) : !generatedWorkflow.gate.approved ? (
                    <><Shield size={16} /> Gate Blocked — Resolve Issues First</>
                  ) : n8nHealthy === false ? (
                    <><AlertTriangle size={16} /> n8n Offline — Cannot Deploy</>
                  ) : (
                    <><Rocket size={16} /> Deploy to n8n</>
                  )}
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── EXECUTIONS TAB ── */}
        {activeTab === "executions" && (
          <motion.div key="executions" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80">
                Recent Executions
              </h2>
              <button
                onClick={fetchExecutions}
                className="flex items-center gap-1.5 text-[10px] text-white/40 hover:text-gold transition-colors"
              >
                <RefreshCw size={10} /> Refresh
              </button>
            </div>

            {executions.length > 0 ? (
              <div className="space-y-2">
                {executions.map((exec) => (
                  <div
                    key={exec.id}
                    className="flex items-center justify-between rounded-2xl border border-wireframe-stroke bg-[#0A0A0A]/60 px-5 py-3.5 backdrop-blur-2xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        exec.status === "success" ? "bg-emerald-400"
                          : exec.status === "running" ? "bg-gold animate-pulse"
                          : exec.status === "error" ? "bg-red-400"
                          : "bg-white/20"
                      }`} />
                      <div>
                        <p className="text-sm font-mono text-white">Execution #{exec.id}</p>
                        <p className="text-[10px] text-white/30">Workflow: {exec.workflowId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        exec.status === "success" ? "border-emerald-400/30 text-emerald-400 bg-emerald-400/10"
                          : exec.status === "running" ? "border-gold/30 text-gold bg-gold/10"
                          : exec.status === "error" ? "border-red-400/30 text-red-400 bg-red-400/10"
                          : "border-white/10 text-white/30 bg-white/5"
                      }`}>
                        {exec.status}
                      </span>
                      <span className="text-[10px] text-white/20 font-mono">
                        {new Date(exec.startedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-white/20">
                <Activity size={32} className="mb-3 text-white/10" />
                <p className="text-sm">No recent executions</p>
                <p className="text-xs text-white/10 mt-1">Trigger a workflow to see execution history</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ── CREW TAB ── */}
        {activeTab === "crew" && (
          <motion.div key="crew" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-6">
            {CREW_HIERARCHY.map((tier) => (
              <div key={tier.tier}>
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80">
                    {tier.tier}
                  </h2>
                  <span className="text-[10px] text-white/20 font-mono">{tier.role}</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {tier.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 rounded-2xl border border-wireframe-stroke bg-[#0A0A0A]/60 px-4 py-3 backdrop-blur-2xl"
                    >
                      <div className={`w-2 h-2 rounded-full ${
                        member.status === "active" ? "bg-emerald-400 animate-pulse" : "bg-white/20"
                      }`} />
                      <div>
                        <p className="text-sm font-medium text-white">{member.name}</p>
                        <p className="text-[10px] text-white/30">{member.office}</p>
                      </div>
                      <span className={`ml-auto text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        member.status === "active"
                          ? "border-emerald-400/30 text-emerald-400 bg-emerald-400/10"
                          : "border-white/10 text-white/30 bg-white/5"
                      }`}>
                        {member.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
