'use client';

/**
 * ActorCardPanel — Right-side panel showing actor states
 */

import { motion } from 'framer-motion';
import { useHangarStore } from '@/lib/hangar/store';
import { ACTOR_COLORS } from '@/lib/hangar/actorRegistry';
import type { ActorType } from '@/lib/hangar/actorRegistry';

const STATE_BADGES: Record<string, { label: string; color: string }> = {
  IDLE: { label: 'Idle', color: 'bg-white/20' },
  LISTENING: { label: 'Listening', color: 'bg-blue-500/60' },
  ASSIGNED: { label: 'Assigned', color: 'bg-purple-500/60' },
  EXECUTING: { label: 'Executing', color: 'bg-orange-500/60' },
  RETURNING: { label: 'Returning', color: 'bg-cyan-500/60' },
  COMPLETE: { label: 'Complete', color: 'bg-green-500/60' },
};

function ActorTypeIcon({ type }: { type: ActorType }) {
  const color = ACTOR_COLORS[type].color;
  return (
    <div
      className="w-3 h-3 rounded-sm"
      style={{ backgroundColor: color }}
    />
  );
}

export default function ActorCardPanel() {
  const actors = useHangarStore((s) => s.actors);
  const selectedActorId = useHangarStore((s) => s.selectedActorId);
  const selectActor = useHangarStore((s) => s.selectActor);

  return (
    <div className="h-full bg-black/40 backdrop-blur-md border border-white/10 rounded-xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 shrink-0">
        <div className="text-xs text-[#C6A74E] uppercase tracking-widest font-medium">
          Actors
        </div>
        <div className="text-[10px] text-white/30 mt-0.5">
          {actors.length} active
        </div>
      </div>

      {/* Actor list */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
        {actors.map((actor) => {
          const isSelected = actor.id === selectedActorId;
          const badge = STATE_BADGES[actor.state.current] ?? STATE_BADGES.IDLE;

          return (
            <motion.button
              key={actor.id}
              onClick={() => selectActor(isSelected ? null : actor.id)}
              className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                isSelected
                  ? 'border-[#C6A74E]/50 bg-[#C6A74E]/10'
                  : 'border-white/5 bg-white/5 hover:bg-white/10'
              }`}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-2">
                <ActorTypeIcon type={actor.type} />
                <span className="text-xs font-medium text-white/80 truncate">
                  {actor.displayName}
                </span>
                <div className={`ml-auto text-[9px] px-1.5 py-0.5 rounded-full ${badge.color} text-white/80`}>
                  {badge.label}
                </div>
              </div>
              {isSelected && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="mt-2 text-[10px] text-white/30 space-y-0.5"
                >
                  <div>Type: {actor.type}</div>
                  <div>ID: {actor.id}</div>
                  <div>
                    Position: [{actor.position.map((v) => v.toFixed(1)).join(', ')}]
                  </div>
                  {actor.state.taskId && <div>Task: {actor.state.taskId}</div>}
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
