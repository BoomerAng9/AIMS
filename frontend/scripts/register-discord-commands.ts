/**
 * Discord Command Registration Script
 *
 * Run this to register all slash commands with Discord:
 *
 *   npx ts-node --project tsconfig.json scripts/register-discord-commands.ts
 *
 * Or for guild-only (instant, for testing):
 *
 *   npx ts-node --project tsconfig.json scripts/register-discord-commands.ts --guild YOUR_GUILD_ID
 *
 * You need DISCORD_CLIENT_ID and DISCORD_BOT_TOKEN in .env.local
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const DISCORD_API_BASE = 'https://discord.com/api/v10';

// ─────────────────────────────────────────────────────────────
// Command Definitions (duplicated from lib/discord/commands.ts
// to avoid TypeScript path alias issues in scripts)
// ─────────────────────────────────────────────────────────────

const COMMANDS = [
  {
    name: 'acheevy',
    description: '🤖 Ask ACHEEVY anything — your AI orchestrator',
    options: [
      {
        name: 'prompt',
        description: 'What do you want ACHEEVY to do?',
        type: 3,
        required: true,
      },
      {
        name: 'model',
        description: 'Choose the AI model',
        type: 3,
        required: false,
        choices: [
          { name: 'Claude Opus 4.6', value: 'claude-opus' },
          { name: 'Claude Sonnet 4.6', value: 'claude-sonnet' },
          { name: 'Gemini 2.5 Pro', value: 'gemini-pro' },
          { name: 'Qwen 2.5 Coder', value: 'qwen' },
        ],
      },
    ],
  },
  {
    name: 'perform',
    description: '🏈 Per|Form — Rank, grade and track athletes',
    options: [
      {
        name: 'action',
        description: 'What do you want to do?',
        type: 3,
        required: true,
        choices: [
          { name: '📊 View Rankings', value: 'rankings' },
          { name: '🎯 Grade Athlete', value: 'grade' },
          { name: '📈 Track Progress', value: 'track' },
          { name: '🔍 Scout Report', value: 'scout' },
          { name: '📋 Combine Data', value: 'combine' },
        ],
      },
      {
        name: 'athlete',
        description: 'Athlete name or ID',
        type: 3,
        required: false,
      },
      {
        name: 'position',
        description: 'Position filter',
        type: 3,
        required: false,
        choices: [
          { name: 'Quarterback', value: 'QB' },
          { name: 'Running Back', value: 'RB' },
          { name: 'Wide Receiver', value: 'WR' },
          { name: 'Tight End', value: 'TE' },
          { name: 'Offensive Line', value: 'OL' },
          { name: 'Defensive Line', value: 'DL' },
          { name: 'Linebacker', value: 'LB' },
          { name: 'Cornerback', value: 'CB' },
          { name: 'Safety', value: 'S' },
        ],
      },
    ],
  },
  {
    name: 'research',
    description: '🔬 Deep research on any topic via Research_Ang',
    options: [
      {
        name: 'query',
        description: 'What do you want researched?',
        type: 3,
        required: true,
      },
      {
        name: 'depth',
        description: 'Research depth',
        type: 3,
        required: false,
        choices: [
          { name: 'Quick (30 seconds)', value: 'quick' },
          { name: 'Standard (2 minutes)', value: 'standard' },
          { name: 'Deep (5+ minutes)', value: 'deep' },
        ],
      },
    ],
  },
  {
    name: 'goals',
    description: '🎯 Set and track community goals',
    options: [
      {
        name: 'action',
        description: 'What do you want to do?',
        type: 3,
        required: true,
        choices: [
          { name: '➕ Set New Goal', value: 'set' },
          { name: '📋 View My Goals', value: 'view' },
          { name: '✅ Complete Goal', value: 'complete' },
          { name: '🏆 Leaderboard', value: 'leaderboard' },
        ],
      },
      {
        name: 'goal',
        description: 'Goal description or ID',
        type: 3,
        required: false,
      },
    ],
  },
  {
    name: 'usage',
    description: '📊 Check your A.I.M.S. usage and credits',
  },
  {
    name: 'deploy',
    description: '🚀 Deploy Dock — Launch and manage Boomer_Ang agents',
    options: [
      {
        name: 'action',
        description: 'Deployment action',
        type: 3,
        required: true,
        choices: [
          { name: '📋 Status', value: 'status' },
          { name: '🐣 Hatch Agents', value: 'hatch' },
          { name: '🚀 Launch', value: 'launch' },
          { name: '📊 Roster', value: 'roster' },
        ],
      },
    ],
  },
  {
    name: 'aims',
    description: '📖 A.I.M.S. help — See all available features',
  },
];

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

async function main() {
  const applicationId = process.env.DISCORD_CLIENT_ID;
  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (!applicationId || !botToken) {
    console.error('❌ Missing environment variables:');
    if (!applicationId) console.error('   DISCORD_CLIENT_ID');
    if (!botToken) console.error('   DISCORD_BOT_TOKEN');
    console.error('\nAdd them to frontend/.env.local');
    process.exit(1);
  }

  // Check for guild-specific registration
  const guildArg = process.argv.indexOf('--guild');
  const guildId = guildArg !== -1 ? process.argv[guildArg + 1] : null;

  if (guildId) {
    // Guild commands are instant (for testing)
    const url = `${DISCORD_API_BASE}/applications/${applicationId}/guilds/${guildId}/commands`;
    console.log(`\n🏠 Registering ${COMMANDS.length} commands for guild ${guildId}...\n`);

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(COMMANDS),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Failed:', error);
      process.exit(1);
    }

    const registered = await response.json();
    console.log(`✅ Registered ${registered.length} guild commands:`);
    registered.forEach((cmd: any) => console.log(`   /${cmd.name} — ${cmd.description}`));
  } else {
    // Global commands take ~1 hour to propagate
    const url = `${DISCORD_API_BASE}/applications/${applicationId}/commands`;
    console.log(`\n🌐 Registering ${COMMANDS.length} GLOBAL commands...\n`);
    console.log('⚠️  Global commands take up to 1 hour to appear.');
    console.log('   For instant testing, use: --guild YOUR_GUILD_ID\n');

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(COMMANDS),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Failed:', error);
      process.exit(1);
    }

    const registered = await response.json();
    console.log(`✅ Registered ${registered.length} global commands:`);
    registered.forEach((cmd: any) => console.log(`   /${cmd.name} — ${cmd.description}`));
  }

  console.log('\n🎉 Done! Commands are registered.\n');
}

main().catch(console.error);
