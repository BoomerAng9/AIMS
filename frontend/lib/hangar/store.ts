/**
 * Hangar Zustand Store — Global state for the Hangar World
 */

import { create } from 'zustand';
import type { HangarEvent, HangarEventType } from './eventSchema';
import type { HangarActor } from './actorRegistry';
import { createDefaultActors } from './actorRegistry';
import { transitionActor } from './stateMachine';
import type { PerformanceConfig } from './performanceGuard';
import { getDefaultPerformanceConfig } from './performanceGuard';
import { animationMap, animationDurations } from './animationMap';
import type { AnimationSequenceId } from './animationMap';

export interface TelemetryEntry {
  id: string;
  timestamp: number;
  label: string;
  detail: string;
  type: 'info' | 'action' | 'complete' | 'error';
}

interface HangarState {
  // Actors
  actors: HangarActor[];

  // Event stream
  events: HangarEvent[];
  currentPhase: HangarEventType | null;

  // Animation
  activeAnimation: AnimationSequenceId | null;
  animationProgress: number; // 0–1
  isAnimating: boolean;

  // Overlay
  overlayVisible: boolean;
  selectedActorId: string | null;

  // Telemetry
  telemetry: TelemetryEntry[];

  // Performance
  performanceConfig: PerformanceConfig;

  // Frame loop
  frameLoopActive: boolean;

  // Actions
  dispatchEvent: (event: HangarEvent) => void;
  updateActorState: (actorId: string, eventType: string) => void;
  updateActorPosition: (actorId: string, position: [number, number, number]) => void;
  setPhase: (phase: HangarEventType | null) => void;
  addTelemetryEntry: (entry: Omit<TelemetryEntry, 'id' | 'timestamp'>) => void;
  setPerformanceConfig: (config: PerformanceConfig) => void;
  setOverlayVisible: (visible: boolean) => void;
  selectActor: (actorId: string | null) => void;
  setAnimationProgress: (progress: number) => void;
  setActiveAnimation: (anim: AnimationSequenceId | null) => void;
  setFrameLoopActive: (active: boolean) => void;
  resetHangar: () => void;
}

export const useHangarStore = create<HangarState>((set, get) => ({
  actors: createDefaultActors(),
  events: [],
  currentPhase: null,
  activeAnimation: null,
  animationProgress: 0,
  isAnimating: false,
  overlayVisible: true,
  selectedActorId: null,
  telemetry: [],
  performanceConfig: getDefaultPerformanceConfig(),
  frameLoopActive: false,

  dispatchEvent: (event: HangarEvent) => {
    const animation = animationMap[event.event_type];
    const duration = animationDurations[animation];

    set((state) => ({
      events: [...state.events.slice(-50), event], // Keep last 50
      currentPhase: event.event_type,
      activeAnimation: animation,
      animationProgress: 0,
      isAnimating: true,
      frameLoopActive: true,
    }));

    // Auto-clear animation after duration
    setTimeout(() => {
      const current = get();
      if (current.activeAnimation === animation) {
        set({ isAnimating: false, animationProgress: 1 });
      }
    }, duration);
  },

  updateActorState: (actorId, eventType) => {
    set((state) => ({
      actors: state.actors.map((a) =>
        a.id === actorId ? { ...a, state: transitionActor(a.state, eventType) } : a
      ),
    }));
  },

  updateActorPosition: (actorId, position) => {
    set((state) => ({
      actors: state.actors.map((a) =>
        a.id === actorId ? { ...a, position } : a
      ),
    }));
  },

  setPhase: (phase) => set({ currentPhase: phase }),

  addTelemetryEntry: (entry) => {
    const full: TelemetryEntry = {
      ...entry,
      id: `tele-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
    };
    set((state) => ({
      telemetry: [...state.telemetry.slice(-100), full],
    }));
  },

  setPerformanceConfig: (config) => set({ performanceConfig: config }),
  setOverlayVisible: (visible) => set({ overlayVisible: visible }),
  selectActor: (actorId) => set({ selectedActorId: actorId }),
  setAnimationProgress: (progress) => set({ animationProgress: progress }),
  setActiveAnimation: (anim) => set({ activeAnimation: anim, isAnimating: !!anim }),
  setFrameLoopActive: (active) => set({ frameLoopActive: active }),

  resetHangar: () =>
    set({
      actors: createDefaultActors(),
      events: [],
      currentPhase: null,
      activeAnimation: null,
      animationProgress: 0,
      isAnimating: false,
      telemetry: [],
      selectedActorId: null,
    }),
}));
