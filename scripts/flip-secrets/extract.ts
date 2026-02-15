/**
 * Flip Secrets XLSX Extraction Script
 *
 * Extracts field definitions and formulas from the uploaded Flip Secrets
 * spreadsheets and generates the preset JSON files.
 *
 * Usage:
 *   npx ts-node scripts/flip-secrets/extract.ts
 *
 * Requirements:
 *   - Place spreadsheets in /assets/flip-secrets/
 *   - Install xlsx package: npm install xlsx
 */

import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

const ASSETS_DIR = path.join(__dirname, "../../assets/flip-secrets");
const OUTPUT_DIR = path.join(__dirname, "../../aims-tools/luc/presets/real-estate-flip");

const SPREADSHEET_FILES = [
  "Jake Leicht's Flip Secrets Ultimate Flip Calculator.xlsx",
  "FS_Flip_Calculator_Free_V1.3.xlsx",
];

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ExtractedField {
  id: string;
  name: string;
  type: "number" | "currency" | "percentage" | "string";
  category: string;
  cellRef: string;
  formula?: string;
  defaultValue?: number | string;
}

interface ExtractedFormula {
  id: string;
  name: string;
  expression: string;
  inputs: string[];
  cellRef: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Extraction Logic
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Flip Secrets Extraction Script ===\n");

  // Check for spreadsheet files
  const existingFiles: string[] = [];
  for (const file of SPREADSHEET_FILES) {
    const filePath = path.join(ASSETS_DIR, file);
    if (fs.existsSync(filePath)) {
      existingFiles.push(filePath);
      console.log(`Found: ${file}`);
    } else {
      console.log(`Not found: ${file}`);
    }
  }

  if (existingFiles.length === 0) {
    console.log("\nNo spreadsheet files found in assets/flip-secrets/");
    console.log("Please place the Flip Secrets spreadsheets in that directory.");
    console.log("\nGenerating placeholder preset from manual definitions...");
    await generatePlaceholderPreset();
    return;
  }

  // Process each spreadsheet
  const allFields: ExtractedField[] = [];
  const allFormulas: ExtractedFormula[] = [];

  for (const filePath of existingFiles) {
    console.log(`\nProcessing: ${path.basename(filePath)}`);
    const { fields, formulas } = extractFromSpreadsheet(filePath);
    allFields.push(...fields);
    allFormulas.push(...formulas);
  }

  // Deduplicate and merge
  const uniqueFields = deduplicateFields(allFields);
  const uniqueFormulas = deduplicateFormulas(allFormulas);

  console.log(`\nExtracted ${uniqueFields.length} fields and ${uniqueFormulas.length} formulas`);

  // Generate output files
  await generatePresetFiles(uniqueFields, uniqueFormulas);

  console.log("\nExtraction complete!");
}

function extractFromSpreadsheet(filePath: string): {
  fields: ExtractedField[];
  formulas: ExtractedFormula[];
} {
  const workbook = XLSX.readFile(filePath);
  const fields: ExtractedField[] = [];
  const formulas: ExtractedFormula[] = [];

  // Process each sheet
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    console.log(`  Sheet: ${sheetName}`);

    // Get range
    const range = XLSX.utils.decode_range(sheet["!ref"] || "A1:Z100");

    // Scan for input fields (look for common patterns)
    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = sheet[cellRef];

        if (!cell) continue;

        // Check if this looks like a label
        if (cell.t === "s" && isLikelyLabel(cell.v)) {
          // Check adjacent cell for value/formula
          const valueCellRef = XLSX.utils.encode_cell({ r: row, c: col + 1 });
          const valueCell = sheet[valueCellRef];

          if (valueCell) {
            const field = extractField(cell.v, valueCell, valueCellRef, sheetName);
            if (field) {
              fields.push(field);
            }

            if (valueCell.f) {
              const formula = extractFormula(cell.v, valueCell, valueCellRef);
              if (formula) {
                formulas.push(formula);
              }
            }
          }
        }
      }
    }
  }

  return { fields, formulas };
}

function isLikelyLabel(value: string): boolean {
  if (typeof value !== "string") return false;

  const labelPatterns = [
    /purchase/i,
    /price/i,
    /cost/i,
    /value/i,
    /repair/i,
    /arv/i,
    /roi/i,
    /profit/i,
    /loan/i,
    /rate/i,
    /commission/i,
    /closing/i,
    /holding/i,
    /total/i,
  ];

  return labelPatterns.some((pattern) => pattern.test(value));
}

function extractField(
  label: string,
  cell: XLSX.CellObject,
  cellRef: string,
  category: string
): ExtractedField | null {
  const id = labelToId(label);
  const type = inferFieldType(label, cell);

  return {
    id,
    name: label,
    type,
    category: category.toLowerCase(),
    cellRef,
    formula: cell.f,
    defaultValue: cell.t === "n" ? cell.v : undefined,
  };
}

function extractFormula(
  label: string,
  cell: XLSX.CellObject,
  cellRef: string
): ExtractedFormula | null {
  if (!cell.f) return null;

  const id = labelToId(label);
  const inputs = extractFormulaInputs(cell.f);

  return {
    id,
    name: label,
    expression: convertExcelFormula(cell.f),
    inputs,
    cellRef,
  };
}

function labelToId(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .replace(/_+/g, "_");
}

function inferFieldType(
  label: string,
  cell: XLSX.CellObject
): "number" | "currency" | "percentage" | "string" {
  const lowerLabel = label.toLowerCase();

  if (lowerLabel.includes("%") || lowerLabel.includes("percent") || lowerLabel.includes("rate")) {
    return "percentage";
  }

  if (
    lowerLabel.includes("price") ||
    lowerLabel.includes("cost") ||
    lowerLabel.includes("value") ||
    lowerLabel.includes("profit") ||
    lowerLabel.includes("$")
  ) {
    return "currency";
  }

  if (cell.t === "n") {
    return "number";
  }

  return "string";
}

function extractFormulaInputs(formula: string): string[] {
  // Extract cell references from formula
  const cellRefs = formula.match(/[A-Z]+[0-9]+/g) || [];
  // This is simplified - in production we'd map cell refs to field IDs
  return [...new Set(cellRefs)];
}

function convertExcelFormula(excelFormula: string): string {
  // Convert Excel formula syntax to JavaScript
  // This is a simplified conversion
  let js = excelFormula
    .replace(/\^/g, "**") // Exponentiation
    .replace(/,/g, ", ") // Clean up spacing
    .replace(/IF\(/gi, "(") // IF statements (simplified)
    .replace(/SUM\(/gi, "(") // SUM (simplified)
    .replace(/MAX\(/gi, "Math.max(")
    .replace(/MIN\(/gi, "Math.min(")
    .replace(/ABS\(/gi, "Math.abs(")
    .replace(/ROUND\(/gi, "Math.round(");

  return js;
}

function deduplicateFields(fields: ExtractedField[]): ExtractedField[] {
  const seen = new Map<string, ExtractedField>();
  for (const field of fields) {
    if (!seen.has(field.id)) {
      seen.set(field.id, field);
    }
  }
  return [...seen.values()];
}

function deduplicateFormulas(formulas: ExtractedFormula[]): ExtractedFormula[] {
  const seen = new Map<string, ExtractedFormula>();
  for (const formula of formulas) {
    if (!seen.has(formula.id)) {
      seen.set(formula.id, formula);
    }
  }
  return [...seen.values()];
}

async function generatePresetFiles(
  fields: ExtractedField[],
  formulas: ExtractedFormula[]
): Promise<void> {
  // Generate preset.json
  const preset = {
    id: "real-estate-flip",
    name: "Real Estate Flip Calculator",
    version: "1.0.0",
    description: "Auto-extracted from Flip Secrets spreadsheets",
    category: "real-estate",
    inputFields: fields
      .filter((f) => !f.formula)
      .map((f) => ({
        id: f.id,
        name: f.name,
        type: f.type,
        category: f.category,
        defaultValue: f.defaultValue,
        constraints: { min: 0 },
      })),
    outputFields: fields
      .filter((f) => f.formula)
      .map((f) => ({
        id: f.id,
        name: f.name,
        type: f.type,
      })),
    formulas: [],
    testCases: [],
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIR, "preset.extracted.json"),
    JSON.stringify(preset, null, 2)
  );

  // Generate formulas.json
  const formulasObj = {
    version: "1.0.0",
    source: "auto-extracted",
    formulas: formulas.map((f) => ({
      id: f.id,
      name: f.name,
      expression: f.expression,
      inputs: f.inputs,
      outputType: "number",
    })),
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIR, "formulas.extracted.json"),
    JSON.stringify(formulasObj, null, 2)
  );

  console.log("\nGenerated:");
  console.log(`  ${OUTPUT_DIR}/preset.extracted.json`);
  console.log(`  ${OUTPUT_DIR}/formulas.extracted.json`);
}

async function generatePlaceholderPreset(): Promise<void> {
  console.log("\nUsing manually defined preset (preset.json already exists)");
  console.log("To extract from spreadsheets, add them to assets/flip-secrets/");
}

// ─────────────────────────────────────────────────────────────────────────────
// Run
// ─────────────────────────────────────────────────────────────────────────────

main().catch(console.error);
