/**
 * Collaboration Feed — Public API
 *
 * Live look-in system for A.I.M.S. agent collaboration.
 * Shows agents reasoning, conversing, and handing off through
 * the chain of command — each speaking in their persona voice.
 *
 * Usage:
 *   import { collaborationFeed, renderTerminal, renderMarkdown } from './collaboration';
 *
 *   const session = collaborationFeed.runDemo('Boss', 'Build me a landing page');
 *   console.log(renderTerminal(session));
 *
 * "Activity breeds Activity — shipped beats perfect."
 */

export { CollaborationFeedGenerator } from './feed';
export { renderTerminal, renderMarkdown, renderJSON } from './renderer';
export type {
  FeedEntry,
  FeedEntryType,
  AgentIdentity,
  AgentRole,
  CollaborationSession,
  SessionStats,
  FeedConfig,
} from './types';
export { DEFAULT_FEED_CONFIG } from './types';

import { CollaborationFeedGenerator } from './feed';
import { executeChainOfCommandFull } from '../n8n/chain-of-command';
import { createPipelinePacket } from '../n8n/pmo-router';
import type { CollaborationSession, FeedConfig } from './types';
import type { PmoPipelinePacket } from '../n8n/types';

// ---------------------------------------------------------------------------
// Convenience: Run a demo collaboration session
// ---------------------------------------------------------------------------

/**
 * Run a complete demo session: classify → direct → execute → feed.
 * Returns a fully populated CollaborationSession ready for rendering.
 *
 * Now async — executeChainOfCommandFull dispatches to real agents via A2A.
 */
export async function runCollaborationDemo(
  userName: string,
  message: string,
  projectLabel?: string,
): Promise<CollaborationSession> {
  // 1. Classify + build pipeline packet
  const packet = createPipelinePacket({
    userId: 'demo-user',
    message,
    requestId: `demo-${Date.now().toString(36)}`,
  });

  // 2. Execute full chain of command (dispatches to real agents via A2A)
  const { packet: executedPacket } = await executeChainOfCommandFull(packet);

  // 3. Generate collaboration feed
  const generator = new CollaborationFeedGenerator({
    userName,
    projectLabel: projectLabel || `"${message.slice(0, 50)}"`,
    showThinking: true,
    showNuggets: true,
    showWaveDetail: true,
    showVerificationDetail: true,
    maxNuggets: 3,
  });

  return generator.generateFromPacket(executedPacket);
}

/**
 * Generate a feed from an already-executed pipeline packet.
 */
export function generateFeedFromPacket(
  packet: PmoPipelinePacket,
  config?: Partial<FeedConfig>,
): CollaborationSession {
  const generator = new CollaborationFeedGenerator(config);
  return generator.generateFromPacket(packet);
}
