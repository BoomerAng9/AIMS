import React from 'react';
import { motion } from 'framer-motion';

type LoopStage = 'idle' | 'gather' | 'action' | 'verify' | 'output';

interface AgentLoopVisualizerProps {
  currentStage: LoopStage;
}

const steps = [
  { id: 'gather', label: 'Gather Context', icon: '🔍', color: 'border-blue-400', bg: 'bg-blue-500/10', text: 'text-blue-400' },
  { id: 'action', label: 'Take Action', icon: '⚡', color: 'border-purple-400', bg: 'bg-purple-500/10', text: 'text-purple-400' },
  { id: 'verify', label: 'Verify Output', icon: '🛡️', color: 'border-green-400', bg: 'bg-green-500/10', text: 'text-green-400' },
  { id: 'output', label: 'Final Output', icon: '🏁', color: 'border-gold', bg: 'bg-gold/10', text: 'text-gold' }
];

export const AgentLoopVisualizer: React.FC<AgentLoopVisualizerProps> = ({ currentStage }) => {
  return (
    <div className="relative w-full max-w-4xl mx-auto py-12">
      {/* Connecting Line */}
      <div className="absolute top-1/2 left-0 w-full h-1 bg-leather -z-10 transform -translate-y-1/2"></div>
      
      {/* Active Line Progress (simplified for now) */}
      <div className={`absolute top-1/2 left-0 h-1 bg-gold/30 -z-10 transform -translate-y-1/2 transition-all duration-1000 ease-in-out
        ${currentStage === 'idle' ? 'w-0' : ''}
        ${currentStage === 'gather' ? 'w-1/4' : ''}
        ${currentStage === 'action' ? 'w-2/4' : ''}
        ${currentStage === 'verify' ? 'w-3/4' : ''}
        ${currentStage === 'output' ? 'w-full' : ''}
      `}></div>

      <div className="flex justify-between items-center px-4">
        {steps.map((step) => {
          const isActive = currentStage === step.id;
          const isCompleted = steps.findIndex(s => s.id === currentStage) > steps.findIndex(s => s.id === step.id) || currentStage === 'output' && step.id !== 'output'; 

          return (
            <div key={step.id} className="flex flex-col items-center gap-4 relative group">
              
              {/* Node Circle */}
              <motion.div 
                initial={false}
                animate={{
                  scale: isActive ? 1.2 : 1,
                  boxShadow: isActive ? `0 0 20px 2px ${step.text.replace('text-', '')}` : 'none'
                }}
                className={`
                  w-16 h-16 rounded-full border-2 flex items-center justify-center
                  ${step.bg} 
                  ${isActive || isCompleted ? step.color : 'border-gray-700 bg-obsidian'}
                  transition-colors duration-300 z-10
                `}
              >
                  <span className="text-2xl filter drop-shadow-md">{step.icon}</span>
              </motion.div>

              {/* Label */}
              <div className={`text-center transition-opacity duration-300 ${isActive || isCompleted ? 'opacity-100' : 'opacity-50'}`}>
                <h3 className={`font-display font-medium ${isActive ? 'text-white' : 'text-gray-500'}`}>{step.label}</h3>
                {isActive && (
                   <motion.span 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="text-xs text-champagne block mt-1 font-mono animate-pulse"
                   >
                     PROCESSING...
                   </motion.span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
