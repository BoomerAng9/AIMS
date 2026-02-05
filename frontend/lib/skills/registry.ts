// Skills Registry — central index for all Hooks, Tasks, and Skills.
// The ACHEEVY trigger engine scans this registry when classifying user intent.
// Mirrors the Plug Registry pattern from lib/plugs/registry.ts.

export type SkillType = "hook" | "task" | "skill";
export type SkillStatus = "active" | "beta" | "disabled";

export interface SkillDefinition {
  id: string;
  name: string;
  type: SkillType;
  status: SkillStatus;
  triggers: string[];
  description: string;
  execution: {
    target: "api" | "cli" | "persona" | "internal";
    route?: string;
    command?: string;
  };
  priority: "critical" | "high" | "medium" | "low";
  definitionFile: string;
  icon: string;
  color: string;
}

// ─── Full Registry ───────────────────────────────────────────

export const SKILL_REGISTRY: SkillDefinition[] = [
  // ── HOOKS ──────────────────────────────────────────────────
  {
    id: "plug-protocol",
    name: "Plug Protocol",
    type: "hook",
    status: "active",
    triggers: ["build", "spin up", "create", "deploy", "launch", "start", "fabricate", "scaffold"],
    description: "Intercepts build/deploy requests and routes them through the Plug Registry.",
    execution: { target: "internal", route: "/api/plugs/[plugId]" },
    priority: "critical",
    definitionFile: "aims-skills/hooks/plug-protocol.md",
    icon: "plug",
    color: "amber",
  },
  {
    id: "docker-compose",
    name: "Docker Compose Orchestration",
    type: "hook",
    status: "active",
    triggers: ["docker", "container", "compose", "service", "infrastructure", "provision", "vps", "hostinger"],
    description: "Manages Docker Compose services on Hostinger VPS.",
    execution: { target: "cli", command: "docker compose -f infra/docker-compose.yml" },
    priority: "high",
    definitionFile: "aims-skills/hooks/docker-compose.md",
    icon: "container",
    color: "blue",
  },
  {
    id: "github-ops",
    name: "GitHub Operations",
    type: "hook",
    status: "active",
    triggers: ["pr", "pull request", "merge", "branch", "commit", "github", "push", "review", "release"],
    description: "Enforces PR/merge/branch best practices aligned with ORACLE gates.",
    execution: { target: "cli", command: "gh" },
    priority: "high",
    definitionFile: "aims-skills/hooks/github-ops.md",
    icon: "git-branch",
    color: "violet",
  },

  // ── TASKS ──────────────────────────────────────────────────
  {
    id: "remotion",
    name: "Remotion Video Generator",
    type: "task",
    status: "active",
    triggers: ["video", "render", "remotion", "composition", "animation", "clip", "footage", "motion"],
    description: "Generate and render video compositions using Remotion with Gemini scripts.",
    execution: { target: "api", route: "/api/skills/remotion" },
    priority: "medium",
    definitionFile: "aims-skills/tasks/remotion.md",
    icon: "video",
    color: "pink",
  },
  {
    id: "gemini-research",
    name: "Gemini Deep Research",
    type: "task",
    status: "active",
    triggers: ["research", "deep research", "analyze", "report", "investigate", "study", "gemini", "findings"],
    description: "Run deep research queries using Gemini with streaming and structured output.",
    execution: { target: "api", route: "/api/research" },
    priority: "high",
    definitionFile: "aims-skills/tasks/gemini-research.md",
    icon: "search",
    color: "cyan",
  },
  {
    id: "n8n-workflow",
    name: "n8n Workflow Automation",
    type: "task",
    status: "active",
    triggers: ["n8n", "workflow", "automation", "automate", "schedule", "cron", "boomer", "boomer_ang"],
    description: "Trigger and manage n8n workflow automations and Boomer_Ang templates.",
    execution: { target: "cli", command: "node scripts/boomer.mjs" },
    priority: "high",
    definitionFile: "aims-skills/tasks/n8n-workflow.md",
    icon: "workflow",
    color: "pink",
  },

  // ── SKILLS ─────────────────────────────────────────────────
  {
    id: "stitch",
    name: "Stitch Design System",
    type: "skill",
    status: "active",
    triggers: ["stitch", "design system", "weave", "persona", "gemini design", "ui design", "design guide"],
    description: "Persona-driven design via Gemini CLI with Nano Banana Pro aesthetic.",
    execution: { target: "cli", command: ". ./stitch.ps1; stitch" },
    priority: "medium",
    definitionFile: "aims-skills/skills/stitch.md",
    icon: "palette",
    color: "emerald",
  },
  {
    id: "nano-banana-pro",
    name: "Nano Banana Pro",
    type: "skill",
    status: "active",
    triggers: ["nano banana", "glassmorphism", "ui architect", "acheevy design", "glass panels", "obsidian gold", "brick and window"],
    description: "UI architect persona enforcing obsidian/gold glassmorphism design language.",
    execution: { target: "persona" },
    priority: "high",
    definitionFile: "aims-skills/skills/nano-banana-pro.md",
    icon: "sparkles",
    color: "amber",
  },
  {
    id: "best-practices",
    name: "Best Practices & Standards",
    type: "skill",
    status: "active",
    triggers: ["prd", "sop", "kpi", "okr", "best practice", "standard", "process", "documentation", "template", "checklist", "procedure"],
    description: "Generate PRDs, SOPs, KPI dashboards, OKR frameworks, and ORACLE-aligned checklists.",
    execution: { target: "api", route: "/api/skills/best-practices" },
    priority: "high",
    definitionFile: "aims-skills/skills/best-practices.md",
    icon: "clipboard-check",
    color: "emerald",
  },
];

// ─── Lookup Helpers ──────────────────────────────────────────

export function findSkillById(id: string): SkillDefinition | undefined {
  return SKILL_REGISTRY.find((s) => s.id === id);
}

export function findSkillByKeywords(query: string): SkillDefinition | null {
  const lower = query.toLowerCase();

  // Skip the plug-protocol hook -- it's handled separately by matchesPlugProtocol()
  const candidates = SKILL_REGISTRY.filter((s) => s.id !== "plug-protocol" && s.status === "active");

  // Score each candidate by number of trigger matches
  let bestMatch: SkillDefinition | null = null;
  let bestScore = 0;

  for (const skill of candidates) {
    let score = 0;
    for (const trigger of skill.triggers) {
      if (lower.includes(trigger)) {
        score += trigger.length; // Longer trigger matches are weighted higher
      }
    }
    // Priority weight boost
    if (score > 0) {
      const priorityBoost = { critical: 100, high: 10, medium: 5, low: 1 };
      score += priorityBoost[skill.priority];
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = skill;
    }
  }

  return bestMatch;
}

export function getSkillsByType(type: SkillType): SkillDefinition[] {
  return SKILL_REGISTRY.filter((s) => s.type === type);
}

export function getAllActiveSkills(): SkillDefinition[] {
  return SKILL_REGISTRY.filter((s) => s.status === "active");
}
