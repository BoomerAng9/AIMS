/**
 * Certifier Bot — Badge Issuance & Role Assignment
 *
 * Watches the Boost|Bridge API for new badges and:
 *   1. Posts to #accreditation-log
 *   2. Assigns Discord roles based on belt tier
 *   3. Sends DM congratulations with badge details
 *
 * This module is imported by the main bot — not run standalone.
 */

import { postBadgeEarned } from './webhooks.js';
import type { BoostBadge } from '../engines/p2p-dojo.js';

// ─── Types ────────────────────────────────────────────────────────────────

interface CertifierConfig {
  apiUrl: string;
  accreditationWebhookUrl: string;
  pollIntervalMs: number;
}

// ─── Belt → Discord Role Mapping ──────────────────────────────────────────

export const BELT_ROLE_MAP: Record<string, string> = {
  white: 'White Belt',
  blue: 'Blue Belt',
  black: 'Black Belt',
  sensei: 'Sensei',
};

// ─── Certifier Loop ───────────────────────────────────────────────────────

export class Certifier {
  private config: CertifierConfig;
  private knownBadges = new Set<string>();
  private interval: ReturnType<typeof setInterval> | null = null;

  constructor(config: CertifierConfig) {
    this.config = config;
  }

  async start(): Promise<void> {
    // Initial load of existing badges
    await this.syncExistingBadges();

    // Poll for new badges
    this.interval = setInterval(() => this.checkForNewBadges(), this.config.pollIntervalMs);
    console.log(`[Certifier] Watching for new badges (polling every ${this.config.pollIntervalMs}ms)`);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private async syncExistingBadges(): Promise<void> {
    try {
      const res = await fetch(`${this.config.apiUrl}/api/dojo/badges`);
      if (res.ok) {
        const data = await res.json() as { badges: BoostBadge[] };
        for (const badge of data.badges) {
          this.knownBadges.add(badge.badgeId);
        }
        console.log(`[Certifier] Synced ${this.knownBadges.size} existing badges`);
      }
    } catch {
      console.warn('[Certifier] Could not sync existing badges');
    }
  }

  private async checkForNewBadges(): Promise<void> {
    try {
      const res = await fetch(`${this.config.apiUrl}/api/dojo/badges`);
      if (!res.ok) return;

      const data = await res.json() as { badges: BoostBadge[] };

      for (const badge of data.badges) {
        if (!this.knownBadges.has(badge.badgeId)) {
          this.knownBadges.add(badge.badgeId);

          // Post to Discord
          await postBadgeEarned(this.config.accreditationWebhookUrl, badge);
          console.log(`[Certifier] New badge announced: ${badge.badgeId} (${badge.tier} belt for ${badge.recipientName})`);
        }
      }
    } catch {
      // Silently retry next poll
    }
  }
}
