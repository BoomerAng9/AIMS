---
template_type: autonomous-loop
name: claude_loop_dashboard
description: "UI Template for Claude Agent Loop Dashboard"
---

# Autonomous Operation Dashboard

<OrchestratorStatus status="{{status}}" message="{{current_message}}" />

<AgentLoopVisualizer currentStage="{{current_stage}}" />

## Live Execution Log

<div className="bg-leather/50 rounded-xl p-4 h-96 overflow-y-auto font-mono text-sm border border-white/5">
  {logs.map((log, i) => (
    <div key={i} className="mb-2">
      <span className="text-gray-500">[{log.timestamp}]</span>
      <span className={`ml-2 ${log.type === 'error' ? 'text-red-400' : 'text-green-300'}`}>
        {log.message}
      </span>
    </div>
  ))}
</div>
