/**
 * JSON_EXPERT_SQUAD — JSON Specialist Lil_Hawks
 *
 * Three Lil_Hawks that handle all JSON operations across the AIMS platform:
 * parsing, validation, transformation, schema generation, and n8n node config.
 *
 *   Lil_JSON_Parse_Hawk      — Validates, repairs, normalizes malformed JSON
 *   Lil_JSON_Transform_Hawk  — Transforms between schemas using field mapping with dot notation
 *   Lil_JSON_Schema_Hawk     — Generates JSON Schema 2020-12 from sample data
 *
 * Works closely with Node_Trigger_Ang and the WORKFLOW_SMITH_SQUAD.
 *
 * Doctrine: "Activity breeds Activity — shipped beats perfect."
 */

import { v4 as uuidv4 } from 'uuid';
import logger from '../../logger';
import { Agent, AgentTaskInput, AgentTaskOutput, makeOutput, failOutput } from '../types';
import { agentChat } from '../../llm';
import type { LilHawkProfile } from './types';

// ---------------------------------------------------------------------------
// Squad profiles
// ---------------------------------------------------------------------------

export const JSON_SQUAD_PROFILES: LilHawkProfile[] = [
  {
    id: 'Lil_JSON_Parse_Hawk',
    name: 'Lil_JSON_Parse_Hawk',
    squad: 'json-expert',
    role: 'JSON Parser — validates, repairs, and normalizes JSON payloads',
    gate: false,
  },
  {
    id: 'Lil_JSON_Transform_Hawk',
    name: 'Lil_JSON_Transform_Hawk',
    squad: 'json-expert',
    role: 'JSON Transformer — converts between schemas, maps fields, restructures payloads',
    gate: false,
  },
  {
    id: 'Lil_JSON_Schema_Hawk',
    name: 'Lil_JSON_Schema_Hawk',
    squad: 'json-expert',
    role: 'Schema Expert — generates JSON Schema, validates against specs, types n8n node configs',
    gate: true,
  },
];

// ---------------------------------------------------------------------------
// JSON Operations
// ---------------------------------------------------------------------------

/**
 * Attempt to parse and repair malformed JSON.
 * Handles common issues: trailing commas, single quotes, unquoted keys.
 */
function parseAndRepair(input: string): { valid: boolean; parsed?: unknown; errors: string[]; repaired?: string } {
  const errors: string[] = [];

  // Try direct parse first
  try {
    const parsed = JSON.parse(input);
    return { valid: true, parsed, errors: [] };
  } catch (e) {
    errors.push(`Direct parse failed: ${(e as Error).message}`);
  }

  // Attempt repairs
  let repaired = input;

  // Fix trailing commas
  repaired = repaired.replace(/,\s*([\]}])/g, '$1');

  // Fix single quotes → double quotes
  repaired = repaired.replace(/'/g, '"');

  // Fix unquoted keys
  repaired = repaired.replace(/(\{|,)\s*([a-zA-Z_]\w*)\s*:/g, '$1"$2":');

  try {
    const parsed = JSON.parse(repaired);
    errors.push('Repaired: trailing commas, quote style, unquoted keys');
    return { valid: true, parsed, errors, repaired };
  } catch (e) {
    errors.push(`Repair attempt failed: ${(e as Error).message}`);
  }

  return { valid: false, errors };
}

/**
 * Validate JSON against a basic schema (type checking, required fields).
 */
function validateAgainstSchema(
  data: unknown,
  schema: { required?: string[]; types?: Record<string, string> }
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (typeof data !== 'object' || data === null) {
    return { valid: false, errors: ['Root value must be an object'] };
  }

  const obj = data as Record<string, unknown>;

  // Check required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in obj) || obj[field] === undefined || obj[field] === null) {
        errors.push(`Missing required field: ${field}`);
      }
    }
  }

  // Check types
  if (schema.types) {
    for (const [field, expectedType] of Object.entries(schema.types)) {
      if (field in obj) {
        const actualType = Array.isArray(obj[field]) ? 'array' : typeof obj[field];
        if (actualType !== expectedType) {
          errors.push(`Field "${field}" expected ${expectedType}, got ${actualType}`);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Generate a JSON Schema from a sample object.
 */
function generateSchema(sample: unknown, title?: string): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: title || 'Generated Schema',
    type: inferType(sample),
  };

  if (typeof sample === 'object' && sample !== null && !Array.isArray(sample)) {
    const properties: Record<string, unknown> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(sample as Record<string, unknown>)) {
      properties[key] = { type: inferType(value) };
      if (value !== null && value !== undefined) {
        required.push(key);
      }
    }

    schema.properties = properties;
    schema.required = required;
  }

  if (Array.isArray(sample) && sample.length > 0) {
    schema.items = { type: inferType(sample[0]) };
  }

  return schema;
}

function inferType(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

/**
 * Transform JSON from one structure to another using a field mapping.
 */
function transformJson(
  input: Record<string, unknown>,
  mapping: Record<string, string>
): Record<string, unknown> {
  const output: Record<string, unknown> = {};

  for (const [targetField, sourceField] of Object.entries(mapping)) {
    // Support dot notation for nested access
    const value = getNestedValue(input, sourceField);
    if (value !== undefined) {
      setNestedValue(output, targetField, value);
    }
  }

  return output;
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!(parts[i] in current) || typeof current[parts[i]] !== 'object') {
      current[parts[i]] = {};
    }
    current = current[parts[i]] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]] = value;
}

// ---------------------------------------------------------------------------
// Squad Agent — unified executor
// ---------------------------------------------------------------------------

const profile = {
  id: 'json-expert-squad' as const,
  name: 'JSON_Expert_Squad',
  role: 'JSON Parsing, Transformation & Schema Specialist',
  capabilities: [
    { name: 'json-parsing', weight: 0.98 },
    { name: 'json-repair', weight: 0.95 },
    { name: 'json-transformation', weight: 0.95 },
    { name: 'json-schema', weight: 0.93 },
    { name: 'n8n-node-config', weight: 0.90 },
    { name: 'api-payload-validation', weight: 0.88 },
    { name: 'data-mapping', weight: 0.85 },
  ],
  maxConcurrency: 5,
};

const JSON_SYSTEM_PROMPT = `You are JSON_Expert_Squad, the JSON specialist team for A.I.M.S.

Your capabilities:
- Parse and repair malformed JSON (trailing commas, single quotes, unquoted keys)
- Transform JSON between different schemas and structures
- Generate JSON Schema from sample data
- Validate payloads against schemas
- Configure n8n node JSON (parameters, connections, credentials)
- Map fields between API responses and database models

Always output valid JSON when generating or transforming data.
When repairing, explain what was fixed.
When generating schemas, use JSON Schema 2020-12 draft.`;

async function execute(input: AgentTaskInput): Promise<AgentTaskOutput> {
  logger.info({ taskId: input.taskId }, '[JSON_Expert_Squad] Starting JSON task');

  try {
    const query = input.query.toLowerCase();
    const logs: string[] = [];

    // Detect operation type
    if (query.includes('parse') || query.includes('repair') || query.includes('fix')) {
      return handleParse(input, logs);
    }

    if (query.includes('schema') || query.includes('generate schema')) {
      return handleSchema(input, logs);
    }

    if (query.includes('transform') || query.includes('map') || query.includes('convert')) {
      return handleTransform(input, logs);
    }

    if (query.includes('validate') || query.includes('check')) {
      return handleValidate(input, logs);
    }

    // Default: use LLM for complex JSON tasks
    const llmResult = await agentChat({
      agentId: 'json-expert-squad',
      query: input.query,
      intent: input.intent,
      context: JSON_SYSTEM_PROMPT,
    });

    if (llmResult) {
      logs.push(`LLM model: ${llmResult.model}`);
      return makeOutput(
        input.taskId,
        'json-expert-squad',
        llmResult.content,
        ['[json-expert] LLM-powered analysis'],
        logs,
        llmResult.tokens.total,
        llmResult.cost.usd,
      );
    }

    return makeOutput(
      input.taskId,
      'json-expert-squad',
      `JSON analysis for: ${input.query}\n\nThe JSON Expert Squad can parse, repair, transform, validate, and generate schemas for any JSON payload. Specify the operation and provide the data.`,
      ['[json-expert] General guidance'],
      logs,
    );
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ taskId: input.taskId, err: errMsg }, '[JSON_Expert_Squad] Task failed');
    return failOutput(input.taskId, 'json-expert-squad', errMsg);
  }
}

function handleParse(input: AgentTaskInput, logs: string[]): AgentTaskOutput {
  // Try to extract JSON from the query or context
  const jsonStr = input.context?.json as string || extractJson(input.query);

  if (!jsonStr) {
    return makeOutput(
      input.taskId,
      'json-expert-squad',
      'Lil_JSON_Parse_Hawk ready. Provide JSON to parse/repair via context.json or inline in the query.',
      ['[json-parse] Awaiting input'],
      logs,
    );
  }

  const result = parseAndRepair(jsonStr);
  logs.push(...result.errors);

  if (result.valid) {
    const formatted = JSON.stringify(result.parsed, null, 2);
    const summary = result.repaired
      ? `JSON repaired and parsed successfully.\n\nRepairs applied: ${result.errors.join('; ')}\n\nResult:\n${formatted}`
      : `JSON is valid.\n\n${formatted}`;

    return makeOutput(
      input.taskId,
      'json-expert-squad',
      summary,
      ['[json-parse] Valid JSON'],
      logs,
    );
  }

  return makeOutput(
    input.taskId,
    'json-expert-squad',
    `JSON parsing failed after repair attempts.\n\nErrors:\n${result.errors.map(e => `- ${e}`).join('\n')}`,
    ['[json-parse] Failed'],
    logs,
  );
}

function handleSchema(input: AgentTaskInput, logs: string[]): AgentTaskOutput {
  const jsonStr = input.context?.json as string || extractJson(input.query);

  if (!jsonStr) {
    return makeOutput(
      input.taskId,
      'json-expert-squad',
      'Lil_JSON_Schema_Hawk ready. Provide a sample JSON object to generate a schema from.',
      ['[json-schema] Awaiting input'],
      logs,
    );
  }

  try {
    const sample = JSON.parse(jsonStr);
    const schema = generateSchema(sample, input.context?.title as string);
    const schemaStr = JSON.stringify(schema, null, 2);

    return makeOutput(
      input.taskId,
      'json-expert-squad',
      `JSON Schema generated:\n\n${schemaStr}`,
      ['[json-schema] Schema generated'],
      logs,
    );
  } catch (e) {
    return failOutput(input.taskId, 'json-expert-squad', `Cannot parse sample JSON: ${(e as Error).message}`);
  }
}

function handleTransform(input: AgentTaskInput, logs: string[]): AgentTaskOutput {
  const jsonStr = input.context?.json as string;
  const mapping = input.context?.mapping as Record<string, string>;

  if (!jsonStr || !mapping) {
    return makeOutput(
      input.taskId,
      'json-expert-squad',
      'Lil_JSON_Transform_Hawk ready. Provide context.json (source data) and context.mapping (field map: { targetField: "source.path" }).',
      ['[json-transform] Awaiting input'],
      logs,
    );
  }

  try {
    const source = JSON.parse(jsonStr);
    const transformed = transformJson(source, mapping);
    const result = JSON.stringify(transformed, null, 2);

    return makeOutput(
      input.taskId,
      'json-expert-squad',
      `JSON transformed:\n\n${result}`,
      ['[json-transform] Transformation complete'],
      logs,
    );
  } catch (e) {
    return failOutput(input.taskId, 'json-expert-squad', `Transform failed: ${(e as Error).message}`);
  }
}

function handleValidate(input: AgentTaskInput, logs: string[]): AgentTaskOutput {
  const jsonStr = input.context?.json as string;
  const schema = input.context?.schema as { required?: string[]; types?: Record<string, string> };

  if (!jsonStr) {
    return makeOutput(
      input.taskId,
      'json-expert-squad',
      'JSON validation ready. Provide context.json and context.schema ({ required: [...], types: { field: "string" } }).',
      ['[json-validate] Awaiting input'],
      logs,
    );
  }

  try {
    const data = JSON.parse(jsonStr);

    if (!schema) {
      // Just validate it's valid JSON
      return makeOutput(
        input.taskId,
        'json-expert-squad',
        `JSON is valid. Type: ${Array.isArray(data) ? 'array' : typeof data}. Keys: ${typeof data === 'object' && data !== null ? Object.keys(data).length : 'N/A'}`,
        ['[json-validate] Valid'],
        logs,
      );
    }

    const result = validateAgainstSchema(data, schema);

    return makeOutput(
      input.taskId,
      'json-expert-squad',
      result.valid
        ? 'JSON passes schema validation.'
        : `JSON schema validation failed:\n${result.errors.map(e => `- ${e}`).join('\n')}`,
      [result.valid ? '[json-validate] PASS' : '[json-validate] FAIL'],
      logs,
    );
  } catch (e) {
    return failOutput(input.taskId, 'json-expert-squad', `Validation failed: ${(e as Error).message}`);
  }
}

function extractJson(text: string): string | null {
  // Try to find JSON in the text (between braces or brackets)
  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) return braceMatch[0];
  const bracketMatch = text.match(/\[[\s\S]*\]/);
  if (bracketMatch) return bracketMatch[0];
  return null;
}

export const JSON_Expert_Squad: Agent = { profile, execute };
