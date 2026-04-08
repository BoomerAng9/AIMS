/**
 * Discord Webhook Handlers
 *
 * Pipes Boost|Bridge engine outputs into Discord channels.
 * Each handler formats data into Discord-native embeds.
 */

import type { CrowdReport } from '../engines/synthetic-persona.js';
import type { BoostBadge } from '../engines/p2p-dojo.js';

// ─── Webhook Poster ───────────────────────────────────────────────────────

async function postWebhook(webhookUrl: string, payload: Record<string, unknown>): Promise<boolean> {
  if (!webhookUrl) return false;

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (err) {
    console.warn(`[Discord] Webhook post failed: ${err}`);
    return false;
  }
}

// ─── Synthetic Feedback Channel ───────────────────────────────────────────

export async function postCrowdReport(webhookUrl: string, report: CrowdReport): Promise<boolean> {
  const npsColor = report.avgNPS >= 8 ? 0x22c55e : report.avgNPS >= 6 ? 0xf59e0b : report.avgNPS >= 4 ? 0xf97316 : 0xef4444;

  // Main summary embed
  const embeds = [
    {
      title: `The Crowd Has Spoken: "${report.productName}"`,
      description: report.executiveSummary.slice(0, 400),
      color: npsColor,
      fields: [
        { name: 'Sample Size', value: `${report.totalPersonas} personas`, inline: true },
        { name: 'NPS Score', value: `${report.avgNPS}/10`, inline: true },
        { name: 'Would Use', value: `${report.wouldUsePercent}%`, inline: true },
        { name: 'Would Pay', value: `${report.wouldPayPercent}%`, inline: true },
        { name: 'Avg Max Price', value: report.avgMaxPrice ? `$${report.avgMaxPrice}/mo` : 'N/A', inline: true },
        {
          name: 'Sentiment',
          value: `${report.sentimentBreakdown.enthusiastic} fire | ${report.sentimentBreakdown.positive} solid | ${report.sentimentBreakdown.neutral} meh | ${report.sentimentBreakdown.negative} nah`,
          inline: false,
        },
      ],
      footer: { text: `Report: ${report.reportId}` },
      timestamp: report.completedAt,
    },
  ];

  // Top friction/delight as a second embed
  if (report.topFrictionPoints.length > 0 || report.topDelightPoints.length > 0) {
    embeds.push({
      title: 'Friction vs. Delight',
      description: '',
      color: 0x6366f1,
      fields: [
        {
          name: 'Top Friction',
          value: report.topFrictionPoints.slice(0, 5).map(f => `- ${f.issue} (${f.frequency}x)`).join('\n') || 'None reported',
          inline: true,
        },
        {
          name: 'Top Delight',
          value: report.topDelightPoints.slice(0, 5).map(d => `- ${d.feature} (${d.frequency}x)`).join('\n') || 'None reported',
          inline: true,
        },
      ],
      footer: { text: '' },
      timestamp: report.completedAt,
    });
  }

  return postWebhook(webhookUrl, {
    username: 'The Crowd',
    content: `**New Simulation Complete** — ${report.totalPersonas} synthetic personas tested "${report.productName}"`,
    embeds,
  });
}

// ─── Agent Roast Channel ──────────────────────────────────────────────────

export async function postAgentRoast(
  webhookUrl: string,
  productName: string,
  roasts: Array<{ personaName: string; feedback: string; nps: number }>,
): Promise<boolean> {
  const roastText = roasts
    .slice(0, 10)
    .map(r => `**${r.personaName}** (NPS: ${r.nps}/10):\n> ${r.feedback}`)
    .join('\n\n');

  return postWebhook(webhookUrl, {
    username: 'The Haters',
    content: `**Roast Session: "${productName}"**\n\nThese personas weren\'t feeling it. Here\'s the raw, unfiltered truth:\n\n${roastText}`,
  });
}

// ─── Accreditation Log Channel ────────────────────────────────────────────

export async function postBadgeEarned(webhookUrl: string, badge: BoostBadge): Promise<boolean> {
  const tierEmoji = badge.tier === 'sensei' ? '👑'
    : badge.tier === 'black' ? '🥋'
    : badge.tier === 'blue' ? '🔵'
    : '⚪';

  const tierColor = badge.tier === 'sensei' ? 0xf59e0b
    : badge.tier === 'black' ? 0x1a1a2e
    : badge.tier === 'blue' ? 0x3b82f6
    : 0xd4d4d8;

  return postWebhook(webhookUrl, {
    username: 'Certifier Bot',
    content: `${tierEmoji} **New Boost Badge Earned!**`,
    embeds: [{
      title: `${badge.recipientName} — ${badge.tier.toUpperCase()} BELT`,
      description: `Earned in **${badge.domain}** by completing "${badge.curriculumTitle}"`,
      color: tierColor,
      fields: [
        { name: 'Score', value: `${badge.score}%`, inline: true },
        { name: 'Badge ID', value: badge.badgeId, inline: true },
        { name: 'Verification', value: `[Verify](${badge.verificationUrl})`, inline: true },
      ],
      footer: { text: `Integrity Hash: ${badge.hash.slice(0, 24)}...` },
      timestamp: badge.earnedAt,
    }],
  });
}
