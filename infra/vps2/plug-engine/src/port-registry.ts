/**
 * A.I.M.S. Plug Engine — Port Registry
 * Manages port allocation for plug instances (51000-51999, 10-port blocks)
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export interface PortAllocation {
  plugId: string;
  basePort: number;
  ports: number[];
  allocatedAt: string;
}

interface PortState {
  allocations: PortAllocation[];
  lastUpdated: string;
}

const PORT_START = parseInt(process.env.PLUG_PORT_START || '51000');
const PORT_END = parseInt(process.env.PLUG_PORT_END || '51999');
const BLOCK_SIZE = 10;
const DATA_DIR = process.env.DATA_DIR || '/data';
const STATE_FILE = path.join(DATA_DIR, 'port-registry.json');

let state: PortState = { allocations: [], lastUpdated: new Date().toISOString() };

export async function loadState(): Promise<void> {
  try {
    if (existsSync(STATE_FILE)) {
      const raw = await readFile(STATE_FILE, 'utf-8');
      state = JSON.parse(raw);
    }
  } catch {
    console.warn('[port-registry] Could not load state, starting fresh');
  }
}

async function saveState(): Promise<void> {
  state.lastUpdated = new Date().toISOString();
  await mkdir(path.dirname(STATE_FILE), { recursive: true });
  await writeFile(STATE_FILE, JSON.stringify(state, null, 2));
}

export function getUsedPorts(): Set<number> {
  const used = new Set<number>();
  for (const alloc of state.allocations) {
    for (const p of alloc.ports) used.add(p);
  }
  return used;
}

export async function allocatePorts(plugId: string): Promise<PortAllocation> {
  const used = getUsedPorts();

  for (let base = PORT_START; base <= PORT_END - BLOCK_SIZE; base += BLOCK_SIZE) {
    const block = Array.from({ length: BLOCK_SIZE }, (_, i) => base + i);
    if (block.every(p => !used.has(p))) {
      const alloc: PortAllocation = {
        plugId,
        basePort: base,
        ports: block,
        allocatedAt: new Date().toISOString(),
      };
      state.allocations.push(alloc);
      await saveState();
      return alloc;
    }
  }

  throw new Error('No available port blocks in range');
}

export async function releasePorts(plugId: string): Promise<boolean> {
  const before = state.allocations.length;
  state.allocations = state.allocations.filter(a => a.plugId !== plugId);
  if (state.allocations.length < before) {
    await saveState();
    return true;
  }
  return false;
}

export function getPortsForPlug(plugId: string): PortAllocation | undefined {
  return state.allocations.find(a => a.plugId === plugId);
}

export function getAllAllocations(): PortAllocation[] {
  return [...state.allocations];
}

export function getAvailableSlots(): number {
  const totalBlocks = Math.floor((PORT_END - PORT_START + 1) / BLOCK_SIZE);
  return totalBlocks - state.allocations.length;
}
