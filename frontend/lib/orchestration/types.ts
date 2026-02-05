/**
 * A.I.M.S. Orchestration Types
 * Chain of Command: User → ACHEEVY → Manager → Boomer_Angs
 *
 * Glass Box visibility for agent-to-agent delegation
 */

// ─────────────────────────────────────────────────────────────
// Chain of Command Roles
// ─────────────────────────────────────────────────────────────

export type AgentRole = 'acheevy' | 'manager' | 'boomerang';

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  department?: string;
  avatar?: string;
  specialty?: string;
}

export const ACHEEVY: Agent = {
  id: 'acheevy',
  name: 'ACHEEVY',
  role: 'acheevy',
  avatar: 'A',
  specialty: 'Executive Orchestrator'
};

// Department Managers (PMO/Office leads)
export interface DepartmentManager extends Agent {
  role: 'manager';
  department: string;
  managedAngs: string[]; // IDs of Boomer_Angs they manage
}

// Boomer_Ang specialists
export interface BoomerAng extends Agent {
  role: 'boomerang';
  department: string;
  capabilities: string[];
  currentStatus: BoomerAngStatus;
}

export type BoomerAngStatus =
  | 'idle'
  | 'queued'
  | 'working'
  | 'blocked'
  | 'waiting_on_user'
  | 'complete'
  | 'error';

// ─────────────────────────────────────────────────────────────
// Task Complexity Scoring
// ─────────────────────────────────────────────────────────────

export interface TaskComplexityFactors {
  estimatedSteps: number;        // 1-20
  departmentsInvolved: number;   // 1-5
  expectedToolCalls: number;     // 0-50
  riskLevel: 'low' | 'medium' | 'high'; // compliance, billing, data
  timeHorizon: 'instant' | 'short' | 'medium' | 'long'; // minutes to weeks
}

export type ComplexityTier = 'quick' | 'medium' | 'large';

export interface TaskComplexity {
  score: number; // 0-100
  tier: ComplexityTier;
  factors: TaskComplexityFactors;
}

// Visibility rules based on complexity
export const VISIBILITY_RULES: Record<ComplexityTier, {
  showOverlay: boolean;
  overlayFrequency: 'none' | 'pulse' | 'periodic' | 'persistent';
  maxEventsShown: number;
}> = {
  quick: {
    showOverlay: false,
    overlayFrequency: 'none',
    maxEventsShown: 0
  },
  medium: {
    showOverlay: true,
    overlayFrequency: 'periodic',
    maxEventsShown: 5
  },
  large: {
    showOverlay: true,
    overlayFrequency: 'persistent',
    maxEventsShown: 20
  }
};

// ─────────────────────────────────────────────────────────────
// Orchestration Phases
// ─────────────────────────────────────────────────────────────

export type OrchestrationPhase =
  | 'ingest'      // ACHEEVY receiving prompt
  | 'route'       // Determining department(s)
  | 'delegate'    // Assigning to Boomer_Angs
  | 'execute'     // Boomer_Angs working
  | 'verify'      // Quality check / ORACLE gates
  | 'consolidate' // Manager summarizing
  | 'deliver'     // ACHEEVY responding to user
  | 'blocked'     // Waiting on user input
  | 'idle';       // No active task

// ─────────────────────────────────────────────────────────────
// Handoff Events (what shows in the overlay)
// ─────────────────────────────────────────────────────────────

export type HandoffEventType =
  | 'task_received'
  | 'routing_to_department'
  | 'manager_assigned'
  | 'ang_assigned'
  | 'ang_working'
  | 'ang_blocked'
  | 'need_user_input'
  | 'user_input_received'
  | 'ang_complete'
  | 'manager_reviewing'
  | 'consolidating'
  | 'delivering';

export interface HandoffEvent {
  id: string;
  type: HandoffEventType;
  timestamp: Date;
  fromAgent: Agent;
  toAgent?: Agent;
  message: string;           // Safe, work-appropriate message
  userContext?: string;      // User name + project reference
  phase: OrchestrationPhase;
  isUserFacing: boolean;     // If true, shown in overlay
}

// ─────────────────────────────────────────────────────────────
// Agent Dialogue (internal messages shown in overlay)
// ─────────────────────────────────────────────────────────────

export interface AgentDialogue {
  id: string;
  speaker: Agent;
  recipient?: Agent;
  content: string;
  timestamp: Date;
  type: 'coordination' | 'status' | 'question' | 'answer' | 'summary';
  userNameMention?: string;  // For "awe moment" - user sees their name
  projectReference?: string; // Brief project context
}

// Dialogue safety constraints
export const DIALOGUE_CONSTRAINTS = {
  maxLength: 200,
  allowedTones: ['professional', 'friendly', 'focused'],
  forbiddenContent: [
    'offensive', 'inappropriate', 'controversial',
    'political', 'religious', 'violent', 'adult'
  ],
  mustInclude: {
    userNameFrequency: 0.3, // 30% of messages should reference user
    projectContextFrequency: 0.5 // 50% should reference the project
  }
};

// ─────────────────────────────────────────────────────────────
// Orchestration State (full session state)
// ─────────────────────────────────────────────────────────────

export interface OrchestrationState {
  sessionId: string;
  userId: string;
  userName: string;
  projectTitle?: string;
  projectObjective?: string;

  // Current state
  phase: OrchestrationPhase;
  complexity: TaskComplexity;

  // Active agents
  activeManager?: DepartmentManager;
  activeAngs: BoomerAng[];

  // Event log
  events: HandoffEvent[];
  dialogues: AgentDialogue[];

  // Blocking
  isBlocked: boolean;
  blockingQuestion?: string;

  // UI preferences
  overlayMode: 'hidden' | 'minimal' | 'expanded';
  userWantsOverlay: boolean;

  // Timestamps
  startedAt: Date;
  lastActivity: Date;
}

// ─────────────────────────────────────────────────────────────
// Department Configuration
// ─────────────────────────────────────────────────────────────

export interface Department {
  id: string;
  name: string;
  manager: DepartmentManager;
  angs: BoomerAng[];
  capabilities: string[];
}

export const DEPARTMENTS: Department[] = [
  {
    id: 'research',
    name: 'Research & Analysis',
    manager: {
      id: 'research_manager',
      name: 'ResearchLead_Ang',
      role: 'manager',
      department: 'research',
      managedAngs: ['researcher_ang', 'analyst_ang'],
      specialty: 'Information gathering and analysis'
    },
    angs: [
      {
        id: 'researcher_ang',
        name: 'Researcher_Ang',
        role: 'boomerang',
        department: 'research',
        capabilities: ['brave_search', 'academic_research', 'market_analysis'],
        currentStatus: 'idle'
      },
      {
        id: 'analyst_ang',
        name: 'Analyst_Ang',
        role: 'boomerang',
        department: 'research',
        capabilities: ['data_analysis', 'trend_identification', 'report_generation'],
        currentStatus: 'idle'
      }
    ],
    capabilities: ['research', 'analysis', 'market_intelligence']
  },
  {
    id: 'development',
    name: 'Development & Engineering',
    manager: {
      id: 'dev_manager',
      name: 'EngineerLead_Ang',
      role: 'manager',
      department: 'development',
      managedAngs: ['coder_ang', 'architect_ang'],
      specialty: 'Software development and architecture'
    },
    angs: [
      {
        id: 'coder_ang',
        name: 'Coder_Ang',
        role: 'boomerang',
        department: 'development',
        capabilities: ['code_generation', 'debugging', 'refactoring'],
        currentStatus: 'idle'
      },
      {
        id: 'architect_ang',
        name: 'Architect_Ang',
        role: 'boomerang',
        department: 'development',
        capabilities: ['system_design', 'api_design', 'infrastructure'],
        currentStatus: 'idle'
      }
    ],
    capabilities: ['coding', 'architecture', 'deployment']
  },
  {
    id: 'content',
    name: 'Content & Creative',
    manager: {
      id: 'content_manager',
      name: 'CreativeLead_Ang',
      role: 'manager',
      department: 'content',
      managedAngs: ['writer_ang', 'designer_ang', 'voice_ang'],
      specialty: 'Content creation and creative direction'
    },
    angs: [
      {
        id: 'writer_ang',
        name: 'Writer_Ang',
        role: 'boomerang',
        department: 'content',
        capabilities: ['copywriting', 'blog_posts', 'documentation'],
        currentStatus: 'idle'
      },
      {
        id: 'designer_ang',
        name: 'Designer_Ang',
        role: 'boomerang',
        department: 'content',
        capabilities: ['ui_design', 'graphics', 'branding'],
        currentStatus: 'idle'
      },
      {
        id: 'voice_ang',
        name: 'Voice_Ang',
        role: 'boomerang',
        department: 'content',
        capabilities: ['tts', 'audio_production', 'voice_cloning'],
        currentStatus: 'idle'
      }
    ],
    capabilities: ['writing', 'design', 'audio', 'video']
  },
  {
    id: 'automation',
    name: 'Automation & Workflows',
    manager: {
      id: 'automation_manager',
      name: 'AutomationLead_Ang',
      role: 'manager',
      department: 'automation',
      managedAngs: ['workflow_ang', 'integration_ang'],
      specialty: 'Process automation and integrations'
    },
    angs: [
      {
        id: 'workflow_ang',
        name: 'Workflow_Ang',
        role: 'boomerang',
        department: 'automation',
        capabilities: ['n8n_workflows', 'scheduling', 'triggers'],
        currentStatus: 'idle'
      },
      {
        id: 'integration_ang',
        name: 'Integration_Ang',
        role: 'boomerang',
        department: 'automation',
        capabilities: ['api_integration', 'data_sync', 'webhooks'],
        currentStatus: 'idle'
      }
    ],
    capabilities: ['automation', 'integration', 'scheduling']
  },
  {
    id: 'quality',
    name: 'Quality & Verification',
    manager: {
      id: 'quality_manager',
      name: 'QualityLead_Ang',
      role: 'manager',
      department: 'quality',
      managedAngs: ['quality_ang', 'security_ang'],
      specialty: 'Quality assurance and security verification'
    },
    angs: [
      {
        id: 'quality_ang',
        name: 'Quality_Ang',
        role: 'boomerang',
        department: 'quality',
        capabilities: ['oracle_gates', 'testing', 'review'],
        currentStatus: 'idle'
      },
      {
        id: 'security_ang',
        name: 'Security_Ang',
        role: 'boomerang',
        department: 'quality',
        capabilities: ['security_audit', 'compliance', 'vulnerability_scan'],
        currentStatus: 'idle'
      }
    ],
    capabilities: ['quality', 'security', 'compliance']
  }
];

// ─────────────────────────────────────────────────────────────
// Idle Animation Dialogue Templates (work-safe filler)
// ─────────────────────────────────────────────────────────────

export const IDLE_DIALOGUE_TEMPLATES = [
  // Coordination
  "{manager}: Just checking in on the {projectTitle} task for {userName}. Status?",
  "{ang1}: Still processing the data. Should have preliminary results soon.",
  "{manager}: Good. {userName} is counting on us for this one.",

  // Project discussion
  "{ang1}: The requirements for {userName}'s project are clear. {projectObjective}.",
  "{ang2}: Agreed. I'll handle the {capability1} portion.",
  "{manager}: Perfect coordination. Let's keep {userName} updated.",

  // Status updates
  "{ang1}: Making progress on {userName}'s request.",
  "{manager}: Excellent. Quality check scheduled after completion.",

  // Waiting on user
  "{manager}: We need clarification from {userName} to proceed.",
  "{ang1}: I'll prepare everything else while we wait.",
  "{manager}: Good thinking. Let's be ready when {userName} responds.",
];
