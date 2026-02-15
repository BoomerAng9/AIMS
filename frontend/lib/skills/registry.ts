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
  // ── ACHEEVY REVENUE VERTICALS (Phase 3.5) ────────────────────
  // NLP-triggered business builder verticals with R-R-S execution
  {
    id: "vertical-idea-generator",
    name: "Business Idea Generator",
    type: "skill",
    status: "active",
    triggers: ["business ideas", "startup ideas", "what should i build", "suggest ideas", "start a business", "entrepreneur", "side hustle"],
    description: "Generate and validate business ideas with market research and execution plans.",
    execution: { target: "api", route: "/acheevy/execute" },
    priority: "high",
    definitionFile: "aims-skills/acheevy-verticals/vertical-definitions.ts",
    icon: "lightbulb",
    color: "amber",
  },
  {
    id: "vertical-pain-points",
    name: "Pain Points Deep Dive",
    type: "skill",
    status: "active",
    triggers: ["pain points", "problems in", "market gaps", "customer frustrations"],
    description: "Analyze industry pain points and identify business opportunities.",
    execution: { target: "api", route: "/acheevy/execute" },
    priority: "high",
    definitionFile: "aims-skills/acheevy-verticals/vertical-definitions.ts",
    icon: "target",
    color: "red",
  },
  {
    id: "vertical-brand-name",
    name: "Brand Name Generator",
    type: "skill",
    status: "active",
    triggers: ["brand name", "company name", "what to call", "name business"],
    description: "Generate brand names, check domains, and build brand identity packages.",
    execution: { target: "api", route: "/acheevy/execute" },
    priority: "high",
    definitionFile: "aims-skills/acheevy-verticals/vertical-definitions.ts",
    icon: "tag",
    color: "violet",
  },
  {
    id: "vertical-value-prop",
    name: "Value Proposition Builder",
    type: "skill",
    status: "active",
    triggers: ["value proposition", "why us", "unique selling", "usp"],
    description: "Craft compelling value propositions, landing page copy, and messaging.",
    execution: { target: "api", route: "/acheevy/execute" },
    priority: "high",
    definitionFile: "aims-skills/acheevy-verticals/vertical-definitions.ts",
    icon: "megaphone",
    color: "emerald",
  },
  {
    id: "vertical-mvp-plan",
    name: "MVP Launch Plan",
    type: "skill",
    status: "active",
    triggers: ["mvp", "launch plan", "minimum viable", "get started", "first steps"],
    description: "Generate and execute a complete MVP launch plan with code scaffolding.",
    execution: { target: "api", route: "/acheevy/execute" },
    priority: "high",
    definitionFile: "aims-skills/acheevy-verticals/vertical-definitions.ts",
    icon: "rocket",
    color: "blue",
  },
  {
    id: "vertical-persona",
    name: "Customer Persona Builder",
    type: "skill",
    status: "active",
    triggers: ["target customer", "who buys", "ideal customer", "customer persona", "buyer persona"],
    description: "Build detailed customer personas with journey maps and targeting.",
    execution: { target: "api", route: "/acheevy/execute" },
    priority: "high",
    definitionFile: "aims-skills/acheevy-verticals/vertical-definitions.ts",
    icon: "users",
    color: "cyan",
  },
  {
    id: "vertical-social-hooks",
    name: "Social Launch Campaign",
    type: "skill",
    status: "active",
    triggers: ["launch tweet", "social post", "announce", "twitter hook", "x hook"],
    description: "Create viral social media launch campaigns with content calendars.",
    execution: { target: "api", route: "/acheevy/execute" },
    priority: "high",
    definitionFile: "aims-skills/acheevy-verticals/vertical-definitions.ts",
    icon: "share",
    color: "pink",
  },
  {
    id: "vertical-cold-outreach",
    name: "Cold Outreach Engine",
    type: "skill",
    status: "active",
    triggers: ["cold email", "outreach", "pitch email", "reach out"],
    description: "Generate multi-touch outreach sequences with email and LinkedIn templates.",
    execution: { target: "api", route: "/acheevy/execute" },
    priority: "high",
    definitionFile: "aims-skills/acheevy-verticals/vertical-definitions.ts",
    icon: "mail",
    color: "amber",
  },
  {
    id: "vertical-automation",
    name: "Task Automation Builder",
    type: "skill",
    status: "active",
    triggers: ["automate", "save time", "streamline", "repetitive tasks"],
    description: "Build workflow automations connecting your existing tools.",
    execution: { target: "api", route: "/acheevy/execute" },
    priority: "high",
    definitionFile: "aims-skills/acheevy-verticals/vertical-definitions.ts",
    icon: "zap",
    color: "yellow",
  },
  {
    id: "vertical-content-calendar",
    name: "Content Calendar Generator",
    type: "skill",
    status: "active",
    triggers: ["content plan", "posting schedule", "content calendar", "social media plan"],
    description: "Generate 30-day content calendars with copy and scheduling.",
    execution: { target: "api", route: "/acheevy/execute" },
    priority: "high",
    definitionFile: "aims-skills/acheevy-verticals/vertical-definitions.ts",
    icon: "calendar",
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
