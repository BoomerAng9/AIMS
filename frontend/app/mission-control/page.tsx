'use client';

import React, { useState, useEffect } from 'react';
import { OrchestratorStatus } from '@/components/autonomous/OrchestratorStatus';
import { AgentLoopVisualizer } from '@/components/autonomous/AgentLoopVisualizer';
import { SiteHeader } from '@/components/SiteHeader';

// Mock data types for development
type LoopStage = 'idle' | 'gather' | 'action' | 'verify' | 'output';

export default function AutonomousDashboardPage() {
  const [status, setStatus] = useState<'idle' | 'active'>('idle');
  const [currentStage, setCurrentStage] = useState<LoopStage>('idle');
  const [message, setMessage] = useState('Standby for assignment...');
  const [logs, setLogs] = useState<{timestamp: string, message: string, type: 'info' | 'error'}[]>([]);

  // Simulate loop for demo purposes
  useEffect(() => {
    let timeout: NodeJS.Timeout | undefined;

    const runDemo = async () => {
        // Start
        setStatus('active');
        setMessage('Initializing autonomous sequence...');
        addLog('Sequence initiated by User');
        setCurrentStage('gather');
        
        await new Promise(r => setTimeout(r, 2000));
        setMessage('Gathering context from codebase...');
        addLog('Scanning file system via Agentic Search...');
        addLog('Found 3 relevant files in /src/components');

        await new Promise(r => setTimeout(r, 2500));
        setCurrentStage('action');
        setMessage('Executing changes...');
        addLog('Action: Generate new component "StatusBadge.tsx"');
        addLog('Running build verification script...');

        await new Promise(r => setTimeout(r, 2500));
        setCurrentStage('verify');
        setMessage('Verifying output quality...');
        addLog('Playback Check: UI renders correctly');
        addLog('Lint Check: Passed');

        await new Promise(r => setTimeout(r, 2000));
        setCurrentStage('output');
        setMessage('Finalizing payload...');
        addLog('Task Completed Successfully');
        
        await new Promise(r => setTimeout(r, 2000));
        setStatus('idle');
        setMessage('Ready for assignment');
        setCurrentStage('idle');
    };

    // runDemo(); // Uncomment to auto-run on load
    
    return () => { if (timeout) clearTimeout(timeout); };
  }, []);

  const addLog = (msg: string, type: 'info' | 'error' = 'info') => {
    setLogs(prev => [...prev, {
        timestamp: new Date().toLocaleTimeString(),
        message: msg,
        type
    }]);
  };

  const startSimulation = async () => {
      setLogs([]);
      setStatus('active');
      setMessage('Initializing autonomous sequence...');
      addLog('Manual override: Autonomous loop started');
      setCurrentStage('gather');

      await new Promise(r => setTimeout(r, 2000));
      setMessage('Gathering context from codebase...');
      addLog('Scanning file system via Agentic Search...');
      addLog('Found 3 relevant files in /src/components');

      await new Promise(r => setTimeout(r, 2500));
      setCurrentStage('action');
      setMessage('Executing changes...');
      addLog('Action: Generate new component "StatusBadge.tsx"');
      addLog('Running build verification script...');

      await new Promise(r => setTimeout(r, 2500));
      setCurrentStage('verify');
      setMessage('Verifying output quality...');
      addLog('Playback Check: UI renders correctly');
      addLog('Lint Check: Passed');

      await new Promise(r => setTimeout(r, 2000));
      setCurrentStage('output');
      setMessage('Finalizing payload...');
      addLog('Task Completed Successfully');

      await new Promise(r => setTimeout(r, 2000));
      setStatus('idle');
      setMessage('Ready for assignment');
      setCurrentStage('idle');
  };

  return (
    <div className="min-h-screen bg-obsidian text-foreground overflow-x-hidden selection:bg-gold/30">
      <SiteHeader />
      
      <main className="pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-display font-medium text-white mb-4">
               Mission Control
            </h1>
            <p className="text-xl text-gray-400 font-sans max-w-2xl mx-auto">
                Real-time monitoring of ACHEEVY's autonomous execution loops.
            </p>
        </div>

        {/* Orchestrator Status Card */}
        <OrchestratorStatus status={status} message={message} />

        {/* Visualizer */}
        <div className="mb-12">
            <AgentLoopVisualizer currentStage={currentStage} />
        </div>

        {/* Logs & Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left: Controls */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-leather rounded-xl p-6 border border-wireframe-stroke">
                    <h3 className="text-xl font-marker text-frosty-white mb-4">Manual Override</h3>
                    <div className="space-y-4">
                        <button 
                            onClick={startSimulation}
                            disabled={status === 'active'}
                            className="w-full py-3 px-4 bg-gold hover:bg-gold-light text-obsidian font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <span>▶</span> Trigger Test Loop
                        </button>
                         <button
                            onClick={() => {
                              setStatus('idle');
                              setCurrentStage('idle');
                              setMessage('Emergency stop — all loops halted.');
                              addLog('EMERGENCY STOP triggered by operator', 'error');
                            }}
                            disabled={status === 'idle'}
                            className="w-full py-3 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span>⏹</span> Emergency Stop
                        </button>
                    </div>
                </div>

                <div className="bg-leather rounded-xl p-6 border border-wireframe-stroke">
                    <h3 className="text-xl font-marker text-frosty-white mb-4">Active SubAgents</h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-obsidian rounded-lg border border-wireframe-stroke">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="font-mono text-sm">Reviewer_01</span>
                            <span className="ml-auto text-xs text-gray-500">Idle</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-obsidian rounded-lg border border-wireframe-stroke">
                            <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                            <span className="font-mono text-sm">Coder_X</span>
                            <span className="ml-auto text-xs text-gray-500">Offline</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Logs */}
            <div className="lg:col-span-2">
                <div className="bg-leather rounded-xl p-6 border border-wireframe-stroke h-full min-h-[400px] flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                         <h3 className="text-xl font-marker text-frosty-white">System Logs</h3>
                         <span className="text-xs font-mono text-gray-500">Trace ID: #88392-AX</span>
                    </div>
                   
                    <div className="flex-1 bg-obsidian rounded-lg p-4 font-mono text-sm text-gray-300 overflow-y-auto max-h-[400px] space-y-2 border border-wireframe-stroke shadow-inner">
                        {logs.length === 0 && (
                            <div className="text-center text-gray-600 italic py-10">No active logs. System standby.</div>
                        )}
                        {logs.map((log, i) => (
                            <div key={i} className="flex gap-3">
                                <span className="text-gray-600 shrink-0">[{log.timestamp}]</span>
                                <span className={`${log.type === 'error' ? 'text-red-400' : 'text-green-400/80'}`}>
                                    {log.type === 'info' ? '➜' : '✖'} {log.message}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </div>

      </main>

    </div>
  );
}
