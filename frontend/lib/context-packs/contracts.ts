import type { AchievyPersona } from '@/lib/acheevy/persona';
import type { MagazineSlot } from '@/lib/magazines/types';

export type ContextPackKind = 'persona-compat' | 'source-pack' | 'terminology-pack' | 'design-pack' | 'build-spec';

export interface ContextPackVoiceConfig {
  voiceId?: string;
}

export interface ContextPack {
  id: string;
  name: string;
  description: string;
  kind: ContextPackKind;
  sourcePackIds: string[];
  terminologyPackIds: string[];
  designPackIds: string[];
  buildSpecIds: string[];
  voiceConfig?: ContextPackVoiceConfig;
  compatibility?: {
    personaId?: string;
  };
}

export interface SourcePack {
  id: string;
  name: string;
  description: string;
  sourceIds: string[];
}

export interface TerminologyPack {
  id: string;
  name: string;
  description: string;
  lexiconIds: string[];
}

export interface DesignPack {
  id: string;
  name: string;
  description: string;
  assetIds: string[];
}

export interface BuildSpec {
  id: string;
  name: string;
  description: string;
  intent: string;
}

export interface WorkingNotebook {
  id: string;
  sessionId: string;
  contextPackIds: string[];
  sourcePackIds: string[];
  terminologyPackIds: string[];
  designPackIds: string[];
  buildSpecIds: string[];
}

export interface SessionContext {
  sessionId: string;
  selectedContextPackIds: string[];
  activeMagazineIds?: string[];
  selectedModel: string;
  selectedLanguage: string;
  speechOutputEnabled: boolean;
  workingNotebookId?: string;
  intent?: string;
}

export interface SessionSnapshot {
  id: string;
  sessionId: string;
  context: SessionContext;
  workingNotebook?: WorkingNotebook;
  executionAttachmentIds: string[];
  savedAt: string;
  status: 'draft' | 'synced';
}

export interface ContextPackOption {
  id: string;
  name: string;
  description: string;
  voiceId?: string;
  compatibilityPersonaId?: string;
}

function uniqueIds(ids: string[]) {
  return Array.from(new Set(ids.filter(Boolean)));
}

export function buildCompatibilityContextPackDefinitions(personas: AchievyPersona[]): ContextPack[] {
  return personas.map((persona) => ({
    id: persona.id,
    name: persona.name,
    description: persona.description,
    kind: 'persona-compat',
    sourcePackIds: [],
    terminologyPackIds: [],
    designPackIds: [],
    buildSpecIds: [],
    voiceConfig: persona.voiceId ? { voiceId: persona.voiceId } : undefined,
    compatibility: {
      personaId: persona.id,
    },
  }));
}

export function buildCompatibilityContextPacks(personas: AchievyPersona[]): ContextPackOption[] {
  return personas.map((persona) => ({
    id: persona.id,
    name: persona.name,
    description: persona.description,
    voiceId: persona.voiceId,
    compatibilityPersonaId: persona.id,
  }));
}

export function resolveCompatibilityPersonaId(
  selectedContextPackIds: string[],
  contextPackOptions: ContextPackOption[]
): string | undefined {
  const primaryContextPackId = selectedContextPackIds[0];
  return contextPackOptions.find((contextPack) => contextPack.id === primaryContextPackId)?.compatibilityPersonaId;
}

export function resolveContextPackVoiceId(
  selectedContextPackIds: string[],
  contextPackOptions: ContextPackOption[]
): string | undefined {
  const primaryContextPackId = selectedContextPackIds[0];
  return contextPackOptions.find((contextPack) => contextPack.id === primaryContextPackId)?.voiceId;
}

export function buildMagazineContextPacks(activeMagazineSlots: MagazineSlot[]): ContextPackOption[] {
  return activeMagazineSlots
    .filter((slot) => Boolean(slot.magazine))
    .map((slot) => ({
      id: slot.magazineId,
      name: slot.magazine?.name || `Magazine ${slot.slotIndex + 1}`,
      description: slot.magazine?.description || 'Loaded magazine context pack',
      voiceId: slot.magazine?.voiceConfig?.voiceId,
    }));
}

export function buildMagazineContextPackDefinitions(activeMagazineSlots: MagazineSlot[]): ContextPack[] {
  return activeMagazineSlots
    .filter((slot) => Boolean(slot.magazine))
    .map((slot) => ({
      id: slot.magazineId,
      name: slot.magazine?.name || `Magazine ${slot.slotIndex + 1}`,
      description: slot.magazine?.description || 'Loaded magazine context pack',
      kind: 'source-pack',
      sourcePackIds: slot.magazine ? [`magazine:${slot.magazine.id}:sources`] : [],
      terminologyPackIds: [],
      designPackIds: [],
      buildSpecIds: slot.magazine ? [`magazine:${slot.magazine.id}:system-prompt`] : [],
      voiceConfig: slot.magazine?.voiceConfig?.voiceId
        ? { voiceId: slot.magazine.voiceConfig.voiceId }
        : undefined,
    }));
}

export function composeWorkingNotebook(
  notebookId: string,
  sessionId: string,
  selectedContextPackIds: string[],
  contextPacks: ContextPack[]
): WorkingNotebook {
  const selectedContextPacks = contextPacks.filter((contextPack) =>
    selectedContextPackIds.includes(contextPack.id)
  );

  return {
    id: notebookId,
    sessionId,
    contextPackIds: uniqueIds(selectedContextPacks.map((contextPack) => contextPack.id)),
    sourcePackIds: uniqueIds(selectedContextPacks.flatMap((contextPack) => contextPack.sourcePackIds)),
    terminologyPackIds: uniqueIds(selectedContextPacks.flatMap((contextPack) => contextPack.terminologyPackIds)),
    designPackIds: uniqueIds(selectedContextPacks.flatMap((contextPack) => contextPack.designPackIds)),
    buildSpecIds: uniqueIds(selectedContextPacks.flatMap((contextPack) => contextPack.buildSpecIds)),
  };
}

export function mergeContextPackOptions(...groups: ContextPackOption[][]): ContextPackOption[] {
  const merged = new Map<string, ContextPackOption>();
  for (const group of groups) {
    for (const option of group) {
      if (!merged.has(option.id)) {
        merged.set(option.id, option);
      }
    }
  }
  return Array.from(merged.values());
}