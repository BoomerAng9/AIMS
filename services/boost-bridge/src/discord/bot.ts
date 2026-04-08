/**
 * Boost|Bridge Discord Bot — "The Companion"
 *
 * Standalone bot process for interactive Discord features:
 *   - Slash commands for running simulations from Discord
 *   - Role assignment for belt tiers
 *   - Curriculum submission via Discord forms
 *   - Badge verification lookup
 *
 * Run separately from main server: `bun run src/discord/bot.ts`
 *
 * Required env:
 *   DISCORD_BOT_TOKEN — Bot token from Discord Developer Portal
 *   DISCORD_GUILD_ID  — Server ID
 *   BB_API_URL        — Boost|Bridge API base URL (default: http://localhost:7001)
 */

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || '';
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID || '';
const BB_API_URL = process.env.BB_API_URL || 'http://localhost:7001';

import { DISCORD_CATEGORIES, DISCORD_ROLES } from './channels.js';

if (!DISCORD_BOT_TOKEN) {
  console.error('[Bot] DISCORD_BOT_TOKEN is required. Set it in your environment.');
  process.exit(1);
}

// ─── Dynamic import for discord.js (optional dependency) ──────────────────

async function startBot() {
  let Client: typeof import('discord.js').Client;
  let GatewayIntentBits: typeof import('discord.js').GatewayIntentBits;
  let REST: typeof import('discord.js').REST;
  let Routes: typeof import('discord.js').Routes;
  let SlashCommandBuilder: typeof import('discord.js').SlashCommandBuilder;

  try {
    const djs = await import('discord.js');
    Client = djs.Client;
    GatewayIntentBits = djs.GatewayIntentBits;
    REST = djs.REST;
    Routes = djs.Routes;
    SlashCommandBuilder = djs.SlashCommandBuilder;
  } catch {
    console.error('[Bot] discord.js not installed. Run: bun add discord.js');
    process.exit(1);
  }

  // ─── Slash Commands ───────────────────────────────────────────────

  const commands = [
    new SlashCommandBuilder()
      .setName('simulate')
      .setDescription('Run a Crowd simulation on your idea')
      .addStringOption(opt => opt.setName('product').setDescription('Product/idea name').setRequired(true))
      .addStringOption(opt => opt.setName('description').setDescription('Describe your product in 2-3 sentences').setRequired(true))
      .addStringOption(opt => opt.setName('demo').setDescription('Target demographic').setRequired(false))
      .addIntegerOption(opt => opt.setName('personas').setDescription('Number of personas (5-100)').setRequired(false)),

    new SlashCommandBuilder()
      .setName('verify-badge')
      .setDescription('Verify a Boost Badge by ID')
      .addStringOption(opt => opt.setName('badge_id').setDescription('The badge ID to verify').setRequired(true)),

    new SlashCommandBuilder()
      .setName('leaderboard')
      .setDescription('View the Dojo leaderboard'),

    new SlashCommandBuilder()
      .setName('setup-server')
      .setDescription('Set up Boost|Bridge Discord channel structure (admin only)'),
  ];

  // Register commands
  const rest = new REST({ version: '10' }).setToken(DISCORD_BOT_TOKEN);

  try {
    console.log('[Bot] Registering slash commands...');
    await rest.put(
      Routes.applicationGuildCommands(
        (await rest.get(Routes.currentApplication()) as { id: string }).id,
        DISCORD_GUILD_ID,
      ),
      { body: commands.map(c => c.toJSON()) },
    );
    console.log('[Bot] Slash commands registered.');
  } catch (err) {
    console.error('[Bot] Failed to register commands:', err);
  }

  // ─── Bot Client ─────────────────────────────────────────────────────

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
    ],
  });

  client.on('ready', () => {
    console.log(`[Bot] Logged in as ${client.user?.tag}`);
    console.log(`[Bot] Serving guild: ${DISCORD_GUILD_ID}`);
    console.log(`[Bot] API: ${BB_API_URL}`);
  });

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    // /simulate — Kick off a Crowd simulation
    if (interaction.commandName === 'simulate') {
      const product = interaction.options.getString('product', true);
      const description = interaction.options.getString('description', true);
      const demo = interaction.options.getString('demo') || 'General consumers, ages 18-55';
      const personas = Math.min(Math.max(interaction.options.getInteger('personas') || 20, 5), 100);

      await interaction.deferReply();

      try {
        const res = await fetch(`${BB_API_URL}/api/crowd/simulate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productName: product,
            productDescription: description,
            targetDemo: demo,
            personaCount: personas,
          }),
        });

        if (res.ok) {
          const data = await res.json() as { jobId: string };
          await interaction.editReply(
            `**The Crowd is assembling.** ${personas} synthetic personas are about to experience "${product}"\n\n` +
            `Job ID: \`${data.jobId}\`\n` +
            `Results will drop in #synthetic-feedback when ready.`,
          );
        } else {
          await interaction.editReply('Simulation failed to start. Is the Boost|Bridge service running?');
        }
      } catch {
        await interaction.editReply('Could not connect to Boost|Bridge API. Check that the service is running.');
      }
    }

    // /verify-badge — Look up a badge
    if (interaction.commandName === 'verify-badge') {
      const badgeId = interaction.options.getString('badge_id', true);

      try {
        const res = await fetch(`${BB_API_URL}/api/badge/verify/${badgeId}`);
        const data = await res.json() as { valid: boolean; badge?: { recipientName: string; tier: string; domain: string; score: number; hash: string; earnedAt: string } };

        if (data.valid && data.badge) {
          const b = data.badge;
          await interaction.reply({
            embeds: [{
              title: 'Badge Verified',
              description: `**${b.recipientName}** — ${b.tier.toUpperCase()} BELT in ${b.domain}`,
              color: 0x22c55e,
              fields: [
                { name: 'Score', value: `${b.score}%`, inline: true },
                { name: 'Earned', value: new Date(b.earnedAt).toLocaleDateString(), inline: true },
                { name: 'Hash', value: `\`${b.hash.slice(0, 24)}...\``, inline: false },
              ],
            }],
          });
        } else {
          await interaction.reply({ content: `Badge \`${badgeId}\` not found or invalid.`, ephemeral: true });
        }
      } catch {
        await interaction.reply({ content: 'Could not connect to Boost|Bridge API.', ephemeral: true });
      }
    }

    // /leaderboard — Show Dojo rankings
    if (interaction.commandName === 'leaderboard') {
      try {
        const res = await fetch(`${BB_API_URL}/api/dojo/badges`);
        const data = await res.json() as { total: number; badges: Array<{ recipientName: string; tier: string; domain: string; score: number }> };

        if (data.total === 0) {
          await interaction.reply('No badges earned yet. Be the first to hit the Dojo.');
          return;
        }

        const leaderboard = data.badges
          .slice(0, 15)
          .map((b, i) => {
            const emoji = b.tier === 'sensei' ? '👑' : b.tier === 'black' ? '🥋' : b.tier === 'blue' ? '🔵' : '⚪';
            return `${i + 1}. ${emoji} **${b.recipientName}** — ${b.tier.toUpperCase()} in ${b.domain} (${b.score}%)`;
          })
          .join('\n');

        await interaction.reply({
          embeds: [{
            title: 'Dojo Leaderboard',
            description: leaderboard,
            color: 0x8b5cf6,
            footer: { text: `${data.total} total badges earned` },
          }],
        });
      } catch {
        await interaction.reply({ content: 'Could not fetch leaderboard.', ephemeral: true });
      }
    }

    // /setup-server — Create channel structure (admin only)
    if (interaction.commandName === 'setup-server') {
      if (!interaction.memberPermissions?.has('Administrator')) {
        await interaction.reply({ content: 'Admin only.', ephemeral: true });
        return;
      }

      await interaction.deferReply({ ephemeral: true });

      const guild = interaction.guild;
      if (!guild) {
        await interaction.editReply('Could not access guild.');
        return;
      }

      const created: string[] = [];

      for (const cat of DISCORD_CATEGORIES) {
        try {
          const category = await guild.channels.create({
            name: `${cat.emoji} ${cat.name}`,
            type: 4, // CategoryChannel
          });

          for (const ch of cat.channels) {
            const channelType = ch.type === 'forum' ? 15 : ch.type === 'voice' ? 2 : 0;
            await guild.channels.create({
              name: ch.name,
              type: channelType,
              parent: category.id,
              topic: ch.topic,
            });
            created.push(`#${ch.name}`);
          }
        } catch (err) {
          console.error(`[Bot] Failed to create category ${cat.name}:`, err);
        }
      }

      // Create roles
      for (const role of DISCORD_ROLES) {
        try {
          await guild.roles.create({
            name: role.name,
            color: role.color,
            reason: `Boost|Bridge setup: ${role.description}`,
          });
        } catch {
          // Role may already exist
        }
      }

      await interaction.editReply(
        `Server structure created.\n\n**Channels:** ${created.join(', ')}\n**Roles:** ${DISCORD_ROLES.map(r => r.name).join(', ')}`,
      );
    }
  });

  await client.login(DISCORD_BOT_TOKEN);
}

startBot().catch(err => {
  console.error('[Bot] Fatal error:', err);
  process.exit(1);
});
