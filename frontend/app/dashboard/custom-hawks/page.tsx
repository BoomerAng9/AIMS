'use client';

/**
 * /dashboard/custom-hawks — Custom Lil_Hawks Creator & Manager
 *
 * Create, configure, and manage user-defined Lil_Hawks.
 * "Lil_Increase_My_Money_Hawk", "Lil_Grade_My_Essay_Hawk", etc.
 *
 * Users pick a domain, name their hawk, define capabilities,
 * select tools, and set autonomy level and budget cap.
 */

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Types ────────────────────────────────────────────────────

type HawkDomain =
  | 'trading' | 'research' | 'content' | 'code' | 'automation'
  | 'education' | 'marketing' | 'data' | 'communication' | 'creative' | 'custom';

type HawkTool =
  | 'web_search' | 'web_scrape' | 'code_sandbox' | 'llm_chat'
  | 'file_generate' | 'email_send' | 'telegram_send' | 'discord_send'
  | 'n8n_workflow' | 'data_analyze' | 'image_generate' | 'video_generate'
  | 'calendar' | 'crm_update';

type AutonomyLevel = 'manual' | 'semi-auto' | 'full-auto';

interface HawkRecord {
  hawkId: string;
  hawkName: string;
  spec: {
    name: string;
    purpose: string;
    domain: HawkDomain;
    capabilities: string[];
    tools: HawkTool[];
    budgetCapUsd: number;
    autonomyLevel: AutonomyLevel;
  };
  supervisorAng: string;
  status: 'draft' | 'active' | 'paused' | 'retired';
  stats: {
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    totalCostUsd: number;
    lastRunAt: string | null;
  };
  createdAt: string;
}

// ── Domain Config ────────────────────────────────────────────

const DOMAINS: Array<{ id: HawkDomain; name: string; icon: string; color: string; examples: string[] }> = [
  { id: 'trading', name: 'Trading & Finance', icon: '$', color: 'text-green-400 bg-green-500/10 border-green-500/20', examples: ['Portfolio tracker', 'Alert bot', 'News scanner'] },
  { id: 'research', name: 'Research', icon: 'R', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', examples: ['Competitor intel', 'Market analysis', 'Patent search'] },
  { id: 'content', name: 'Content & Writing', icon: 'W', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', examples: ['Blog writer', 'Newsletter curator', 'SEO copy'] },
  { id: 'code', name: 'Code & Engineering', icon: '< >', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', examples: ['Code reviewer', 'Bug finder', 'API tester'] },
  { id: 'automation', name: 'Automation', icon: 'A', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20', examples: ['Email sorter', 'Data sync', 'Report gen'] },
  { id: 'education', name: 'Education', icon: 'E', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', examples: ['Essay grader', 'Quiz maker', 'Tutor bot'] },
  { id: 'marketing', name: 'Marketing', icon: 'M', color: 'text-pink-400 bg-pink-500/10 border-pink-500/20', examples: ['Ad copy', 'Campaign tracker', 'Lead gen'] },
  { id: 'data', name: 'Data & Analytics', icon: 'D', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20', examples: ['Data cleaner', 'Viz builder', 'ETL bot'] },
  { id: 'communication', name: 'Communication', icon: 'C', color: 'text-teal-400 bg-teal-500/10 border-teal-500/20', examples: ['Email drafter', 'Meeting scheduler', 'Follow-up bot'] },
  { id: 'creative', name: 'Creative', icon: 'X', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', examples: ['Image gen', 'Video creator', 'Design helper'] },
];

const AVAILABLE_TOOLS: Array<{ id: HawkTool; name: string; description: string }> = [
  { id: 'web_search', name: 'Web Search', description: 'Search the web for information' },
  { id: 'web_scrape', name: 'Web Scrape', description: 'Extract data from websites' },
  { id: 'code_sandbox', name: 'Code Sandbox', description: 'Execute code in isolated sandbox' },
  { id: 'llm_chat', name: 'AI Chat', description: 'Conversational AI capabilities' },
  { id: 'file_generate', name: 'File Generation', description: 'Create documents and exports' },
  { id: 'email_send', name: 'Email', description: 'Send email notifications' },
  { id: 'telegram_send', name: 'Telegram', description: 'Send Telegram messages' },
  { id: 'discord_send', name: 'Discord', description: 'Send Discord messages' },
  { id: 'n8n_workflow', name: 'Workflows', description: 'Trigger n8n automation workflows' },
  { id: 'data_analyze', name: 'Data Analysis', description: 'Analyze and visualize data' },
  { id: 'image_generate', name: 'Image Gen', description: 'Generate images from prompts' },
  { id: 'calendar', name: 'Calendar', description: 'Manage calendar events' },
  { id: 'crm_update', name: 'CRM', description: 'Update CRM records' },
];

// ── Hawk Card Component ──────────────────────────────────────

function HawkCard({ hawk, onActivate, onPause, onDelete }: {
  hawk: HawkRecord;
  onActivate: () => void;
  onPause: () => void;
  onDelete: () => void;
}) {
  const domain = DOMAINS.find(d => d.id === hawk.spec.domain);
  const statusColor = {
    draft: 'text-zinc-500 bg-[#18181B]',
    active: 'text-green-400 bg-green-500/10',
    paused: 'text-yellow-400 bg-yellow-500/10',
    retired: 'text-red-400 bg-red-500/10',
  }[hawk.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="wireframe-card rounded-xl p-4 hover:border-white/10 transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${domain?.color || 'bg-[#18181B]'}`}>
            <span className="text-sm font-bold">{domain?.icon || '?'}</span>
          </div>
          <div>
            <h3 className="text-sm font-medium text-zinc-200">{hawk.hawkName}</h3>
            <p className="text-xs text-zinc-500">{hawk.spec.purpose}</p>
          </div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor}`}>
          {hawk.status.toUpperCase()}
        </span>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-3 text-xs text-zinc-500 font-mono">
        <span>{hawk.stats.totalRuns} runs</span>
        <span className="text-green-400/60">{hawk.stats.successfulRuns} ok</span>
        {hawk.stats.failedRuns > 0 && <span className="text-red-400/60">{hawk.stats.failedRuns} fail</span>}
        <span>${hawk.stats.totalCostUsd.toFixed(2)} spent</span>
      </div>

      {/* Tools badges */}
      <div className="flex flex-wrap gap-1 mb-3">
        {hawk.spec.tools.slice(0, 5).map(t => (
          <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-[#18181B] text-zinc-500">
            {AVAILABLE_TOOLS.find(at => at.id === t)?.name || t}
          </span>
        ))}
        {hawk.spec.tools.length > 5 && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-[#18181B] text-zinc-600">+{hawk.spec.tools.length - 5}</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-white/8">
        {hawk.status !== 'active' && (
          <button onClick={onActivate} className="text-xs px-3 py-1 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors">
            Activate
          </button>
        )}
        {hawk.status === 'active' && (
          <button onClick={onPause} className="text-xs px-3 py-1 rounded-lg bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition-colors">
            Pause
          </button>
        )}
        <button onClick={onDelete} className="text-xs px-3 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors ml-auto">
          Delete
        </button>
        <span className="text-xs text-zinc-600">{hawk.supervisorAng}</span>
      </div>
    </motion.div>
  );
}

// ── Hawk Creator Form ────────────────────────────────────────

function HawkCreator({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) {
  const [step, setStep] = useState(0);
  const [domain, setDomain] = useState<HawkDomain | null>(null);
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [tools, setTools] = useState<HawkTool[]>(['llm_chat']);
  const [autonomy, setAutonomy] = useState<AutonomyLevel>('semi-auto');
  const [budget, setBudget] = useState(5);
  const [creating, setCreating] = useState(false);

  const hawkName = name ? `Lil_${name.replace(/\s+/g, '_')}_Hawk` : '';

  const toggleTool = (tool: HawkTool) => {
    setTools(prev => prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool]);
  };

  const handleCreate = async () => {
    if (!domain || !name || !purpose) return;
    setCreating(true);
    try {
      const res = await fetch('/api/custom-hawks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'web-user',
          spec: {
            name: hawkName,
            purpose,
            domain,
            capabilities: [purpose],
            tools,
            budgetCapUsd: budget,
            autonomyLevel: autonomy,
          },
        }),
      });
      if (res.ok) onCreated();
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="wireframe-card rounded-xl overflow-hidden">
      {/* Progress steps */}
      <div className="flex items-center gap-0 border-b border-white/8">
        {['Domain', 'Name & Purpose', 'Tools', 'Configure'].map((label, i) => (
          <button
            key={label}
            onClick={() => { if (i < step) setStep(i); }}
            className={`flex-1 px-4 py-3 text-xs font-medium transition-colors
              ${i === step ? 'text-gold bg-gold/5 border-b-2 border-gold' : i < step ? 'text-zinc-400 hover:text-zinc-300' : 'text-zinc-600'}
            `}
          >
            {i + 1}. {label}
          </button>
        ))}
      </div>

      <div className="p-6">
        <AnimatePresence mode="wait">
          {/* Step 0: Domain */}
          {step === 0 && (
            <motion.div key="domain" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h3 className="text-sm font-medium text-zinc-300 mb-4">What domain should your hawk specialize in?</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {DOMAINS.map(d => (
                  <button
                    key={d.id}
                    onClick={() => { setDomain(d.id); setStep(1); }}
                    className={`p-3 rounded-xl border transition-all text-left
                      ${domain === d.id ? d.color + ' border' : 'border-white/8 hover:border-white/10 bg-[#111113]'}
                    `}
                  >
                    <span className="text-lg font-bold">{d.icon}</span>
                    <p className="text-xs font-medium text-zinc-400 mt-1">{d.name}</p>
                    <p className="text-xs text-zinc-600 mt-0.5">{d.examples.join(', ')}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 1: Name & Purpose */}
          {step === 1 && (
            <motion.div key="name" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Hawk Name</label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-zinc-500 font-mono">Lil_</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Increase_My_Money"
                    maxLength={40}
                    className="flex-1 bg-[#111113] border border-white/8 rounded-lg px-3 py-2 text-sm text-zinc-300 outline-none focus:border-gold/30"
                  />
                  <span className="text-sm text-zinc-500 font-mono">_Hawk</span>
                </div>
                {hawkName && (
                  <p className="text-xs text-gold/50 mt-1 font-mono">{hawkName}</p>
                )}
              </div>

              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Purpose</label>
                <textarea
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Describe what this hawk should do in plain English..."
                  rows={3}
                  maxLength={500}
                  className="w-full mt-1 bg-[#111113] border border-white/8 rounded-lg px-3 py-2 text-sm text-zinc-300 outline-none resize-none focus:border-gold/30"
                />
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!name.trim() || !purpose.trim()}
                className="px-4 py-2 rounded-lg bg-gold/20 text-gold border border-gold/20 text-sm font-medium hover:bg-gold/30 transition-all disabled:opacity-30"
              >
                Next: Select Tools
              </button>
            </motion.div>
          )}

          {/* Step 2: Tools */}
          {step === 2 && (
            <motion.div key="tools" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h3 className="text-sm font-medium text-zinc-300 mb-4">What tools can {hawkName || 'your hawk'} use?</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {AVAILABLE_TOOLS.map(tool => (
                  <button
                    key={tool.id}
                    onClick={() => toggleTool(tool.id)}
                    className={`p-3 rounded-xl border transition-all text-left
                      ${tools.includes(tool.id)
                        ? 'border-gold/30 bg-gold/5'
                        : 'border-white/8 hover:border-white/10 bg-[#111113]'
                      }
                    `}
                  >
                    <p className="text-xs font-medium text-zinc-400">{tool.name}</p>
                    <p className="text-xs text-zinc-600 mt-0.5">{tool.description}</p>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep(3)}
                disabled={tools.length === 0}
                className="mt-4 px-4 py-2 rounded-lg bg-gold/20 text-gold border border-gold/20 text-sm font-medium hover:bg-gold/30 transition-all disabled:opacity-30"
              >
                Next: Configure
              </button>
            </motion.div>
          )}

          {/* Step 3: Configure & Create */}
          {step === 3 && (
            <motion.div key="config" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Autonomy Level</label>
                <div className="flex gap-2 mt-1">
                  {([
                    { id: 'manual' as const, label: 'Manual', desc: 'Approve each action' },
                    { id: 'semi-auto' as const, label: 'Semi-Auto', desc: 'Auto within budget' },
                    { id: 'full-auto' as const, label: 'Full Auto', desc: 'Run freely' },
                  ]).map(a => (
                    <button
                      key={a.id}
                      onClick={() => setAutonomy(a.id)}
                      className={`flex-1 p-3 rounded-xl border transition-all text-center
                        ${autonomy === a.id ? 'border-gold/30 bg-gold/5' : 'border-white/8 bg-[#111113]'}
                      `}
                    >
                      <p className="text-xs font-medium text-zinc-400">{a.label}</p>
                      <p className="text-xs text-zinc-600">{a.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                  Budget Cap: ${budget}/run
                </label>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full mt-1"
                />
                <div className="flex justify-between text-xs text-zinc-600">
                  <span>$1</span>
                  <span>$50</span>
                </div>
              </div>

              {/* Summary */}
              <div className="wireframe-card rounded-xl p-4 bg-[#111113]">
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2">Summary</p>
                <div className="space-y-1 text-sm text-zinc-400">
                  <p><span className="text-zinc-500">Name:</span> <span className="font-mono text-gold">{hawkName}</span></p>
                  <p><span className="text-zinc-500">Domain:</span> {DOMAINS.find(d => d.id === domain)?.name}</p>
                  <p><span className="text-zinc-500">Tools:</span> {tools.length} selected</p>
                  <p><span className="text-zinc-500">Autonomy:</span> {autonomy}</p>
                  <p><span className="text-zinc-500">Budget:</span> ${budget}/run</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={onCancel}
                  className="px-4 py-2 rounded-lg border border-white/10 text-zinc-500 text-sm hover:text-zinc-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex-1 px-4 py-2 rounded-lg bg-gold/20 text-gold border border-gold/20 text-sm font-medium hover:bg-gold/30 transition-all disabled:opacity-30"
                >
                  {creating ? 'Creating...' : `Create ${hawkName}`}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────

export default function CustomHawksPage() {
  const [hawks, setHawks] = useState<HawkRecord[]>([]);
  const [showCreator, setShowCreator] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchHawks = useCallback(async () => {
    try {
      const res = await fetch('/api/custom-hawks?userId=web-user');
      if (res.ok) {
        const data = await res.json();
        setHawks(data.hawks || []);
      }
    } catch {
      // Silently handle — may not be connected to gateway
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHawks(); }, [fetchHawks]);

  const handleStatusChange = async (hawkId: string, status: 'active' | 'paused') => {
    await fetch(`/api/custom-hawks/${hawkId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'web-user', status }),
    });
    fetchHawks();
  };

  const handleDelete = async (hawkId: string) => {
    if (!confirm('Are you sure you want to delete this hawk?')) return;
    await fetch(`/api/custom-hawks/${hawkId}?userId=web-user`, { method: 'DELETE' });
    fetchHawks();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Custom Lil_Hawks</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Create your own AI agents with custom names, tools, and specialties</p>
        </div>
        <button
          onClick={() => setShowCreator(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold/20 text-gold border border-gold/20 text-sm font-medium hover:bg-gold/30 transition-all"
        >
          <span className="text-lg leading-none">+</span>
          Create Hawk
        </button>
      </div>

      {/* Creator */}
      <AnimatePresence>
        {showCreator && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <HawkCreator
              onCreated={() => { setShowCreator(false); fetchHawks(); }}
              onCancel={() => setShowCreator(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hawks Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 mx-auto border-2 border-gold border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-zinc-500 mt-3">Loading hawks...</p>
        </div>
      ) : hawks.length === 0 && !showCreator ? (
        <div className="wireframe-card rounded-xl p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center">
            <span className="text-2xl font-bold text-gold">H</span>
          </div>
          <h3 className="text-base font-medium text-zinc-300 mb-2">No Custom Hawks Yet</h3>
          <p className="text-sm text-zinc-500 mb-6 max-w-sm mx-auto">
            Create your first custom Lil_Hawk to automate tasks, run research, generate content, and more.
          </p>
          <button
            onClick={() => setShowCreator(true)}
            className="px-5 py-2.5 rounded-xl bg-gold/20 text-gold border border-gold/20 text-sm font-medium hover:bg-gold/30 transition-all"
          >
            Create Your First Hawk
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hawks.map(hawk => (
            <HawkCard
              key={hawk.hawkId}
              hawk={hawk}
              onActivate={() => handleStatusChange(hawk.hawkId, 'active')}
              onPause={() => handleStatusChange(hawk.hawkId, 'paused')}
              onDelete={() => handleDelete(hawk.hawkId)}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
