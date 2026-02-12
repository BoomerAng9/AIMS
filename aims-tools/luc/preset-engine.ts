/**
 * LUC Preset Engine
 *
 * Headless calculation engine for preset-based calculators.
 * All math lives here - UI components only call this engine.
 */

import type { Preset, PresetField, PresetFormula } from "./luc.schemas";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface PresetInputs {
  [fieldId: string]: string | number | boolean;
}

export interface PresetOutputs {
  [fieldId: string]: string | number | boolean | string[] | undefined;
  _errors?: string[];
  _warnings?: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: { fieldId: string; message: string }[];
}

export interface CalculationResult {
  success: boolean;
  outputs: PresetOutputs;
  intermediates?: Record<string, number>;
  executionTimeMs: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Preset Engine
// ─────────────────────────────────────────────────────────────────────────────

export class PresetEngine {
  private preset: Preset;

  constructor(preset: Preset) {
    this.preset = preset;
  }

  /**
   * Validate inputs against field constraints
   */
  validateInputs(inputs: PresetInputs): ValidationResult {
    const errors: { fieldId: string; message: string }[] = [];

    for (const field of this.preset.inputFields) {
      const value = inputs[field.id];

      // Check required
      if (field.constraints?.required && (value === undefined || value === "")) {
        errors.push({ fieldId: field.id, message: `${field.name} is required` });
        continue;
      }

      // Type validation
      if (value !== undefined && value !== "") {
        switch (field.type) {
          case "number":
          case "currency":
          case "percentage":
            if (typeof value !== "number" || isNaN(value)) {
              errors.push({ fieldId: field.id, message: `${field.name} must be a number` });
            } else {
              // Range validation
              if (field.constraints?.min !== undefined && value < field.constraints.min) {
                errors.push({
                  fieldId: field.id,
                  message: `${field.name} must be at least ${field.constraints.min}`,
                });
              }
              if (field.constraints?.max !== undefined && value > field.constraints.max) {
                errors.push({
                  fieldId: field.id,
                  message: `${field.name} must be at most ${field.constraints.max}`,
                });
              }
            }
            break;

          case "boolean":
            if (typeof value !== "boolean") {
              errors.push({ fieldId: field.id, message: `${field.name} must be true or false` });
            }
            break;

          case "string":
            if (typeof value !== "string") {
              errors.push({ fieldId: field.id, message: `${field.name} must be text` });
            } else if (field.constraints?.pattern) {
              const regex = new RegExp(field.constraints.pattern);
              if (!regex.test(value)) {
                errors.push({ fieldId: field.id, message: `${field.name} format is invalid` });
              }
            }
            break;
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Execute all formulas and calculate outputs
   */
  calculate(inputs: PresetInputs): CalculationResult {
    const startTime = performance.now();
    const outputs: PresetOutputs = {};
    const intermediates: Record<string, number> = {};
    const errors: string[] = [];
    const warnings: string[] = [];

    // Build execution context with inputs and defaults
    const context: Record<string, any> = {};

    for (const field of this.preset.inputFields) {
      const value = inputs[field.id];
      if (value !== undefined) {
        context[field.id] = this.coerceValue(value, field.type);
      } else if (field.defaultValue !== undefined) {
        context[field.id] = this.coerceValue(field.defaultValue, field.type);
      } else {
        context[field.id] = this.getDefaultForType(field.type);
      }
    }

    // Sort formulas by dependency order (topological sort)
    const sortedFormulas = this.sortFormulasByDependency(this.preset.formulas);

    // Execute formulas in order
    for (const formula of sortedFormulas) {
      try {
        const result = this.evaluateFormula(formula, context);
        context[formula.id] = result;
        intermediates[formula.id] = result as number;

        // Check if this is an output field
        const outputField = this.preset.outputFields.find((f) => f.id === formula.id);
        if (outputField) {
          outputs[formula.id] = this.formatOutput(result, outputField.type);
        }
      } catch (error) {
        errors.push(`Error calculating ${formula.name}: ${(error as Error).message}`);
        context[formula.id] = 0;
      }
    }

    // Add any static output fields
    for (const field of this.preset.outputFields) {
      if (outputs[field.id] === undefined && context[field.id] !== undefined) {
        outputs[field.id] = context[field.id];
      }
    }

    // Add warnings for unusual values
    if (intermediates["roi"] !== undefined && intermediates["roi"] > 100) {
      warnings.push("ROI exceeds 100% - please verify your inputs");
    }
    if (intermediates["profit"] !== undefined && intermediates["profit"] < 0) {
      warnings.push("This deal shows a projected loss");
    }

    outputs._errors = errors;
    outputs._warnings = warnings;

    return {
      success: errors.length === 0,
      outputs,
      intermediates,
      executionTimeMs: performance.now() - startTime,
    };
  }

  /**
   * Run test cases and return results
   */
  runTests(): { passed: number; failed: number; results: TestResult[] } {
    if (!this.preset.testCases) {
      return { passed: 0, failed: 0, results: [] };
    }

    const results: TestResult[] = [];
    let passed = 0;
    let failed = 0;

    for (const testCase of this.preset.testCases) {
      const calcResult = this.calculate(testCase.inputs);
      const testResult: TestResult = {
        name: testCase.name,
        passed: true,
        failures: [],
      };

      for (const [key, expected] of Object.entries(testCase.expectedOutputs)) {
        const actual = calcResult.outputs[key];
        if (!this.compareValues(actual, expected)) {
          testResult.passed = false;
          testResult.failures.push({
            field: key,
            expected,
            actual,
          });
        }
      }

      if (testResult.passed) {
        passed++;
      } else {
        failed++;
      }
      results.push(testResult);
    }

    return { passed, failed, results };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private Helpers
  // ─────────────────────────────────────────────────────────────────────────

  private coerceValue(
    value: string | number | boolean,
    type: string
  ): string | number | boolean {
    switch (type) {
      case "number":
      case "currency":
      case "percentage":
        return typeof value === "number" ? value : parseFloat(String(value)) || 0;
      case "boolean":
        return typeof value === "boolean" ? value : value === "true";
      default:
        return String(value);
    }
  }

  private getDefaultForType(type: string): string | number | boolean {
    switch (type) {
      case "number":
      case "currency":
      case "percentage":
        return 0;
      case "boolean":
        return false;
      default:
        return "";
    }
  }

  private formatOutput(
    value: number | string | boolean,
    type: string
  ): number | string | boolean {
    if (typeof value !== "number") return value;

    switch (type) {
      case "currency":
        return Math.round(value * 100) / 100;
      case "percentage":
        return Math.round(value * 1000) / 10; // One decimal place
      default:
        return value;
    }
  }

  private sortFormulasByDependency(formulas: PresetFormula[]): PresetFormula[] {
    // Build dependency graph
    const graph = new Map<string, Set<string>>();
    const formulaMap = new Map<string, PresetFormula>();

    for (const formula of formulas) {
      formulaMap.set(formula.id, formula);
      graph.set(formula.id, new Set(formula.inputs));
    }

    // Topological sort (Kahn's algorithm)
    const sorted: PresetFormula[] = [];
    const noIncoming = new Set<string>();

    // Find formulas with no formula dependencies (only input fields)
    for (const formula of formulas) {
      const deps = formula.inputs.filter((id) => formulaMap.has(id));
      if (deps.length === 0) {
        noIncoming.add(formula.id);
      }
    }

    while (noIncoming.size > 0) {
      const id = noIncoming.values().next().value!;
      noIncoming.delete(id);
      sorted.push(formulaMap.get(id)!);

      // Check other formulas that depend on this one
      graph.forEach((deps, otherId) => {
        if (deps.has(id)) {
          deps.delete(id);
          const remainingFormulaDeps = Array.from(deps).filter((d) => formulaMap.has(d));
          if (remainingFormulaDeps.length === 0) {
            noIncoming.add(otherId);
          }
        }
      });
    }

    // Check for cycles
    if (sorted.length !== formulas.length) {
      console.warn("[PresetEngine] Circular dependency detected in formulas");
      // Return original order as fallback
      return formulas;
    }

    return sorted;
  }

  private evaluateFormula(formula: PresetFormula, context: Record<string, any>): number {
    // Create a safe evaluation context
    const safeContext = { ...context };

    // Built-in functions
    const functions = {
      max: Math.max,
      min: Math.min,
      abs: Math.abs,
      round: Math.round,
      floor: Math.floor,
      ceil: Math.ceil,
      pow: Math.pow,
      sqrt: Math.sqrt,
      // Custom functions for real estate
      pmt: (rate: number, nper: number, pv: number) => {
        // Monthly payment calculation
        if (rate === 0) return pv / nper;
        const r = rate / 12;
        return (pv * r * Math.pow(1 + r, nper)) / (Math.pow(1 + r, nper) - 1);
      },
      percentOf: (value: number, percent: number) => value * (percent / 100),
    };

    // Build function with context variables
    const contextKeys = Object.keys(safeContext);
    const contextValues = contextKeys.map((k) => safeContext[k]);
    const funcKeys = Object.keys(functions);
    const funcValues = funcKeys.map((k) => (functions as any)[k]);

    try {
      // Create and execute function
      const fn = new Function(
        ...contextKeys,
        ...funcKeys,
        `"use strict"; return (${formula.expression});`
      );
      return fn(...contextValues, ...funcValues);
    } catch (error) {
      throw new Error(`Formula evaluation failed: ${(error as Error).message}`);
    }
  }

  private compareValues(actual: any, expected: any): boolean {
    if (typeof actual === "number" && typeof expected === "number") {
      // Allow small floating point differences
      return Math.abs(actual - expected) < 0.01;
    }
    return actual === expected;
  }
}

interface TestResult {
  name: string;
  passed: boolean;
  failures: { field: string; expected: any; actual: any }[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Preset Loading
// ─────────────────────────────────────────────────────────────────────────────

const presetCache = new Map<string, Preset>();

export async function loadPreset(presetId: string): Promise<Preset | null> {
  if (presetCache.has(presetId)) {
    return presetCache.get(presetId)!;
  }

  try {
    // In production, load from database
    // For now, try to load from file
    const presetPath = `@/aims-tools/luc/presets/${presetId}/preset.json`;
    const preset = await import(presetPath);
    presetCache.set(presetId, preset.default);
    return preset.default;
  } catch (error) {
    console.error(`[PresetEngine] Failed to load preset ${presetId}:`, error);
    return null;
  }
}

export function createPresetEngine(preset: Preset): PresetEngine {
  return new PresetEngine(preset);
}
