'use client';

/**
 * HangarRoot — Top-level composition component for the Hangar World
 *
 * Composes the 3D scene, event bridge, and glass overlay.
 * This is the single entry point mounted by the /hangar page.
 */

import dynamic from 'next/dynamic';
import EventBridge from './EventBridge';
import OverlayGlassUI from './OverlayGlassUI';

// Dynamic import for the Canvas — SSR must be disabled for R3F
const HangarScene = dynamic(() => import('./HangarScene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#0B0F14]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#C6A74E] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <div className="text-xs text-[#C6A74E]/60 uppercase tracking-widest">
          Initializing Hangar
        </div>
      </div>
    </div>
  ),
});

interface HangarRootProps {
  mode?: 'live' | 'demo';
  sseUrl?: string;
}

export default function HangarRoot({ mode = 'demo', sseUrl }: HangarRootProps) {
  return (
    <div className="relative w-full h-full bg-[#0B0F14] overflow-hidden">
      {/* 3D Canvas — fills entire container */}
      <div className="absolute inset-0">
        <HangarScene />
      </div>

      {/* Event bridge — headless, drives animations */}
      <EventBridge mode={mode} sseUrl={sseUrl} />

      {/* Glass overlay UI — absolute positioned on top of canvas */}
      <OverlayGlassUI />
    </div>
  );
}
