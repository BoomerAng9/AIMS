/**
 * Collaboration Feed Renderer
 *
 * Transforms a CollaborationSession into formatted output:
 * - Terminal (ANSI color-coded for CLI display)
 * - Markdown (for web/frontend rendering)
 * - JSON (structured data for API consumers)
 *
 * "Activity breeds Activity — shipped beats perfect."
 */

import type { CollaborationSession, FeedEntryType } from './types';

// ---------------------------------------------------------------------------
// Type → Visual Mapping
// ---------------------------------------------------------------------------

const TYPE_ICONS: Record<FeedEntryType, string> = {
  intake: '📥',
  thinking: '💭',
  classification: '🏢',
  directive: '📋',
  handoff: '🤝',
  squad_assembly: '🦅',
  execution: '⚡',
  wave_summary: '🌊',
  verification: '🔍',
  nugget: '💬',
  receipt: '🔒',
  debrief: '📊',
  escalation: '🚨',
  coaching: '🎯',
  system: '⚙️',
};

const TYPE_LABELS: Record<FeedEntryType, string> = {
  intake: 'INTAKE',
  thinking: 'THINKING',
  classification: 'CLASSIFY',
  directive: 'DIRECTIVE',
  handoff: 'HANDOFF',
  squad_assembly: 'SQUAD',
  execution: 'EXEC',
  wave_summary: 'WAVE',
  verification: 'VERIFY',
  nugget: 'NUGGET',
  receipt: 'RECEIPT',
  debrief: 'DEBRIEF',
  escalation: 'ESCALATE',
  coaching: 'COACHING',
  system: 'SYSTEM',
};

// ANSI color codes for terminal output
const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  gold: '\x1b[38;5;220m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  bgGold: '\x1b[48;5;220m\x1b[30m',
};

// Role → color mapping
function roleColor(role: string): string {
  switch (role) {
    case 'acheevy': return ANSI.gold;
    case 'boomer_ang': return ANSI.cyan;
    case 'chicken_hawk': return ANSI.yellow;
    case 'lil_hawk': return ANSI.green;
    case 'verifier': return ANSI.magenta;
    case 'receipt': return ANSI.blue;
    case 'system': return ANSI.gray;
    default: return ANSI.white;
  }
}

function typeColor(type: FeedEntryType): string {
  switch (type) {
    case 'nugget': return ANSI.italic + ANSI.gold;
    case 'thinking': return ANSI.dim;
    case 'handoff': return ANSI.yellow;
    case 'verification': return ANSI.magenta;
    case 'receipt': return ANSI.blue;
    case 'execution': return ANSI.green;
    case 'debrief': return ANSI.gold;
    default: return '';
  }
}

// ---------------------------------------------------------------------------
// Terminal Renderer
// ---------------------------------------------------------------------------

export function renderTerminal(session: CollaborationSession): string {
  const lines: string[] = [];

  // Header
  lines.push('');
  lines.push(`${ANSI.bgGold} A.I.M.S. COLLABORATION FEED ${ANSI.reset}`);
  lines.push(`${ANSI.gray}${'─'.repeat(60)}${ANSI.reset}`);
  lines.push(`${ANSI.gold}Session:${ANSI.reset} ${session.sessionId}`);
  lines.push(`${ANSI.gold}User:${ANSI.reset}    ${session.userName}`);
  lines.push(`${ANSI.gold}Project:${ANSI.reset} ${session.projectLabel}`);
  lines.push(`${ANSI.gold}Status:${ANSI.reset}  ${session.status.toUpperCase()}`);
  lines.push(`${ANSI.gray}${'─'.repeat(60)}${ANSI.reset}`);
  lines.push('');

  // Feed entries
  for (const e of session.feed) {
    const indent = '  '.repeat(e.depth);
    const color = roleColor(e.speaker.role);
    const tColor = typeColor(e.type);
    const icon = TYPE_ICONS[e.type];
    const label = TYPE_LABELS[e.type];
    const kunya = e.speaker.kunya ? ` "${e.speaker.kunya}"` : '';
    const bench = e.speaker.benchLevel ? ` [${e.speaker.benchLevel}]` : '';

    const speakerTag = `${color}${ANSI.bold}${e.speaker.displayName}${ANSI.reset}${ANSI.dim}${kunya}${bench}${ANSI.reset}`;
    const typeTag = `${ANSI.dim}[${label}]${ANSI.reset}`;

    if (e.type === 'nugget') {
      // Nuggets get special treatment — italic gold
      lines.push(`${indent}${icon} ${speakerTag} ${typeTag}`);
      lines.push(`${indent}   ${ANSI.italic}${ANSI.gold}"${e.message}"${ANSI.reset}`);
    } else if (e.type === 'handoff') {
      // Handoffs get a visual separator
      lines.push(`${indent}${ANSI.yellow}→${ANSI.reset} ${speakerTag} ${typeTag} ${tColor}${e.message}${ANSI.reset}`);
    } else {
      lines.push(`${indent}${icon} ${speakerTag} ${typeTag} ${tColor}${e.message}${ANSI.reset}`);
    }
  }

  // Footer — stats
  lines.push('');
  lines.push(`${ANSI.gray}${'─'.repeat(60)}${ANSI.reset}`);
  lines.push(`${ANSI.gold}Stats:${ANSI.reset}`);
  lines.push(`  Entries: ${session.stats.totalEntries} | Agents: ${session.stats.agentsSeen.length} | Nuggets: ${session.stats.nuggetsDelivered}`);
  lines.push(`  Steps: ${session.stats.stepsCompleted} completed, ${session.stats.stepsFailed} failed | Duration: ${session.stats.totalDurationMs}ms`);
  if (session.stats.pmoOffice) lines.push(`  PMO: ${session.stats.pmoOffice} | Director: ${session.stats.director} | Lane: ${session.stats.executionLane}`);
  lines.push(`${ANSI.gray}${'─'.repeat(60)}${ANSI.reset}`);
  lines.push('');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Markdown Renderer (for web frontend)
// ---------------------------------------------------------------------------

export function renderMarkdown(session: CollaborationSession): string {
  const lines: string[] = [];

  // Header
  lines.push(`# A.I.M.S. Collaboration Feed`);
  lines.push('');
  lines.push(`| Field | Value |`);
  lines.push(`|-------|-------|`);
  lines.push(`| Session | \`${session.sessionId}\` |`);
  lines.push(`| User | ${session.userName} |`);
  lines.push(`| Project | ${session.projectLabel} |`);
  lines.push(`| Status | **${session.status.toUpperCase()}** |`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Feed entries
  let currentGroup: string | undefined;

  for (const e of session.feed) {
    // Group headers (collapsible sections like Manus)
    if (e.group && e.group !== currentGroup) {
      if (currentGroup) lines.push('</details>\n');
      const groupLabel = e.group.charAt(0).toUpperCase() + e.group.slice(1).replace(/-/g, ' ');
      lines.push(`<details open>`);
      lines.push(`<summary><strong>${groupLabel}</strong></summary>\n`);
      currentGroup = e.group;
    } else if (!e.group && currentGroup) {
      lines.push('</details>\n');
      currentGroup = undefined;
    }

    const indent = '  '.repeat(e.depth);
    const icon = TYPE_ICONS[e.type];
    const bench = e.speaker.benchLevel ? ` \`${e.speaker.benchLevel}\`` : '';
    const kunya = e.speaker.kunya ? ` *"${e.speaker.kunya}"*` : '';

    if (e.type === 'nugget') {
      lines.push(`${indent}${icon} **${e.speaker.displayName}**${kunya}${bench}`);
      lines.push(`${indent}> *"${e.message}"*`);
      lines.push('');
    } else if (e.type === 'handoff') {
      lines.push(`${indent}${icon} **${e.speaker.displayName}** → ${e.message}`);
      lines.push('');
    } else if (e.type === 'thinking') {
      lines.push(`${indent}${icon} *${e.speaker.displayName}: ${e.message}*`);
      lines.push('');
    } else {
      lines.push(`${indent}${icon} **${e.speaker.displayName}**${kunya}${bench} — ${e.message}`);
      lines.push('');
    }
  }

  if (currentGroup) lines.push('</details>\n');

  // Stats footer
  lines.push('---');
  lines.push('');
  lines.push('### Session Stats');
  lines.push('');
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Feed Entries | ${session.stats.totalEntries} |`);
  lines.push(`| Agents Involved | ${session.stats.agentsSeen.join(', ')} |`);
  lines.push(`| Nuggets Delivered | ${session.stats.nuggetsDelivered} |`);
  lines.push(`| Steps Completed | ${session.stats.stepsCompleted} |`);
  lines.push(`| Steps Failed | ${session.stats.stepsFailed} |`);
  lines.push(`| Duration | ${session.stats.totalDurationMs}ms |`);
  if (session.stats.pmoOffice) {
    lines.push(`| PMO Office | ${session.stats.pmoOffice} |`);
    lines.push(`| Director | ${session.stats.director} |`);
    lines.push(`| Lane | ${session.stats.executionLane} |`);
  }
  lines.push('');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// JSON Renderer (structured for API)
// ---------------------------------------------------------------------------

export function renderJSON(session: CollaborationSession): object {
  return {
    session: {
      id: session.sessionId,
      userName: session.userName,
      projectLabel: session.projectLabel,
      status: session.status,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
    },
    feed: session.feed.map(e => ({
      id: e.id,
      timestamp: e.timestamp,
      speaker: {
        name: e.speaker.displayName,
        kunya: e.speaker.kunya,
        bench: e.speaker.benchLevel,
        role: e.speaker.role,
        office: e.speaker.pmoOffice,
        avatar: e.speaker.avatar,
      },
      type: e.type,
      message: e.message,
      depth: e.depth,
      group: e.group,
      metadata: e.metadata,
    })),
    stats: session.stats,
  };
}
