# Live Look In — PCP & Performance Metrics

## Per-Job: Project Completion Plan (PCP)

Every job in Live Look In generates a PCP document — the atomic unit of work tracking.

### PCP Structure

```typescript
interface PCPDocument {
  id: string;             // PCP-{timestamp_base36}, e.g. "PCP-2f8k1a"
  task: string;           // human-readable task description
  agentId: string;        // assigned agent
  complexity: "low" | "medium" | "high";
  vision: string;         // strategic goal statement
  mission: string;        // execution methodology
  objectives: string[];   // ordered steps to complete
  startTime: number;      // epoch ms
  endTime: number | null; // epoch ms, null if in-progress
  score: number | null;   // 0-100 on completion
  grade: "S" | "A" | "B" | "C" | "D" | null;
}
```

### Grading Scale

| Grade | Score Range | Meaning                            | Visual in Viewer       |
|-------|-------------|-------------------------------------|------------------------|
| S     | 95-100      | Exceptional — above and beyond     | Gold star burst        |
| A     | 85-94       | Excellent — met all objectives     | Green checkmark glow   |
| B     | 70-84       | Good — minor gaps                  | Blue checkmark         |
| C     | 55-69       | Acceptable — needs improvement     | Yellow warning         |
| D     | 0-54        | Below standard — review required   | Red alert pulse        |

### Scoring Formula

```
baseScore = objectivesCompleted / totalObjectives * 80
timeBonus = max(0, (estimatedTime - actualTime) / estimatedTime * 10)
qualityBonus = errorFree ? 10 : max(0, 10 - (errorCount * 2))
score = min(100, baseScore + timeBonus + qualityBonus)
```

### Complexity Multipliers

| Complexity | Estimated Time | Weight in Agent KPIs |
|------------|----------------|----------------------|
| low        | 30-120s        | 1.0x                |
| medium     | 120-600s       | 1.5x                |
| high       | 600-3600s      | 2.0x                |

## Per-Agent: KPIs

Each agent tracks rolling performance metrics:

```typescript
interface AgentKPIs {
  tasksCompleted: number;       // lifetime count
  averageScore: number;         // running mean of PCP scores
  averageTimeSeconds: number;   // running mean of task durations
  efficiencyPct: number;        // derived metric
}
```

### Efficiency Calculation

```
efficiency = (averageScore / 100) * (estimatedTime / actualTime) * 100
// Capped at 100%, floor at 0%
```

### Display in Viewer

- **Hover tooltip**: `"API_Ang — 47 tasks, avg 82.3, eff 91%"`
- **Detail panel**: Full KPI breakdown with sparkline trends
- **Leaderboard**: Optional sidebar ranking agents by efficiency

## Org-Level: OKRs

Aggregated from all agent KPIs:

| OKR                        | Formula                                     |
|----------------------------|---------------------------------------------|
| Workforce Utilization      | activeAgents / totalAgents × 100            |
| Job Completion Rate        | completedPCPs / totalPCPs × 100             |
| Average Grade Distribution | count per grade / total, displayed as bar    |
| Department Throughput      | PCPs completed per department per hour       |

### Dashboard Rendering

The `<KPIDashboard />` component shows org-level OKRs in a collapsible top bar:
- Four metric cards (utilization, completion, avg grade, throughput)
- Department comparison mini-chart
- Refresh interval matches event bus polling
