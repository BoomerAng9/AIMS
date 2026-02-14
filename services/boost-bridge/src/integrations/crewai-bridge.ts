/**
 * CrewAI Bridge — Multi-Agent Orchestration Layer
 *
 * Connects Boost|Bridge to CrewAI (Python) for advanced multi-agent workflows:
 *   - Verification Crew: OCR Agent → Face Agent → Credential Agent → Risk Agent
 *   - Research Crew: Researcher → Analyst → Synthesizer
 *   - Simulation Crew: Persona Generator → Reactor → Aggregator
 *
 * Architecture:
 *   TypeScript (Boost|Bridge) → HTTP → Python (CrewAI Service) → Agents
 *
 * The CrewAI service runs as a sidecar container on the VPS.
 * Port: 7002
 */

const CREWAI_BASE_URL = process.env.CREWAI_BASE_URL || 'http://localhost:7002';
const CREWAI_API_KEY = process.env.CREWAI_API_KEY || '';

// ─── Types ───────────────────────────────────────────────────────────────

export interface CrewDefinition {
  name: string;
  description: string;
  agents: AgentDefinition[];
  tasks: TaskDefinition[];
  process: 'sequential' | 'hierarchical';
  verbose: boolean;
}

export interface AgentDefinition {
  role: string;
  goal: string;
  backstory: string;
  tools: string[];
  llm?: string;
  allowDelegation?: boolean;
  maxIterations?: number;
}

export interface TaskDefinition {
  description: string;
  agent: string;          // Role name of the assigned agent
  expectedOutput: string;
  context?: string[];     // Task names this depends on
}

export interface CrewExecution {
  executionId: string;
  crewName: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  result?: unknown;
  agentLogs: Array<{
    agent: string;
    action: string;
    observation: string;
    timestamp: string;
  }>;
}

// ─── Pre-built Crews ─────────────────────────────────────────────────────

export const VERIFICATION_CREW: CrewDefinition = {
  name: 'identity_verification',
  description: 'Multi-agent identity verification pipeline for Boost|Bridge onboarding',
  agents: [
    {
      role: 'OCR Specialist',
      goal: 'Extract and validate text from identity documents with maximum accuracy',
      backstory: 'You are a document forensics expert trained on millions of ID documents. You spot fakes, detect tampering, and extract every field with precision.',
      tools: ['deepseek_vision', 'gcp_vision_ocr', 'document_validator'],
      llm: 'deepseek-chat',
    },
    {
      role: 'Biometric Analyst',
      goal: 'Verify facial identity match between document photo and live selfie',
      backstory: 'You are a biometric security specialist. You analyze facial geometry, detect spoofing attempts, and ensure the person matches their document.',
      tools: ['gcp_face_detection', 'liveness_check', 'similarity_scorer'],
      llm: 'gemini-2.0-flash',
    },
    {
      role: 'Credential Verifier',
      goal: 'Validate professional credentials, certifications, and employment claims',
      backstory: 'You are a background check specialist who verifies professional claims against official databases and public records. You catch diploma mills and fake certifications.',
      tools: ['web_search', 'credential_database', 'institution_verifier'],
    },
    {
      role: 'Risk Assessor',
      goal: 'Synthesize all verification data into a risk score and final recommendation',
      backstory: 'You are a Six Sigma Black Belt in identity risk management. You weigh all evidence, identify patterns, and make the final call on verification status.',
      tools: ['vertex_ai_predict', 'risk_calculator', 'fraud_pattern_matcher'],
      allowDelegation: false,
    },
  ],
  tasks: [
    {
      description: 'Scan the submitted document using OCR. Extract all text fields, assess document authenticity, flag any concerns.',
      agent: 'OCR Specialist',
      expectedOutput: 'JSON with extracted fields, confidence score, authenticity assessment, and flags array.',
    },
    {
      description: 'Compare the selfie photo against the document photo. Detect faces, assess liveness, compute match confidence.',
      agent: 'Biometric Analyst',
      expectedOutput: 'JSON with match verdict, confidence score, liveness score, and any flags.',
      context: ['Scan the submitted document using OCR'],
    },
    {
      description: 'Verify all professional claims against known databases and public records. Cross-reference with OCR-extracted name.',
      agent: 'Credential Verifier',
      expectedOutput: 'JSON with each claim status, sources, credibility score.',
      context: ['Scan the submitted document using OCR'],
    },
    {
      description: 'Analyze all verification results. Compute ML risk score. Issue final verification verdict.',
      agent: 'Risk Assessor',
      expectedOutput: 'JSON with risk score, risk level, recommendation (approve/review/reject), and detailed factor breakdown.',
      context: ['Scan the submitted document using OCR', 'Compare the selfie photo against the document photo', 'Verify all professional claims'],
    },
  ],
  process: 'sequential',
  verbose: true,
};

export const RESEARCH_CREW: CrewDefinition = {
  name: 'market_research',
  description: 'Deep market research crew for Boost|Bridge simulations',
  agents: [
    {
      role: 'Market Researcher',
      goal: 'Gather comprehensive market data on the target industry and competitive landscape',
      backstory: 'You are a relentless market researcher. You dig through reports, analyze trends, and find the data others miss.',
      tools: ['web_search', 'brave_search', 'data_scraper'],
    },
    {
      role: 'Data Analyst',
      goal: 'Transform raw market data into actionable insights with statistical rigor',
      backstory: 'You are a data scientist who turns noise into signal. Six Sigma trained, you demand statistical significance before drawing conclusions.',
      tools: ['data_analyzer', 'chart_generator', 'statistical_tester'],
    },
    {
      role: 'Strategy Synthesizer',
      goal: 'Combine research and analysis into a clear, actionable market strategy',
      backstory: 'You are a strategy consultant who talks straight. No jargon, no fluff. You tell founders exactly what the data means for their business.',
      tools: ['report_generator', 'recommendation_engine'],
      allowDelegation: false,
    },
  ],
  tasks: [
    {
      description: 'Research the target market: size, growth rate, key players, trends, threats, and opportunities.',
      agent: 'Market Researcher',
      expectedOutput: 'Comprehensive market data report with sources.',
    },
    {
      description: 'Analyze the research data. Identify statistical patterns, market gaps, and quantified opportunities.',
      agent: 'Data Analyst',
      expectedOutput: 'Data analysis with charts, key metrics, and statistical confidence levels.',
      context: ['Research the target market'],
    },
    {
      description: 'Synthesize research and analysis into actionable strategy recommendations.',
      agent: 'Strategy Synthesizer',
      expectedOutput: 'Executive strategy brief with 5-7 prioritized recommendations.',
      context: ['Research the target market', 'Analyze the research data'],
    },
  ],
  process: 'sequential',
  verbose: true,
};

// ─── CrewAI Service Client ───────────────────────────────────────────────

async function crewFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(CREWAI_API_KEY ? { 'X-API-Key': CREWAI_API_KEY } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  return fetch(`${CREWAI_BASE_URL}${path}`, { ...options, headers });
}

export async function healthCheck(): Promise<{ status: string; crews: string[] }> {
  try {
    const res = await crewFetch('/health');
    if (res.ok) return await res.json() as { status: string; crews: string[] };
    return { status: 'unhealthy', crews: [] };
  } catch {
    return { status: 'unreachable', crews: [] };
  }
}

export async function kickoffCrew(
  crew: CrewDefinition,
  inputs: Record<string, unknown> = {},
): Promise<CrewExecution> {
  const res = await crewFetch('/api/crew/kickoff', {
    method: 'POST',
    body: JSON.stringify({ crew, inputs }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`CrewAI kickoff failed: ${res.status} ${err}`);
  }

  return await res.json() as CrewExecution;
}

export async function getCrewStatus(executionId: string): Promise<CrewExecution> {
  const res = await crewFetch(`/api/crew/status/${executionId}`);

  if (!res.ok) {
    throw new Error(`CrewAI status check failed: ${res.status}`);
  }

  return await res.json() as CrewExecution;
}

export async function listCrews(): Promise<string[]> {
  const res = await crewFetch('/api/crews');
  if (!res.ok) return [];
  const data = await res.json() as { crews: string[] };
  return data.crews || [];
}

// ─── Convenience: Run Verification Crew ──────────────────────────────────

export async function runVerificationCrew(input: {
  documentImageBase64: string;
  selfieImageBase64?: string;
  professionalClaims?: Array<{ title: string; issuer: string; year: number }>;
}): Promise<CrewExecution> {
  return kickoffCrew(VERIFICATION_CREW, input);
}

export async function runResearchCrew(input: {
  industry: string;
  productDescription: string;
  competitors?: string[];
}): Promise<CrewExecution> {
  return kickoffCrew(RESEARCH_CREW, input);
}
