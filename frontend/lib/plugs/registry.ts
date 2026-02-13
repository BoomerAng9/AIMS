// Plug Registry — central source of truth for all deployable Plugs.
// The Plug Protocol hook routes build/create/deploy requests through this registry
// before any code generation happens.

export type PlugStatus = "active" | "coming-soon" | "beta" | "deprecated";
export type PlugTier = "free" | "starter" | "pro" | "enterprise";

export interface PlugDefinition {
  id: string;
  name: string;
  slug: string;
  vertical: string;
  type: string;
  description: string;
  longDescription: string;
  icon: string; // lucide icon name
  status: PlugStatus;
  tier: PlugTier;
  infrastructure: string[];
  features: string[];
  color: string; // tailwind color prefix (e.g. "amber", "emerald", "cyan")
  priority: "critical" | "high" | "medium" | "low";
  definitionFile: string; // path in aiPLUGS/ directory
}

// ─── Plug Catalog ────────────────────────────────────────────
// Each entry corresponds to a Plug definition in the aiPLUGS/ directory.
// When a user says "build X" or "deploy X," ACHEEVY searches this registry
// to find the matching Plug and load its full definition.

export const PLUG_REGISTRY: PlugDefinition[] = [
  {
    id: "perform",
    name: "Perform",
    slug: "perform",
    vertical: "Sports Analytics",
    type: "Full-Stack Platform",
    description: "AI-powered athlete scouting, video analysis, and recruitment pipeline.",
    longDescription:
      "Perform is the flagship sports analytics plug. It connects coaches, scouts, and recruiters with AI-powered athlete evaluation — from raw stats to scouting narratives, video timestamp analysis, and kanban-style recruitment boards.",
    icon: "trophy",
    status: "active",
    tier: "pro",
    infrastructure: ["Next.js", "Firestore", "Vertex AI", "OpenRouter"],
    features: [
      "Athlete database with scout grades",
      "AI-generated scouting reports",
      "Video analysis with timestamps",
      "Recruitment pipeline (kanban)",
      "Stat comparison charts",
      "Grade distribution analytics",
    ],
    color: "amber",
    priority: "critical",
    definitionFile: "perform_plug.md",
  },
  {
    id: "flip-scorecard",
    name: "Flip Scorecard",
    slug: "flip-scorecard",
    vertical: "Real Estate",
    type: "Calculator",
    description: "Calculates ROI for house flipping based on repair costs and ARV.",
    longDescription:
      "A real estate investment calculator that factors in purchase price, renovation budget, holding costs, and After Repair Value to produce projected ROI and profit margins.",
    icon: "calculator",
    status: "coming-soon",
    tier: "starter",
    infrastructure: ["Next.js", "Postgres"],
    features: ["ROI calculation", "Cost breakdown", "PDF export", "CTA funnel"],
    color: "emerald",
    priority: "high",
    definitionFile: "",
  },
  {
    id: "lease-analyzer",
    name: "Lease Analyzer",
    slug: "lease-analyzer",
    vertical: "Real Estate",
    type: "Document Analysis",
    description: "Extracts key terms and risks from lease PDFs.",
    longDescription:
      "Upload any lease document and get AI-extracted key terms, risk flags, renewal clauses, and a plain-English summary of obligations.",
    icon: "file-search",
    status: "coming-soon",
    tier: "pro",
    infrastructure: ["Agent Zero", "OCR", "Vertex AI"],
    features: ["PDF parsing", "Risk flagging", "Term extraction", "Summary generation"],
    color: "blue",
    priority: "high",
    definitionFile: "",
  },
  {
    id: "auto-invite",
    name: "Auto-Invite Bot",
    slug: "auto-invite",
    vertical: "Growth",
    type: "Workflow",
    description: "Scrapes local businesses and sends partner invites.",
    longDescription:
      "Automated outreach engine that discovers local businesses via directory scraping and sends personalized partner invitation sequences.",
    icon: "mail",
    status: "coming-soon",
    tier: "pro",
    infrastructure: ["SendGrid", "n8n"],
    features: ["Directory scraping", "Auto-sequencing", "Template management", "Analytics"],
    color: "pink",
    priority: "high",
    definitionFile: "",
  },
  {
    id: "market-intel",
    name: "Market Intel Report",
    slug: "market-intel",
    vertical: "Marketing",
    type: "Research Agent",
    description: "Monthly report on industry trends from Reddit/LinkedIn.",
    longDescription:
      "AI research agent that monitors Reddit, LinkedIn, and industry forums to compile monthly trend reports with actionable insights.",
    icon: "bar-chart-3",
    status: "coming-soon",
    tier: "starter",
    infrastructure: ["n8n", "Perplexity", "OpenRouter"],
    features: ["Trend monitoring", "Source aggregation", "Monthly reports", "Alert triggers"],
    color: "violet",
    priority: "high",
    definitionFile: "",
  },
];

// ─── Lookup Helpers ──────────────────────────────────────────

export function findPlugById(id: string): PlugDefinition | undefined {
  return PLUG_REGISTRY.find((p) => p.id === id || p.slug === id);
}

export function findPlugByKeywords(query: string): PlugDefinition | undefined {
  const lower = query.toLowerCase();
  // Direct name/slug match first
  const direct = PLUG_REGISTRY.find(
    (p) => lower.includes(p.slug) || lower.includes(p.name.toLowerCase())
  );
  if (direct) return direct;

  // Keyword match against vertical + description
  return PLUG_REGISTRY.find(
    (p) =>
      lower.includes(p.vertical.toLowerCase()) ||
      p.features.some((f) => lower.includes(f.toLowerCase().split(" ")[0]))
  );
}

export function getActivePlugs(): PlugDefinition[] {
  return PLUG_REGISTRY.filter((p) => p.status === "active");
}

export function getPlugsByTier(tier: PlugTier): PlugDefinition[] {
  return PLUG_REGISTRY.filter((p) => p.tier === tier);
}
