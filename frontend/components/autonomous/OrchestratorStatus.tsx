import React from 'react';
import { motion } from 'framer-motion';

export const OrchestratorStatus = ({ status = 'idle', message = 'Ready for assignment' }) => {
  return (
    <div className="flex items-center gap-6 p-6 auth-glass-card rounded-2xl w-full max-w-2xl mx-auto mb-8 border border-gold/20">
      <div className="relative">
        {/* Pulse effect for active status */}
        {status === 'active' && (
          <div className="absolute inset-0 bg-gold rounded-full blur-xl opacity-20 animate-pulse"></div>
        )}
        <div className="w-20 h-20 rounded-full bg-obsidian border-2 border-gold flex items-center justify-center overflow-hidden relative z-10">
           <img src="/images/avatars/acheevy-badge.svg" alt="ACHEEVY" className="w-12 h-12" />
        </div>
        {/* Status indicator dot */}
        <div className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-obsidian ${status === 'active' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
      </div>

      <div className="flex-1">
        <h2 className="text-3xl font-marker text-frosty-white mb-1">ACHEEVY</h2>
        <p className="text-champagne font-display text-sm tracking-wide uppercase mb-2">Orchestrator Agent</p>
        <div className="bg-leather/50 p-3 rounded-lg border border-wireframe-stroke">
            <p className="text-gray-300 font-sans text-sm italic">"{message}"</p>
        </div>
      </div>
    </div>
  );
};
