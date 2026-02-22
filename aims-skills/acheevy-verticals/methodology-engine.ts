/**
 * Methodology Engine — DMAIC, DMADV, Foster, Develop, HONE, Look-Listen-Learn
 *
 * Six Sigma meets Forward Design Engineering.
 * These aren't academic exercises — they're how ACHEEVY thinks through problems.
 *
 * Two established models:
 *   DMAIC  → Improve what exists (Define → Measure → Analyze → Improve → Control)
 *   DMADV  → Design what's new  (Define → Measure → Analyze → Design → Verify)
 *
 * Four proprietary models:
 *   FOSTER  → Nurture a concept from seed to sustainable growth
 *   DEVELOP → Take a validated idea through structured build-out
 *   HONE    → Refine and sharpen what's already working
 *   LOOK-LISTEN-LEARN → The engagement triad for needs discovery
 *
 * Every needs analysis, every client intake, every project lifecycle
 * runs through one or more of these methodologies.
 *
 * "The methodology isn't the deliverable. The deliverable is the result."
 */

import { v4 as uuidv4 } from 'uuid';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Which methodology is being applied */
export type MethodologyId =
  | 'dmaic'
  | 'dmadv'
  | 'foster'
  | 'develop'
  | 'hone'
  | 'look-listen-learn';

/** Phase within a methodology */
export interface MethodologyPhase {
  id: string;
  name: string;
  objective: string;
  keyQuestions: string[];
  deliverables: string[];
  tools: string[];            // ACHEEVY tools/agents applicable
  gateCondition: string;      // What must be true to move to next phase
}

/** Full methodology definition */
export interface MethodologyDefinition {
  id: MethodologyId;
  name: string;
  purpose: string;
  when: string;               // When to use this methodology
  phases: MethodologyPhase[];
  acheevy_behavior: string;   // How ACHEEVY should behave during this methodology
}

/** Runtime state for an active methodology session */
export interface MethodologySession {
  id: string;
  methodologyId: MethodologyId;
  userId: string;
  sessionId: string;
  currentPhase: number;       // Index into phases[]
  phaseData: Record<string, Record<string, unknown>>; // Phase ID → collected data
  started: string;
  updated: string;
  status: 'active' | 'completed' | 'paused' | 'abandoned';
  transactionId?: string;     // Links to Transaction model
}

// ---------------------------------------------------------------------------
// DMAIC — Define, Measure, Analyze, Improve, Control
// ---------------------------------------------------------------------------

const DMAIC: MethodologyDefinition = {
  id: 'dmaic',
  name: 'DMAIC',
  purpose: 'Improve an existing process, system, or service that is underperforming.',
  when: 'Use when something EXISTS but needs to be BETTER. Fix what\'s broken or optimize what\'s slow.',
  phases: [
    {
      id: 'define',
      name: 'Define',
      objective: 'What is the problem? Who is affected? What does success look like?',
      keyQuestions: [
        'What specific problem are you experiencing?',
        'Who is impacted by this problem?',
        'What is the current state vs. desired state?',
        'What is the scope — what is IN and what is OUT?',
        'What is the business impact if we do nothing?',
      ],
      deliverables: ['Problem statement', 'Scope definition', 'Success criteria', 'Stakeholder map'],
      tools: ['needs-analysis', 'Scout_Ang', 'Chronicle_Ang'],
      gateCondition: 'Problem statement is specific, measurable, and agreed upon.',
    },
    {
      id: 'measure',
      name: 'Measure',
      objective: 'Quantify the current state. No opinions — data only.',
      keyQuestions: [
        'What are the current metrics for this process?',
        'How often does the problem occur?',
        'What data do you have? What data do you need?',
        'What is the baseline performance?',
        'Where are the bottlenecks?',
      ],
      deliverables: ['Baseline metrics', 'Data collection plan', 'Process map (current state)', 'Measurement system analysis'],
      tools: ['Lab_Ang', 'Index_Ang', 'n8n', 'browser-use'],
      gateCondition: 'Baseline metrics established with supporting data.',
    },
    {
      id: 'analyze',
      name: 'Analyze',
      objective: 'Find the root cause. Why is it broken? Don\'t treat symptoms.',
      keyQuestions: [
        'What are the potential root causes?',
        'Which causes are validated by data?',
        'Are there patterns or trends in the failures?',
        'What dependencies or constraints exist?',
        'What has been tried before and why did it fail?',
      ],
      deliverables: ['Root cause analysis', 'Validated cause(s)', 'Impact-effort matrix', 'Risk assessment'],
      tools: ['Scout_Ang', 'Lab_Ang', 'deerflow'],
      gateCondition: 'Root cause identified and validated with data. Not speculation.',
    },
    {
      id: 'improve',
      name: 'Improve',
      objective: 'Implement the fix. Build, deploy, test.',
      keyQuestions: [
        'What solution addresses the root cause?',
        'What is the implementation plan?',
        'What resources are needed?',
        'What are the risks of implementation?',
        'How will we test that the fix works?',
      ],
      deliverables: ['Solution design', 'Implementation plan', 'Pilot results', 'Before/after comparison'],
      tools: ['Buildsmith', 'Chicken Hawk', 'Runner_Ang', 'Dockmaster_Ang'],
      gateCondition: 'Solution deployed, tested, and metrics show improvement over baseline.',
    },
    {
      id: 'control',
      name: 'Control',
      objective: 'Lock it in. Monitor. Prevent regression.',
      keyQuestions: [
        'How will we monitor ongoing performance?',
        'What alerts trigger if performance degrades?',
        'Who owns this process going forward?',
        'What documentation is needed?',
        'When do we review again?',
      ],
      deliverables: ['Control plan', 'Monitoring dashboard', 'Standard operating procedure', 'Handoff documentation'],
      tools: ['OpsConsole_Ang', 'n8n', 'circuit-metrics'],
      gateCondition: 'Monitoring in place, ownership assigned, SOP documented.',
    },
  ],
  acheevy_behavior: `
[METHODOLOGY: DMAIC — Improve What Exists]
You are guiding the user through a structured improvement cycle.
- Be data-driven. Challenge opinions with "show me the numbers."
- Each phase has a gate. Do NOT advance until the gate condition is met.
- Use the Measure phase to establish facts before the Analyze phase makes claims.
- In Improve, always present a before/after comparison.
- In Control, ensure someone OWNS the fix going forward.
- Tone: Analytical, precise, constructive. Like a Black Belt who's done this 100 times.
`.trim(),
};

// ---------------------------------------------------------------------------
// DMADV — Define, Measure, Analyze, Design, Verify
// ---------------------------------------------------------------------------

const DMADV: MethodologyDefinition = {
  id: 'dmadv',
  name: 'DMADV',
  purpose: 'Design something NEW that doesn\'t exist yet. Right the first time.',
  when: 'Use when building from scratch. New product, new service, new system. No existing process to improve.',
  phases: [
    {
      id: 'define',
      name: 'Define',
      objective: 'What are we building? For whom? Why does it matter?',
      keyQuestions: [
        'What is the vision for this new product/service?',
        'Who is the target user or customer?',
        'What problem does this solve that isn\'t solved today?',
        'What are the critical-to-quality (CTQ) requirements?',
        'What constraints exist (budget, time, technology)?',
      ],
      deliverables: ['Project charter', 'Voice of Customer (VOC)', 'CTQ tree', 'Constraints document'],
      tools: ['needs-analysis', 'Scout_Ang', 'Chronicle_Ang'],
      gateCondition: 'Clear project charter with CTQ requirements and target user defined.',
    },
    {
      id: 'measure',
      name: 'Measure',
      objective: 'Research the market. Benchmark competitors. Quantify the opportunity.',
      keyQuestions: [
        'What do competitors offer?',
        'What do potential users say they need?',
        'What market size and growth rate are we targeting?',
        'What performance benchmarks must we meet or exceed?',
        'What existing solutions come closest to what we want?',
      ],
      deliverables: ['Competitive analysis', 'Market research', 'Performance benchmarks', 'User research findings'],
      tools: ['Scout_Ang', 'Lab_Ang', 'deerflow', 'browser-use'],
      gateCondition: 'Market validated, benchmarks established, user needs documented.',
    },
    {
      id: 'analyze',
      name: 'Analyze',
      objective: 'Evaluate design options. Trade-off analysis. Risk assessment.',
      keyQuestions: [
        'What design approaches are possible?',
        'What are the trade-offs between options?',
        'Which approach best satisfies CTQ requirements?',
        'What are the technical risks of each approach?',
        'What is the build-vs-buy decision?',
      ],
      deliverables: ['Design alternatives matrix', 'Trade-off analysis', 'Risk register', 'Recommended approach'],
      tools: ['Scout_Ang', 'Lab_Ang', 'Buildsmith'],
      gateCondition: 'Design approach selected with justified trade-off analysis.',
    },
    {
      id: 'design',
      name: 'Design',
      objective: 'Build it. Architecture, implementation, testing.',
      keyQuestions: [
        'What is the detailed architecture?',
        'How does each component satisfy CTQ requirements?',
        'What is the test plan?',
        'What is the deployment strategy?',
        'What is the MVP scope?',
      ],
      deliverables: ['Architecture document', 'Implementation plan', 'Test plan', 'MVP definition'],
      tools: ['Buildsmith', 'Chicken Hawk', 'Runner_Ang', 'Dockmaster_Ang'],
      gateCondition: 'MVP built, tested, and ready for verification.',
    },
    {
      id: 'verify',
      name: 'Verify',
      objective: 'Validate against CTQ. Does it do what we said it would?',
      keyQuestions: [
        'Does the product meet all CTQ requirements?',
        'What do test users say?',
        'Where does it fall short of benchmarks?',
        'Is it ready for production launch?',
        'What iteration is needed?',
      ],
      deliverables: ['CTQ verification report', 'User acceptance testing results', 'Launch readiness checklist', 'Iteration backlog'],
      tools: ['Lab_Ang', 'OpsConsole_Ang', 'Gatekeeper_Ang'],
      gateCondition: 'All CTQ requirements verified. User acceptance confirmed.',
    },
  ],
  acheevy_behavior: `
[METHODOLOGY: DMADV — Design What's New]
You are guiding the user through designing something from scratch.
- Start with the customer. Voice of Customer (VOC) drives everything.
- CTQ requirements are non-negotiable — every design decision traces back to them.
- In Analyze, present at least 2 alternatives with clear trade-offs.
- In Design, push for MVP scope. Ship a small version, verify, iterate.
- In Verify, compare actual performance against CTQ benchmarks.
- Tone: Forward-thinking, systematic, creative but disciplined.
`.trim(),
};

// ---------------------------------------------------------------------------
// FOSTER — Proprietary: Nurture from Seed to Sustainable Growth
// ---------------------------------------------------------------------------

const FOSTER: MethodologyDefinition = {
  id: 'foster',
  name: 'FOSTER',
  purpose: 'Nurture a concept from raw idea to sustainable, self-sustaining growth.',
  when: 'Use when the user has a seed of an idea but needs nurturing, direction, and a growth plan.',
  phases: [
    {
      id: 'frame',
      name: 'Frame',
      objective: 'Frame the idea. What is it? Why does it matter? Who cares?',
      keyQuestions: [
        'Describe your idea in one sentence.',
        'Who would pay for this and why?',
        'What makes this different from what exists?',
        'What triggered this idea?',
      ],
      deliverables: ['Idea statement', 'Target audience', 'Differentiation claim'],
      tools: ['needs-analysis', 'Scout_Ang'],
      gateCondition: 'Idea can be stated in one clear sentence with a target audience.',
    },
    {
      id: 'observe',
      name: 'Observe',
      objective: 'Look at the landscape. Who else is doing this? What gaps exist?',
      keyQuestions: [
        'Who are the top 3 competitors or alternatives?',
        'What are users complaining about with existing solutions?',
        'What market trends support this idea?',
        'What adjacent markets could this expand into?',
      ],
      deliverables: ['Competitive landscape', 'Gap analysis', 'Market trends summary'],
      tools: ['Scout_Ang', 'Lab_Ang', 'deerflow', 'browser-use'],
      gateCondition: 'Market landscape documented with identified gaps.',
    },
    {
      id: 'seed',
      name: 'Seed',
      objective: 'Plant the seed. Define the minimum viable concept.',
      keyQuestions: [
        'What is the ONE feature that proves this idea works?',
        'What is the simplest version you could launch this week?',
        'Who are your first 10 customers?',
        'What does a successful pilot look like?',
      ],
      deliverables: ['MVP definition', 'First customer list', 'Pilot success criteria'],
      tools: ['Chronicle_Ang', 'Buildsmith'],
      gateCondition: 'MVP defined with first customer list.',
    },
    {
      id: 'tend',
      name: 'Tend',
      objective: 'Tend the growth. Build, measure, learn. Iterate fast.',
      keyQuestions: [
        'What feedback are you getting from early users?',
        'What is working? What is not?',
        'What needs to change based on real data?',
        'What is the next feature that unlocks growth?',
      ],
      deliverables: ['User feedback synthesis', 'Iteration plan', 'Growth metrics'],
      tools: ['Lab_Ang', 'Buildsmith', 'OpsConsole_Ang'],
      gateCondition: 'At least one iteration completed based on user feedback.',
    },
    {
      id: 'expand',
      name: 'Expand',
      objective: 'Scale what works. Cut what doesn\'t. Grow sustainably.',
      keyQuestions: [
        'What channels drive the most growth?',
        'What operational constraints will you hit at 10x scale?',
        'What partnerships or integrations accelerate growth?',
        'What is the unit economics at scale?',
      ],
      deliverables: ['Growth strategy', 'Scale plan', 'Unit economics model'],
      tools: ['Scout_Ang', 'OpsConsole_Ang', 'Dockmaster_Ang'],
      gateCondition: 'Growth channels identified with scalable unit economics.',
    },
    {
      id: 'root',
      name: 'Root',
      objective: 'Root the business. Make it self-sustaining. Defensible.',
      keyQuestions: [
        'What moats protect this business?',
        'What would it take for a competitor to replicate this?',
        'Is the team structure right for the next stage?',
        'What does the 3-year vision look like?',
      ],
      deliverables: ['Competitive moats document', '3-year roadmap', 'Team structure plan'],
      tools: ['Chronicle_Ang', 'Scout_Ang'],
      gateCondition: 'Business is self-sustaining with documented competitive moats.',
    },
  ],
  acheevy_behavior: `
[METHODOLOGY: FOSTER — Nurture to Sustainability]
You are a patient but demanding growth advisor.
- Start small. The user has a seed — don't overwhelm them with enterprise thinking.
- In Frame, challenge vague ideas. "Everyone" is not a target market.
- In Observe, do the research. Show them what exists and where the gaps are.
- In Seed, push for the SMALLEST possible MVP. One feature. Ten customers.
- In Tend, demand feedback loops. No building in a vacuum.
- In Expand and Root, shift to systems thinking and defensibility.
- Tone: Nurturing but honest. Like a mentor who believes in you but won't let you ship garbage.
`.trim(),
};

// ---------------------------------------------------------------------------
// DEVELOP — Proprietary: Structured Build-Out
// ---------------------------------------------------------------------------

const DEVELOP: MethodologyDefinition = {
  id: 'develop',
  name: 'DEVELOP',
  purpose: 'Take a validated idea through structured, milestone-driven build-out.',
  when: 'Use when the idea is validated and it\'s time to build. Post-FOSTER or post-DMADV.',
  phases: [
    {
      id: 'discover',
      name: 'Discover',
      objective: 'Deep discovery. Technical requirements, constraints, dependencies.',
      keyQuestions: [
        'What are the technical requirements?',
        'What dependencies exist?',
        'What is the technology stack?',
        'What integrations are needed?',
        'What are the non-functional requirements (performance, security, scale)?',
      ],
      deliverables: ['Technical requirements document', 'Dependency map', 'Stack decision'],
      tools: ['Buildsmith', 'Scout_Ang', 'Lab_Ang'],
      gateCondition: 'Technical requirements documented and stack decision made.',
    },
    {
      id: 'engineer',
      name: 'Engineer',
      objective: 'Architecture and design. Blueprint before building.',
      keyQuestions: [
        'What is the system architecture?',
        'How do components communicate?',
        'What is the data model?',
        'How does authentication and authorization work?',
        'What is the deployment architecture?',
      ],
      deliverables: ['Architecture diagram', 'Data model', 'API contracts', 'Deployment plan'],
      tools: ['Buildsmith', 'Chicken Hawk'],
      gateCondition: 'Architecture reviewed and approved. API contracts defined.',
    },
    {
      id: 'validate',
      name: 'Validate',
      objective: 'Build a working prototype. Test critical assumptions.',
      keyQuestions: [
        'Does the core flow work end-to-end?',
        'What edge cases break it?',
        'Is performance acceptable?',
        'Does it integrate with required systems?',
      ],
      deliverables: ['Working prototype', 'Test results', 'Performance benchmarks'],
      tools: ['Chicken Hawk', 'Runner_Ang', 'Lab_Ang'],
      gateCondition: 'Prototype passes core flow tests with acceptable performance.',
    },
    {
      id: 'execute',
      name: 'Execute',
      objective: 'Full implementation. Sprint by sprint. Ship incrementally.',
      keyQuestions: [
        'What is the sprint plan?',
        'What is the priority order?',
        'What blockers exist?',
        'Are we on track for delivery milestones?',
      ],
      deliverables: ['Sprint deliverables', 'Progress reports', 'Blocker resolutions'],
      tools: ['Chicken Hawk', 'Buildsmith', 'Runner_Ang', 'OpsConsole_Ang'],
      gateCondition: 'All sprint deliverables complete. Integration tests passing.',
    },
    {
      id: 'launch',
      name: 'Launch',
      objective: 'Deploy to production. Monitor. Celebrate. Then iterate.',
      keyQuestions: [
        'Is the deployment checklist complete?',
        'Are monitoring and alerts configured?',
        'Is user documentation ready?',
        'What is the rollback plan?',
        'What is the Day 1 support plan?',
      ],
      deliverables: ['Production deployment', 'Monitoring setup', 'User documentation', 'Support plan'],
      tools: ['Dockmaster_Ang', 'OpsConsole_Ang', 'Chronicle_Ang'],
      gateCondition: 'Production deployed with monitoring, docs, and support plan in place.',
    },
    {
      id: 'optimize',
      name: 'Optimize',
      objective: 'Post-launch optimization. Fix, tune, enhance based on real usage.',
      keyQuestions: [
        'What are users actually doing vs. what we expected?',
        'Where are the performance bottlenecks?',
        'What feature requests are most common?',
        'What technical debt needs addressing?',
      ],
      deliverables: ['Usage analytics', 'Optimization report', 'V2 backlog'],
      tools: ['Lab_Ang', 'OpsConsole_Ang', 'Buildsmith'],
      gateCondition: 'Post-launch optimization cycle complete. V2 backlog prioritized.',
    },
    {
      id: 'perpetuate',
      name: 'Perpetuate',
      objective: 'Hand off for ongoing operations. Ensure continuity.',
      keyQuestions: [
        'Who owns this going forward?',
        'Is the runbook complete?',
        'Are SLAs defined and monitored?',
        'What is the maintenance plan?',
      ],
      deliverables: ['Runbook', 'SLA definitions', 'Maintenance plan', 'Ownership assignment'],
      tools: ['OpsConsole_Ang', 'Chronicle_Ang', 'Gatekeeper_Ang'],
      gateCondition: 'Ownership transferred. SLAs active. Runbook documented.',
    },
  ],
  acheevy_behavior: `
[METHODOLOGY: DEVELOP — Structured Build-Out]
You are a disciplined engineering lead running a build program.
- Every phase has milestones. Track them.
- In Discover, leave no assumption unchecked.
- In Engineer, insist on diagrams and contracts before code.
- In Execute, run sprints. Report progress. Flag blockers early.
- In Launch, the checklist is law. No shortcuts to production.
- In Optimize, data from real usage drives decisions, not opinions.
- Tone: Systematic, thorough, delivery-focused. Ship it right.
`.trim(),
};

// ---------------------------------------------------------------------------
// HONE — Proprietary: Refine and Sharpen
// ---------------------------------------------------------------------------

const HONE: MethodologyDefinition = {
  id: 'hone',
  name: 'HONE',
  purpose: 'Refine and sharpen something that already works but could be excellent.',
  when: 'Use when the product/service/process is functional but needs polish, performance, or competitive edge.',
  phases: [
    {
      id: 'highlight',
      name: 'Highlight',
      objective: 'Identify what\'s working well and what needs sharpening.',
      keyQuestions: [
        'What is your biggest strength right now?',
        'Where do you get the most positive feedback?',
        'What feels "almost there" but not quite?',
        'What do your best competitors do better than you?',
      ],
      deliverables: ['Strengths inventory', 'Improvement candidates', 'Competitive gaps'],
      tools: ['Scout_Ang', 'Lab_Ang'],
      gateCondition: 'Clear list of strengths to protect and weaknesses to sharpen.',
    },
    {
      id: 'operate',
      name: 'Operate',
      objective: 'Operate on the weak points. Targeted, surgical improvements.',
      keyQuestions: [
        'What is the highest-impact improvement we can make?',
        'What is the effort level for each improvement?',
        'Which improvements are quick wins vs. long-term investments?',
        'What trade-offs does each improvement introduce?',
      ],
      deliverables: ['Prioritized improvement plan', 'Quick wins list', 'Long-term investment roadmap'],
      tools: ['Buildsmith', 'Patchsmith_Ang', 'Runner_Ang'],
      gateCondition: 'Improvement plan prioritized by impact and effort.',
    },
    {
      id: 'narrow',
      name: 'Narrow',
      objective: 'Narrow focus. Do fewer things but do them exceptionally well.',
      keyQuestions: [
        'What can we STOP doing without hurting the business?',
        'What features or services are distractions?',
        'Where does simplification improve the user experience?',
        'What is the "less but better" version?',
      ],
      deliverables: ['Feature kill list', 'Simplified product vision', 'Focus areas'],
      tools: ['Chronicle_Ang', 'Lab_Ang'],
      gateCondition: 'Scope reduced to high-impact focus areas.',
    },
    {
      id: 'elevate',
      name: 'Elevate',
      objective: 'Elevate to excellence. The details that separate good from great.',
      keyQuestions: [
        'What would make a user say "wow"?',
        'Where can we exceed expectations?',
        'What polish and refinement is needed?',
        'How does this compare to the best in the market?',
      ],
      deliverables: ['Excellence checklist', 'Polish items', 'Market position comparison'],
      tools: ['Buildsmith', 'Showrunner_Ang', 'Lab_Ang'],
      gateCondition: 'Product/service elevated with documented quality improvements.',
    },
  ],
  acheevy_behavior: `
[METHODOLOGY: HONE — Refine to Excellence]
You are a master craftsperson helping refine what already works.
- Start by acknowledging what's GOOD. Don't treat everything as broken.
- In Highlight, be specific about strengths AND weaknesses.
- In Operate, push for surgical precision. Fix the 20% that creates 80% impact.
- In Narrow, be ruthless about cutting bloat. Less but better.
- In Elevate, obsess over details. The last 10% of polish is what separates good from great.
- Tone: Precise, appreciative, demanding of excellence. Like a master jeweler.
`.trim(),
};

// ---------------------------------------------------------------------------
// LOOK-LISTEN-LEARN — Proprietary: Engagement Triad
// ---------------------------------------------------------------------------

const LOOK_LISTEN_LEARN: MethodologyDefinition = {
  id: 'look-listen-learn',
  name: 'Look, Listen & Learn',
  purpose: 'The engagement triad for needs discovery. How ACHEEVY gathers intelligence during user interaction.',
  when: 'ALWAYS active during engagement. This is not a sequential process — it runs continuously, in parallel with other methodologies.',
  phases: [
    {
      id: 'look',
      name: 'Look',
      objective: 'Observe. Analyze documents, images, data. OCR. Visual intelligence.',
      keyQuestions: [
        'What documents or files has the user uploaded?',
        'What visual information is available?',
        'What does the data show that the user hasn\'t mentioned?',
        'What patterns are visible in the uploaded materials?',
      ],
      deliverables: ['Document analysis', 'OCR extraction', 'Visual pattern identification', 'Data insights'],
      tools: ['Scout_Ang', 'Lab_Ang', 'Index_Ang', 'browser-use'],
      gateCondition: 'All uploaded materials analyzed and key insights extracted.',
    },
    {
      id: 'listen',
      name: 'Listen',
      objective: 'Active listening. NLP analysis. Trigger detection. Read between the lines.',
      keyQuestions: [
        'What is the user explicitly asking for?',
        'What is the user implicitly saying (subtext)?',
        'What keywords indicate a shift in direction?',
        'What emotional signals are present (frustration, excitement, confusion)?',
        'What triggers indicate we should switch methodology or vertical?',
      ],
      deliverables: ['Intent classification', 'Trigger detection report', 'Subtext analysis', 'Emotional temperature'],
      tools: ['intent-analyzer', 'vertical-detection', 'personaplex'],
      gateCondition: 'User intent clearly understood, including subtext and triggers.',
    },
    {
      id: 'learn',
      name: 'Learn',
      objective: 'Adapt. Store patterns. Improve future interactions. Build institutional knowledge.',
      keyQuestions: [
        'What did this interaction teach us about the user?',
        'What patterns should be stored for future reference?',
        'How should ACHEEVY adapt its approach for next time?',
        'What knowledge should be added to the user\'s profile?',
      ],
      deliverables: ['User profile updates', 'Pattern storage', 'Behavioral adaptation notes', 'RAG knowledge entries'],
      tools: ['ByteRover', 'OpsConsole_Ang', 'Index_Ang'],
      gateCondition: 'Learnings captured and stored for future interactions.',
    },
  ],
  acheevy_behavior: `
[METHODOLOGY: LOOK-LISTEN-LEARN — Always Active]
This methodology runs CONTINUOUSLY during every engagement. It is not sequential.
- LOOK: When a user uploads a document, analyze it BEFORE asking questions about it.
  OCR everything. Extract structure, key terms, entities, numbers.
  Don't ask "what's in this document?" — tell them what you see.
- LISTEN: Active listening is not waiting for your turn to talk.
  Detect triggers: "I need a website" → don't jump to templates, LISTEN for requirements.
  Detect emotion: frustration → slow down, clarify. Excitement → channel it into action.
  Detect direction changes: user pivots → acknowledge and adapt, don't force the old path.
- LEARN: Every interaction is training data for the next one.
  Store user preferences. Remember their industry, goals, style.
  Adapt tone, methodology, and recommendations based on accumulated knowledge.
- Tone: Present but not intrusive. Like a great consultant who notices everything
  but only speaks when they have something valuable to add.
`.trim(),
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const METHODOLOGIES: Record<MethodologyId, MethodologyDefinition> = {
  'dmaic': DMAIC,
  'dmadv': DMADV,
  'foster': FOSTER,
  'develop': DEVELOP,
  'hone': HONE,
  'look-listen-learn': LOOK_LISTEN_LEARN,
};

// ---------------------------------------------------------------------------
// Methodology Engine
// ---------------------------------------------------------------------------

class MethodologyEngine {
  private sessions: Map<string, MethodologySession> = new Map();

  /** Get a methodology definition by ID */
  getMethodology(id: MethodologyId): MethodologyDefinition {
    const m = METHODOLOGIES[id];
    if (!m) throw new Error(`Unknown methodology: ${id}`);
    return m;
  }

  /** Get all methodology definitions */
  getAllMethodologies(): MethodologyDefinition[] {
    return Object.values(METHODOLOGIES);
  }

  /**
   * Recommend a methodology based on user context.
   * This is the decision engine: "which methodology fits this situation?"
   */
  recommend(context: {
    hasExistingSystem: boolean;
    isNewBuild: boolean;
    isEarlyIdea: boolean;
    needsRefinement: boolean;
    isEngagement: boolean;
  }): MethodologyId {
    // Look-Listen-Learn is ALWAYS active in addition to whatever else runs
    if (context.isEngagement) return 'look-listen-learn';
    if (context.isEarlyIdea) return 'foster';
    if (context.isNewBuild) return 'dmadv';
    if (context.needsRefinement) return 'hone';
    if (context.hasExistingSystem) return 'dmaic';
    return 'develop';
  }

  /**
   * Detect methodology from user message text.
   * Looks for linguistic signals that indicate which methodology fits.
   */
  detectFromMessage(message: string): MethodologyId | null {
    const lower = message.toLowerCase();

    // DMAIC signals — fixing, improving, optimizing existing
    const dmaicSignals = [
      'fix', 'broken', 'not working', 'slow', 'improve', 'optimize',
      'bottleneck', 'problem with', 'issue with', 'regression', 'degraded',
      'underperforming', 'failing', 'errors', 'bugs', 'defects',
    ];
    if (dmaicSignals.some(s => lower.includes(s))) return 'dmaic';

    // DMADV signals — building new, designing, creating from scratch
    const dmadvSignals = [
      'build from scratch', 'new product', 'new service', 'design',
      'create a new', 'start from zero', 'greenfield', 'brand new',
      'doesn\'t exist yet', 'first version', 'launch new',
    ];
    if (dmadvSignals.some(s => lower.includes(s))) return 'dmadv';

    // FOSTER signals — early idea, seed, concept
    const fosterSignals = [
      'idea', 'concept', 'what if', 'thinking about', 'maybe i could',
      'brainstorm', 'explore', 'possibility', 'potential', 'seed',
      'just starting', 'haven\'t started', 'early stage',
    ];
    if (fosterSignals.some(s => lower.includes(s))) return 'foster';

    // HONE signals — refine, polish, sharpen
    const honeSignals = [
      'refine', 'polish', 'sharpen', 'improve quality', 'almost there',
      'good but not great', 'needs polish', 'fine-tune', 'tweak',
      'make it better', 'competitive edge', 'stand out',
    ];
    if (honeSignals.some(s => lower.includes(s))) return 'hone';

    // DEVELOP signals — ready to build, validated
    const developSignals = [
      'ready to build', 'let\'s build', 'implementation', 'sprint',
      'architecture', 'deploy', 'ship it', 'develop', 'code it',
      'start building', 'engineering plan',
    ];
    if (developSignals.some(s => lower.includes(s))) return 'develop';

    return null;
  }

  /**
   * Start a methodology session.
   */
  startSession(
    methodologyId: MethodologyId,
    userId: string,
    sessionId: string,
    transactionId?: string,
  ): MethodologySession {
    const session: MethodologySession = {
      id: `meth-${uuidv4()}`,
      methodologyId,
      userId,
      sessionId,
      currentPhase: 0,
      phaseData: {},
      started: new Date().toISOString(),
      updated: new Date().toISOString(),
      status: 'active',
      transactionId,
    };

    this.sessions.set(session.id, session);
    return session;
  }

  /**
   * Advance to the next phase if the gate condition is conceptually met.
   */
  advancePhase(
    methodSessionId: string,
    phaseData: Record<string, unknown>,
  ): { advanced: boolean; currentPhase: MethodologyPhase; isComplete: boolean } {
    const session = this.sessions.get(methodSessionId);
    if (!session) throw new Error(`Methodology session ${methodSessionId} not found`);

    const methodology = this.getMethodology(session.methodologyId);
    const currentPhase = methodology.phases[session.currentPhase];

    // Store data for current phase
    session.phaseData[currentPhase.id] = phaseData;
    session.updated = new Date().toISOString();

    // Check if there's a next phase
    const nextIndex = session.currentPhase + 1;
    if (nextIndex >= methodology.phases.length) {
      session.status = 'completed';
      return {
        advanced: false,
        currentPhase,
        isComplete: true,
      };
    }

    // Advance
    session.currentPhase = nextIndex;
    const nextPhase = methodology.phases[nextIndex];

    return {
      advanced: true,
      currentPhase: nextPhase,
      isComplete: false,
    };
  }

  /**
   * Get the current phase prompt for ACHEEVY's behavior.
   */
  getCurrentPrompt(methodSessionId: string): string {
    const session = this.sessions.get(methodSessionId);
    if (!session) throw new Error(`Methodology session ${methodSessionId} not found`);

    const methodology = this.getMethodology(session.methodologyId);
    const phase = methodology.phases[session.currentPhase];

    return `${methodology.acheevy_behavior}

[CURRENT PHASE: ${phase.name}]
Objective: ${phase.objective}
Key Questions to Ask:
${phase.keyQuestions.map((q, i) => `  ${i + 1}. ${q}`).join('\n')}

Expected Deliverables:
${phase.deliverables.map(d => `  - ${d}`).join('\n')}

Gate Condition (must be met before advancing):
  ${phase.gateCondition}

Available Tools: ${phase.tools.join(', ')}

Phase ${session.currentPhase + 1} of ${methodology.phases.length} in ${methodology.name}.
Collected data from previous phases: ${Object.keys(session.phaseData).length > 0 ? JSON.stringify(session.phaseData) : 'None yet'}`;
  }

  /** Get a session */
  getSession(methodSessionId: string): MethodologySession | undefined {
    return this.sessions.get(methodSessionId);
  }

  /** Get active sessions for a user */
  getUserSessions(userId: string): MethodologySession[] {
    return Array.from(this.sessions.values())
      .filter(s => s.userId === userId && s.status === 'active');
  }

  // ── Thinking Level Bridge ──────────────────────────────────────────
  // Maps (methodology + phase) → recommended Gemini 3.1 Pro thinking level.
  //
  // The logic: conversational/discovery phases → MEDIUM (quality without cost).
  //            Analysis/design/reasoning phases → HIGH (deep think).
  //            Monitoring/control/routine phases → LOW (save tokens).
  //
  // This feeds into Model Intelligence: when ACHEEVY is running a methodology,
  // the thinking level is driven by WHERE we are in the methodology, not just
  // what the task text looks like.

  /**
   * Get recommended thinking level for the current methodology phase.
   * This overrides Model Intelligence's text-based classification when
   * a methodology session is active — because the phase context is
   * more precise than NLP task detection.
   */
  getThinkingLevelForPhase(methodSessionId: string): 'low' | 'medium' | 'high' {
    const session = this.sessions.get(methodSessionId);
    if (!session) return 'medium'; // Safe default

    return this.getPhaseThinkingLevel(session.methodologyId, session.currentPhase);
  }

  /**
   * Static mapping: methodology + phase index → thinking level.
   * Used for both active sessions and pre-planning cost estimates.
   */
  getPhaseThinkingLevel(methodologyId: MethodologyId, phaseIndex: number): 'low' | 'medium' | 'high' {
    const methodology = METHODOLOGIES[methodologyId];
    if (!methodology) return 'medium';
    const phase = methodology.phases[phaseIndex];
    if (!phase) return 'medium';

    // Phase-specific thinking level mapping:
    //
    // DMAIC:
    //   Define (conversational discovery) → MEDIUM
    //   Measure (data collection) → MEDIUM
    //   Analyze (root cause — deep reasoning) → HIGH
    //   Improve (build/deploy — code gen) → HIGH
    //   Control (monitoring setup — routine) → LOW
    //
    // DMADV:
    //   Define (voice of customer) → MEDIUM
    //   Measure (market research) → MEDIUM
    //   Analyze (trade-off analysis — deep reasoning) → HIGH
    //   Design (architecture + implementation — code gen) → HIGH
    //   Verify (CTQ testing — structured validation) → MEDIUM
    //
    // FOSTER:
    //   Frame (idea articulation) → LOW
    //   Observe (landscape research) → MEDIUM
    //   Seed (MVP definition) → MEDIUM
    //   Tend (iterate from feedback) → MEDIUM
    //   Expand (scale planning) → HIGH
    //   Root (strategic moats) → HIGH
    //
    // DEVELOP:
    //   Discover (technical requirements) → MEDIUM
    //   Engineer (architecture design) → HIGH
    //   Validate (prototype testing) → MEDIUM
    //   Execute (sprint implementation) → HIGH
    //   Launch (deployment) → MEDIUM
    //   Optimize (post-launch tuning) → MEDIUM
    //   Perpetuate (handoff — routine) → LOW
    //
    // HONE:
    //   Highlight (strengths inventory) → MEDIUM
    //   Operate (surgical improvements) → HIGH
    //   Narrow (scope reduction) → MEDIUM
    //   Elevate (excellence polish) → HIGH
    //
    // LOOK-LISTEN-LEARN:
    //   Look (document analysis) → MEDIUM
    //   Listen (NLP intent detection) → LOW
    //   Learn (pattern storage) → LOW

    const PHASE_THINKING_MAP: Record<string, Record<string, 'low' | 'medium' | 'high'>> = {
      dmaic: {
        define: 'medium', measure: 'medium', analyze: 'high', improve: 'high', control: 'low',
      },
      dmadv: {
        define: 'medium', measure: 'medium', analyze: 'high', design: 'high', verify: 'medium',
      },
      foster: {
        frame: 'low', observe: 'medium', seed: 'medium', tend: 'medium', expand: 'high', root: 'high',
      },
      develop: {
        discover: 'medium', engineer: 'high', validate: 'medium', execute: 'high',
        launch: 'medium', optimize: 'medium', perpetuate: 'low',
      },
      hone: {
        highlight: 'medium', operate: 'high', narrow: 'medium', elevate: 'high',
      },
      'look-listen-learn': {
        look: 'medium', listen: 'low', learn: 'low',
      },
    };

    const methodMap = PHASE_THINKING_MAP[methodologyId];
    if (!methodMap) return 'medium';
    return methodMap[phase.id] || 'medium';
  }

  /**
   * Get cost estimate for an entire methodology run using thinking levels.
   * Returns estimated savings vs. running everything at HIGH.
   */
  estimateMethodologyCost(methodologyId: MethodologyId): {
    phases: Array<{ name: string; thinkingLevel: 'low' | 'medium' | 'high'; costMultiplier: number }>;
    averageCostMultiplier: number;
    estimatedSavingsPercent: number;
  } {
    const methodology = METHODOLOGIES[methodologyId];
    if (!methodology) throw new Error(`Unknown methodology: ${methodologyId}`);

    const costMultipliers: Record<string, number> = { low: 0.3, medium: 0.6, high: 1.0 };

    const phases = methodology.phases.map((phase, i) => {
      const level = this.getPhaseThinkingLevel(methodologyId, i);
      return { name: phase.name, thinkingLevel: level, costMultiplier: costMultipliers[level] };
    });

    const avgMultiplier = phases.reduce((sum, p) => sum + p.costMultiplier, 0) / phases.length;
    const savingsPercent = Math.round((1 - avgMultiplier) * 100);

    return { phases, averageCostMultiplier: avgMultiplier, estimatedSavingsPercent: savingsPercent };
  }
}

// ---------------------------------------------------------------------------
// Singleton Export
// ---------------------------------------------------------------------------

export const methodologyEngine = new MethodologyEngine();

// ---------------------------------------------------------------------------
// Re-export methodology definitions for Brain reference
// ---------------------------------------------------------------------------

export { DMAIC, DMADV, FOSTER, DEVELOP, HONE, LOOK_LISTEN_LEARN, METHODOLOGIES };
