'use client';

/**
 * EventBridge — Connects orchestration events to 3D scene
 *
 * Listens for SSE events from /api/hangar/events (or mock stream)
 * and dispatches them into the Zustand store, triggering animations.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useHangarStore } from '@/lib/hangar/store';
import type { HangarEvent, HangarEventType } from '@/lib/hangar/eventSchema';
import { PHASE_ORDER, getPhaseLabel } from '@/lib/hangar/eventSchema';

/** Mock event generator for demo mode */
function createMockEvent(eventType: HangarEventType, index: number): HangarEvent {
  const id = `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const metadataMap: Record<HangarEventType, Record<string, unknown>> = {
    PROMPT_RECEIVED: { prompt_text: 'Build a landing page', session_id: 'demo-session' },
    ROUTED_TO_PMO: { pmo_office: 'Alpha', director: 'ACHEEVY', confidence: 0.95 },
    BOOMER_ANG_ASSIGNED: { boomer_ang_id: 'boomer-ang-alpha', boomer_ang_name: 'Boomer_CTO', capability: 'frontend' },
    CHICKEN_HAWK_DISPATCH: { task_packets: 3, priority: 'high' as const },
    LIL_HAWK_EXECUTE: { hawk_id: 'lil-hawk-0', task_id: `task-${index}`, build_node: 0 },
    BUILD_PROGRESS: { task_id: `task-${index}`, progress: 0.5, stage: 'compiling' },
    PROOF_ATTACHED: { task_id: `task-${index}`, proof_type: 'test_result' as const },
    DEPLOY_COMPLETE: { plug_id: 'plug-demo', deploy_url: 'https://demo.achievemor.com', duration_ms: 4200 },
  };

  return {
    event_id: id,
    tenant_id: 'demo',
    event_type: eventType,
    actor: 'system',
    metadata: metadataMap[eventType] as unknown as HangarEvent['metadata'],
    timestamp: Date.now(),
  };
}

interface EventBridgeProps {
  mode?: 'live' | 'demo';
  sseUrl?: string;
}

export default function EventBridge({ mode = 'demo', sseUrl }: EventBridgeProps) {
  const dispatchEvent = useHangarStore((s) => s.dispatchEvent);
  const updateActorState = useHangarStore((s) => s.updateActorState);
  const addTelemetryEntry = useHangarStore((s) => s.addTelemetryEntry);
  const demoRunning = useRef(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const processEvent = useCallback((event: HangarEvent) => {
    // Dispatch to store (triggers animation)
    dispatchEvent(event);

    // Update relevant actor states
    const actorMapping: Partial<Record<HangarEventType, string[]>> = {
      PROMPT_RECEIVED: ['acheevy-prime'],
      ROUTED_TO_PMO: ['acheevy-prime'],
      BOOMER_ANG_ASSIGNED: ['boomer-ang-alpha', 'boomer-ang-beta'],
      CHICKEN_HAWK_DISPATCH: ['chicken-hawk-prime'],
      LIL_HAWK_EXECUTE: ['lil-hawk-0', 'lil-hawk-1', 'lil-hawk-2'],
      BUILD_PROGRESS: ['lil-hawk-0', 'lil-hawk-1', 'lil-hawk-2'],
      PROOF_ATTACHED: ['lil-hawk-0'],
      DEPLOY_COMPLETE: ['acheevy-prime', 'chicken-hawk-prime'],
    };

    const actors = actorMapping[event.event_type] ?? [];
    actors.forEach((actorId) => {
      updateActorState(actorId, event.event_type);
    });

    // Log telemetry
    addTelemetryEntry({
      label: getPhaseLabel(event.event_type),
      detail: `Event ${event.event_id}`,
      type: event.event_type === 'DEPLOY_COMPLETE' ? 'complete' : 'action',
    });
  }, [dispatchEvent, updateActorState, addTelemetryEntry]);

  // Demo mode: auto-play through all phases
  useEffect(() => {
    if (mode !== 'demo' || demoRunning.current) return;
    demoRunning.current = true;

    let cancelled = false;
    const delays = [500, 1800, 2800, 4000, 5500, 7500, 9500, 11500];

    const timers = PHASE_ORDER.map((phase, i) => {
      return setTimeout(() => {
        if (cancelled) return;
        processEvent(createMockEvent(phase, i));
      }, delays[i]);
    });

    // Reset after full cycle and loop
    const loopTimer = setTimeout(() => {
      if (cancelled) return;
      demoRunning.current = false;
      useHangarStore.getState().resetHangar();
    }, 14000);

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      clearTimeout(loopTimer);
      demoRunning.current = false;
    };
  }, [mode, processEvent]);

  // Live mode: SSE connection
  useEffect(() => {
    if (mode !== 'live' || !sseUrl) return;

    const es = new EventSource(sseUrl);
    eventSourceRef.current = es;

    es.onmessage = (msg) => {
      try {
        const event: HangarEvent = JSON.parse(msg.data);
        processEvent(event);
      } catch {
        // Malformed event — skip
      }
    };

    es.onerror = () => {
      addTelemetryEntry({
        label: 'Connection Error',
        detail: 'SSE stream disconnected',
        type: 'error',
      });
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [mode, sseUrl, processEvent, addTelemetryEntry]);

  return null; // Headless component
}
