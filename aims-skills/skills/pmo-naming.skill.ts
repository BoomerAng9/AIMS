/**
 * @skill pmo-naming
 * @version 1.1.0
 * @owner ACHEEVY
 * @description Enforces PMO Boomer_Ang naming conventions
 * @see chain-of-command/policies/handle-rules.json for canonical handle patterns
 */

import { SkillDefinition } from '../types/skills';

// PMO Department Managers - NO "Boomer_" prefix
const PMO_MANAGERS = [
  'CTO_Ang',  // Chief Technology Officer
  'CFO_Ang',  // Chief Financial Officer
  'COO_Ang',  // Chief Operating Officer
  'CMO_Ang',  // Chief Marketing Officer
  'CDO_Ang',  // Chief Data Officer
  'CPO_Ang',  // Chief Product Officer
] as const;

// Levels for each department
const LEVELS = ['Expert', 'Mid', 'Intern'] as const;

// Generate all valid level names (e.g., CTOExpert_Ang, CTOMid_Ang, CTOIntern_Ang)
const PMO_LEVELS = PMO_MANAGERS.flatMap(manager => {
  const dept = manager.replace('_Ang', ''); // CTO, CFO, etc.
  return LEVELS.map(level => `${dept}${level}_Ang`);
});

// Whitelisted anomaly Boomer_Angs (intentional exceptions to naming rules)
const ANOMALY_BOOMER_ANGS = [
  'Betty-Ann_Ang',   // HR PMO Manager / LUC specialist
  'Buildsmith_Ang',  // Builder specialist
  'AVVA NOON',       // SmelterOS Overseer (System-Level Entity — NOT a Boomer_Ang)
] as const;

// Blocked patterns - these should NEVER appear in PMO naming
const BLOCKED_PATTERNS = [
  /Boomer_[A-Z]{2,}_Ang/i,     // e.g., Boomer_CTO_Ang
  /Boomer_.*_Ang/i,            // Any Boomer_X_Ang pattern
  /[A-Z]+_BoomerAng/i,         // e.g., CTO_BoomerAng
  /BoomerAng_[A-Z]+/i,         // e.g., BoomerAng_CTO
];

export const PmoNamingSkill: SkillDefinition = {
  metadata: {
    name: 'pmo_naming_enforcement',
    version: '1.0.0',
    owner: 'ACHEEVY',
    description: 'Validates and enforces PMO Boomer_Ang naming conventions',
    category: 'governance',
    tags: ['pmo', 'naming', 'boomer_ang', 'validation'],
  },

  triggers: [
    {
      event: 'agent_definition',
      condition: 'agent.type === "boomer_ang"',
    },
    {
      event: 'schema_update',
      condition: 'schema.includes("boomer_ang") || schema.includes("Ang")',
    },
    {
      event: 'message_contains',
      condition: 'message matches Boomer_Ang naming pattern',
    },
  ],

  dependencies: {
    services: [],
    skills: ['identity_guard'],
  },

  inputs: {
    proposed_name: {
      type: 'string',
      required: true,
      description: 'The proposed Boomer_Ang name to validate',
    },
    context: {
      type: 'string',
      required: false,
      enum: ['pmo_manager', 'pmo_level', 'anomaly', 'other'],
      description: 'Context for the naming (helps determine which rules apply)',
    },
  },

  outputs: {
    is_valid: {
      type: 'boolean',
      description: 'Whether the name passes validation',
    },
    corrected_name: {
      type: 'string',
      required: false,
      description: 'Suggested correction if invalid',
    },
    violation_reason: {
      type: 'string',
      required: false,
      description: 'Explanation of why the name is invalid',
    },
  },

  behavior: {
    system_prompt: `
You are validating Boomer_Ang naming conventions for the A.I.M.S. PMO structure.

## Valid Naming Patterns

### PMO Managers (Department Heads)
Format: {DEPARTMENT}_Ang
Examples: CTO_Ang, CFO_Ang, COO_Ang, CMO_Ang, CDO_Ang, CPO_Ang

### PMO Levels (Team Members)
Format: {DEPARTMENT}{LEVEL}_Ang
Levels: Expert, Mid, Intern
Examples: CTOExpert_Ang, CFOMid_Ang, COOIntern_Ang

### Anomaly Boomer_Angs (Whitelisted Exceptions)
These are intentional exceptions with unique naming:
- Bett-Ann_Ang (Finance PMO Manager, LUC specialist)
- Buildsmith_Ang (Builder specialist)

## BLOCKED Patterns
These patterns are NEVER valid in PMO naming:
- Boomer_CTO_Ang (wrong - should be CTO_Ang)
- Boomer_CFO_Ang (wrong - should be CFO_Ang)
- CTO_BoomerAng (wrong format)
- BoomerAng_CTO (wrong format)

## Validation Rules
1. PMO managers have NO "Boomer_" prefix
2. PMO levels combine department + level + "_Ang" suffix
3. Anomalies are pre-approved exceptions only
4. Any "Boomer_X_Ang" pattern in PMO context is INVALID
`,

    execution_logic: async (context: any) => {
      const { proposed_name } = context;

      // Check if it's a valid PMO manager
      if (PMO_MANAGERS.includes(proposed_name as any)) {
        return { is_valid: true, category: 'pmo_manager' };
      }

      // Check if it's a valid PMO level
      if (PMO_LEVELS.includes(proposed_name)) {
        return { is_valid: true, category: 'pmo_level' };
      }

      // Check if it's a whitelisted anomaly
      if (ANOMALY_BOOMER_ANGS.includes(proposed_name as any)) {
        return { is_valid: true, category: 'anomaly' };
      }

      // Check for blocked patterns
      for (const pattern of BLOCKED_PATTERNS) {
        if (pattern.test(proposed_name)) {
          // Try to suggest a correction
          const corrected = proposed_name
            .replace(/^Boomer_/i, '')
            .replace(/_BoomerAng$/i, '_Ang')
            .replace(/^BoomerAng_/i, '');
          
          return {
            is_valid: false,
            corrected_name: corrected,
            violation_reason: `Invalid PMO naming pattern. "${proposed_name}" matches blocked pattern. Suggested: "${corrected}"`,
          };
        }
      }

      // If none of the above, it's not a recognized PMO name
      return {
        is_valid: false,
        violation_reason: `"${proposed_name}" is not a recognized PMO Boomer_Ang name. Valid managers: ${PMO_MANAGERS.join(', ')}. Valid anomalies: ${ANOMALY_BOOMER_ANGS.join(', ')}.`,
      };
    },
  },

  testing: {
    test_cases: [
      {
        name: 'Valid PMO Manager - CTO_Ang',
        inputs: { proposed_name: 'CTO_Ang' },
        expected_outputs: { is_valid: true, category: 'pmo_manager' },
      },
      {
        name: 'Valid PMO Level - CTOExpert_Ang',
        inputs: { proposed_name: 'CTOExpert_Ang' },
        expected_outputs: { is_valid: true, category: 'pmo_level' },
      },
      {
        name: 'Valid Anomaly - Bett-Ann_Ang',
        inputs: { proposed_name: 'Bett-Ann_Ang' },
        expected_outputs: { is_valid: true, category: 'anomaly' },
      },
      {
        name: 'Invalid - Boomer_CTO_Ang',
        inputs: { proposed_name: 'Boomer_CTO_Ang' },
        expected_outputs: { is_valid: false, corrected_name: 'CTO_Ang' },
      },
      {
        name: 'Invalid - Boomer_CFO_Ang',
        inputs: { proposed_name: 'Boomer_CFO_Ang' },
        expected_outputs: { is_valid: false, corrected_name: 'CFO_Ang' },
      },
    ],
  },
};

// Export valid names for use in other modules
export const VALID_PMO_NAMES = {
  managers: PMO_MANAGERS,
  levels: PMO_LEVELS,
  anomalies: ANOMALY_BOOMER_ANGS,
};

export default PmoNamingSkill;
