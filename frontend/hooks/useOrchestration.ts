/**
 * useOrchestration Hook
 * Controls the Glass Box orchestration visibility system
 *
 * Manages:
 * - Task complexity scoring
 * - Overlay visibility based on complexity
 * - Handoff events between agents
 * - Idle animations and dialogues
 * - User identity reinforcement
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type {
  OrchestrationState,
  OrchestrationPhase,
  HandoffEvent,
  HandoffEventType,
  AgentDialogue,
  TaskComplexity,
  ComplexityTier,
  Agent,
  DepartmentManager,
  BoomerAng,
  BoomerAngStatus,
} from '@/lib/orchestration/types';
import {
  ACHEEVY,
  DEPARTMENTS,
  VISIBILITY_RULES,
  IDLE_DIALOGUE_TEMPLATES,
} from '@/lib/orchestration/types';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface UseOrchestrationOptions {
  userId: string;
  userName: string;
  projectTitle?: string;
  projectObjective?: string;
  onBlockingQuestion?: (question: string) => void;
}

interface UseOrchestrationReturn {
  state: OrchestrationState;

  // Task lifecycle
  startTask: (prompt: string) => void;
  updatePhase: (phase: OrchestrationPhase) => void;
  completeTask: () => void;
  blockForUser: (question: string) => void;
  unblock: () => void;

  // Agent management
  assignManager: (departmentId: string) => DepartmentManager | null;
  assignAng: (angId: string) => BoomerAng | null;
  updateAngStatus: (angId: string, status: BoomerAngStatus) => void;
  releaseAng: (angId: string) => void;

  // Events
  addEvent: (type: HandoffEventType, message: string, toAgent?: Agent) => void;
  addDialogue: (
    speaker: Agent,
    content: string,
    type: AgentDialogue['type'],
    recipient?: Agent
  ) => void;

  // Overlay control
  setOverlayMode: (mode: OrchestrationState['overlayMode']) => void;
  toggleOverlay: () => void;

  // Computed
  shouldShowOverlay: boolean;
  overlayFrequency: 'none' | 'pulse' | 'periodic' | 'persistent';
}

// ─────────────────────────────────────────────────────────────
// Complexity Scoring
// ─────────────────────────────────────────────────────────────

function calculateComplexity(prompt: string): TaskComplexity {
  const words = prompt.toLowerCase().split(/\s+/);
  const length = prompt.length;

  // Estimate steps based on action words
  const actionWords = ['create', 'build', 'implement', 'design', 'develop', 'write', 'analyze', 'research', 'fix', 'update', 'deploy'];
  const actionCount = words.filter(w => actionWords.includes(w)).length;

  // Estimate departments from keywords
  const deptKeywords: Record<string, string[]> = {
    research: ['research', 'analyze', 'study', 'investigate', 'market', 'data'],
    development: ['code', 'build', 'develop', 'implement', 'api', 'backend', 'frontend'],
    content: ['write', 'design', 'create', 'copy', 'brand', 'logo', 'video', 'audio'],
    automation: ['automate', 'workflow', 'integrate', 'sync', 'schedule', 'n8n'],
    quality: ['test', 'review', 'verify', 'security', 'audit', 'compliance'],
  };

  const involvedDepts = new Set<string>();
  for (const [dept, keywords] of Object.entries(deptKeywords)) {
    if (keywords.some(k => words.includes(k))) {
      involvedDepts.add(dept);
    }
  }

  // Risk assessment
  const riskKeywords = {
    high: ['deploy', 'production', 'billing', 'payment', 'delete', 'security', 'compliance'],
    medium: ['database', 'api', 'integration', 'user data', 'authentication'],
  };

  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (riskKeywords.high.some(k => prompt.toLowerCase().includes(k))) {
    riskLevel = 'high';
  } else if (riskKeywords.medium.some(k => prompt.toLowerCase().includes(k))) {
    riskLevel = 'medium';
  }

  // Time horizon
  const timeKeywords = {
    instant: ['quick', 'simple', 'just'],
    short: ['soon', 'today', 'asap'],
    medium: ['this week', 'few days'],
    long: ['project', 'initiative', 'campaign', 'system'],
  };

  let timeHorizon: 'instant' | 'short' | 'medium' | 'long' = 'short';
  for (const [horizon, keywords] of Object.entries(timeKeywords)) {
    if (keywords.some(k => prompt.toLowerCase().includes(k))) {
      timeHorizon = horizon as typeof timeHorizon;
      break;
    }
  }

  // Calculate factors
  const estimatedSteps = Math.min(20, Math.max(1, actionCount * 3 + Math.floor(length / 100)));
  const departmentsInvolved = Math.max(1, involvedDepts.size);
  const expectedToolCalls = estimatedSteps * 3;

  const factors = {
    estimatedSteps,
    departmentsInvolved,
    expectedToolCalls,
    riskLevel,
    timeHorizon,
  };

  // Score calculation (0-100)
  let score = 0;
  score += estimatedSteps * 2; // 0-40
  score += departmentsInvolved * 10; // 0-50
  score += riskLevel === 'high' ? 20 : riskLevel === 'medium' ? 10 : 0; // 0-20
  score += timeHorizon === 'long' ? 15 : timeHorizon === 'medium' ? 10 : timeHorizon === 'short' ? 5 : 0; // 0-15

  score = Math.min(100, score);

  // Determine tier
  let tier: ComplexityTier = 'quick';
  if (score >= 60) tier = 'large';
  else if (score >= 30) tier = 'medium';

  return { score, tier, factors };
}

// ─────────────────────────────────────────────────────────────
// Idle Dialogue Generator
// ─────────────────────────────────────────────────────────────

function generateIdleDialogue(
  state: OrchestrationState,
  manager: DepartmentManager | null,
  angs: BoomerAng[]
): AgentDialogue | null {
  if (!manager || angs.length === 0) return null;

  const templates = IDLE_DIALOGUE_TEMPLATES;
  const template = templates[Math.floor(Math.random() * templates.length)];

  // Replace placeholders
  let content = template
    .replace(/{userName}/g, state.userName)
    .replace(/{projectTitle}/g, state.projectTitle || 'the project')
    .replace(/{projectObjective}/g, state.projectObjective || 'complete the task')
    .replace(/{manager}/g, manager.name)
    .replace(/{ang1}/g, angs[0]?.name || 'Agent')
    .replace(/{ang2}/g, angs[1]?.name || angs[0]?.name || 'Agent');

  // Replace capability placeholders
  const allCapabilities = angs.flatMap(a => a.capabilities);
  content = content.replace(/{capability1}/g, allCapabilities[0] || 'task');

  // Determine speaker from content
  let speaker: Agent = manager;
  if (content.startsWith(manager.name)) {
    content = content.replace(`${manager.name}: `, '');
    speaker = manager;
  } else {
    for (const ang of angs) {
      if (content.startsWith(ang.name)) {
        content = content.replace(`${ang.name}: `, '');
        speaker = ang;
        break;
      }
    }
  }

  return {
    id: `dialogue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    speaker,
    content,
    timestamp: new Date(),
    type: 'coordination',
    userNameMention: content.includes(state.userName) ? state.userName : undefined,
    projectReference: content.includes(state.projectTitle || '') ? state.projectTitle : undefined,
  };
}

// ─────────────────────────────────────────────────────────────
// Hook Implementation
// ─────────────────────────────────────────────────────────────

export function useOrchestration(options: UseOrchestrationOptions): UseOrchestrationReturn {
  const { userId, userName, projectTitle, projectObjective, onBlockingQuestion } = options;

  const idleIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize state
  const [state, setState] = useState<OrchestrationState>(() => ({
    sessionId: `session-${Date.now()}`,
    userId,
    userName,
    projectTitle,
    projectObjective,
    phase: 'idle',
    complexity: {
      score: 0,
      tier: 'quick',
      factors: {
        estimatedSteps: 0,
        departmentsInvolved: 0,
        expectedToolCalls: 0,
        riskLevel: 'low',
        timeHorizon: 'instant',
      },
    },
    activeManager: undefined,
    activeAngs: [],
    events: [],
    dialogues: [],
    isBlocked: false,
    blockingQuestion: undefined,
    overlayMode: 'hidden',
    userWantsOverlay: true,
    startedAt: new Date(),
    lastActivity: new Date(),
  }));

  // Computed values
  const visibilityRule = VISIBILITY_RULES[state.complexity.tier];
  const shouldShowOverlay = visibilityRule.showOverlay && state.userWantsOverlay && state.phase !== 'idle';
  const overlayFrequency = visibilityRule.overlayFrequency;

  // Start a new task
  const startTask = useCallback((prompt: string) => {
    const complexity = calculateComplexity(prompt);

    setState(prev => ({
      ...prev,
      phase: 'ingest',
      complexity,
      events: [],
      dialogues: [],
      activeManager: undefined,
      activeAngs: [],
      isBlocked: false,
      blockingQuestion: undefined,
      overlayMode: complexity.tier === 'quick' ? 'hidden' : 'minimal',
      startedAt: new Date(),
      lastActivity: new Date(),
    }));
  }, []);

  // Update phase
  const updatePhase = useCallback((phase: OrchestrationPhase) => {
    setState(prev => ({
      ...prev,
      phase,
      lastActivity: new Date(),
    }));
  }, []);

  // Complete task
  const completeTask = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: 'idle',
      activeManager: undefined,
      activeAngs: [],
      isBlocked: false,
      blockingQuestion: undefined,
      overlayMode: 'hidden',
      lastActivity: new Date(),
    }));
  }, []);

  // Block for user input
  const blockForUser = useCallback((question: string) => {
    setState(prev => ({
      ...prev,
      phase: 'blocked',
      isBlocked: true,
      blockingQuestion: question,
      lastActivity: new Date(),
    }));

    onBlockingQuestion?.(question);
  }, [onBlockingQuestion]);

  // Unblock
  const unblock = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: 'execute',
      isBlocked: false,
      blockingQuestion: undefined,
      lastActivity: new Date(),
    }));
  }, []);

  // Assign manager
  const assignManager = useCallback((departmentId: string): DepartmentManager | null => {
    const dept = DEPARTMENTS.find(d => d.id === departmentId);
    if (!dept) return null;

    setState(prev => ({
      ...prev,
      activeManager: dept.manager,
      phase: 'delegate',
      lastActivity: new Date(),
    }));

    return dept.manager;
  }, []);

  // Assign ang
  const assignAng = useCallback((angId: string): BoomerAng | null => {
    let foundAng: BoomerAng | null = null;

    for (const dept of DEPARTMENTS) {
      const ang = dept.angs.find(a => a.id === angId);
      if (ang) {
        foundAng = { ...ang, currentStatus: 'queued' };
        break;
      }
    }

    if (!foundAng) return null;

    setState(prev => {
      // Check if already assigned
      if (prev.activeAngs.some(a => a.id === angId)) {
        return prev;
      }

      return {
        ...prev,
        activeAngs: [...prev.activeAngs, foundAng!],
        lastActivity: new Date(),
      };
    });

    return foundAng;
  }, []);

  // Update ang status
  const updateAngStatus = useCallback((angId: string, status: BoomerAngStatus) => {
    setState(prev => ({
      ...prev,
      activeAngs: prev.activeAngs.map(a =>
        a.id === angId ? { ...a, currentStatus: status } : a
      ),
      lastActivity: new Date(),
    }));
  }, []);

  // Release ang
  const releaseAng = useCallback((angId: string) => {
    setState(prev => ({
      ...prev,
      activeAngs: prev.activeAngs.filter(a => a.id !== angId),
      lastActivity: new Date(),
    }));
  }, []);

  // Add event
  const addEvent = useCallback((
    type: HandoffEventType,
    message: string,
    toAgent?: Agent
  ) => {
    const event: HandoffEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: new Date(),
      fromAgent: ACHEEVY,
      toAgent,
      message: message.replace(/{userName}/g, userName),
      userContext: `${userName}${projectTitle ? ` - ${projectTitle}` : ''}`,
      phase: state.phase,
      isUserFacing: true,
    };

    setState(prev => {
      const maxEvents = VISIBILITY_RULES[prev.complexity.tier].maxEventsShown;
      const events = [...prev.events, event];

      return {
        ...prev,
        events: events.slice(-maxEvents),
        lastActivity: new Date(),
      };
    });
  }, [userName, projectTitle, state.phase]);

  // Add dialogue
  const addDialogue = useCallback((
    speaker: Agent,
    content: string,
    type: AgentDialogue['type'],
    recipient?: Agent
  ) => {
    const dialogue: AgentDialogue = {
      id: `dialogue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      speaker,
      recipient,
      content: content.replace(/{userName}/g, userName),
      timestamp: new Date(),
      type,
      userNameMention: content.includes(userName) ? userName : undefined,
      projectReference: content.includes(projectTitle || '') ? projectTitle : undefined,
    };

    setState(prev => ({
      ...prev,
      dialogues: [...prev.dialogues.slice(-9), dialogue], // Keep last 10
      lastActivity: new Date(),
    }));
  }, [userName, projectTitle]);

  // Set overlay mode
  const setOverlayMode = useCallback((mode: OrchestrationState['overlayMode']) => {
    setState(prev => ({ ...prev, overlayMode: mode }));
  }, []);

  // Toggle overlay
  const toggleOverlay = useCallback(() => {
    setState(prev => ({
      ...prev,
      overlayMode: prev.overlayMode === 'hidden' ? 'minimal' : prev.overlayMode === 'minimal' ? 'expanded' : 'hidden',
    }));
  }, []);

  // Idle animation effect
  useEffect(() => {
    if (state.isBlocked && state.activeManager && state.activeAngs.length > 0) {
      // Start idle dialogue generation when blocked
      idleIntervalRef.current = setInterval(() => {
        const dialogue = generateIdleDialogue(state, state.activeManager!, state.activeAngs);
        if (dialogue) {
          setState(prev => ({
            ...prev,
            dialogues: [...prev.dialogues.slice(-9), dialogue],
          }));
        }
      }, 5000); // New dialogue every 5 seconds
    }

    return () => {
      if (idleIntervalRef.current) {
        clearInterval(idleIntervalRef.current);
      }
    };
  }, [state.isBlocked, state.activeManager, state.activeAngs]);

  return {
    state,
    startTask,
    updatePhase,
    completeTask,
    blockForUser,
    unblock,
    assignManager,
    assignAng,
    updateAngStatus,
    releaseAng,
    addEvent,
    addDialogue,
    setOverlayMode,
    toggleOverlay,
    shouldShowOverlay,
    overlayFrequency,
  };
}

export default useOrchestration;
