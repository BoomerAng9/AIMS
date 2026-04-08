/**
 * Boost|Bridge Discord Channel Architecture
 *
 * "The Evolving Space" — A Discord server built to BUILD, not just chat.
 * Every category maps to a Boost|Bridge engine or culture pillar.
 */

export interface ChannelDefinition {
  name: string;
  topic: string;
  type: 'text' | 'voice' | 'forum';
  webhookPurpose?: string;    // If this channel receives automated posts
}

export interface CategoryDefinition {
  name: string;
  emoji: string;
  description: string;
  channels: ChannelDefinition[];
}

// ─── Server Architecture ──────────────────────────────────────────────────

export const DISCORD_CATEGORIES: CategoryDefinition[] = [
  {
    name: 'THE LOUNGE',
    emoji: '🟢',
    description: 'Culture & Connection — the heartbeat of the community',
    channels: [
      {
        name: 'dap-up',
        topic: 'Welcome & intros. New here? Give us a dap. Keep it chill.',
        type: 'text',
      },
      {
        name: 'the-cypher',
        topic: 'General chat, off-topic, culture. The barbershop of Boost|Bridge.',
        type: 'text',
      },
      {
        name: 'aux-cord',
        topic: 'Music & vibes while working. Drop your playlist. No skips.',
        type: 'text',
      },
    ],
  },
  {
    name: 'THE LAB',
    emoji: '🔵',
    description: 'Simulations — where AI personas stress-test your ideas',
    channels: [
      {
        name: 'synthetic-feedback',
        topic: 'AI personas post their raw reviews of community ideas here. Read the room.',
        type: 'text',
        webhookPurpose: 'Receives automated Crowd simulation results from Boost|Bridge API',
      },
      {
        name: 'market-sims',
        topic: 'Live logs of market performance simulations. Data in real time.',
        type: 'text',
        webhookPurpose: 'Receives market simulation events and reports',
      },
      {
        name: 'agent-roast',
        topic: 'AI agents specifically tasked with finding flaws. "The Haters." If your idea survives this, it has legs.',
        type: 'text',
        webhookPurpose: 'Receives adversarial persona critiques',
      },
    ],
  },
  {
    name: 'THE DOJO',
    emoji: '🟣',
    description: 'P2P Training — users teaching users, AI keeping the standard',
    channels: [
      {
        name: 'training-floor',
        topic: 'Live P2P sessions. Ask questions, share screens, learn together.',
        type: 'text',
      },
      {
        name: 'curriculum-dev',
        topic: 'Collaborating on course materials. Build something worth teaching.',
        type: 'forum',
      },
      {
        name: 'accreditation-log',
        topic: 'Public log of Boost Badges earned. Verified skills, not participation trophies.',
        type: 'text',
        webhookPurpose: 'Receives badge issuance notifications from the Certifier Bot',
      },
    ],
  },
  {
    name: 'THE GATE',
    emoji: '🔐',
    description: 'Identity Verification — trust but verify before you enter',
    channels: [
      {
        name: 'verification-log',
        topic: 'Identity verification results and status updates. Privacy first — only verification status, never PII.',
        type: 'text',
        webhookPurpose: 'Receives anonymized verification completion events',
      },
      {
        name: 'credential-wall',
        topic: 'Verified professionals and their credential badges. The proof is in the wall.',
        type: 'text',
        webhookPurpose: 'Receives credential verification confirmations',
      },
      {
        name: 'gate-appeals',
        topic: 'Verification issues? Appeal here. A human reviews every flagged case.',
        type: 'forum',
      },
    ],
  },
  {
    name: 'THE BRIDGE',
    emoji: '🟠',
    description: 'Support & Build — where ideas become products',
    channels: [
      {
        name: 'bridge-support',
        topic: 'Need help with the platform? Ask here. No question is out of pocket.',
        type: 'text',
      },
      {
        name: 'consulting-launchpad',
        topic: 'Experts stepping into freelancing. AI as your XFactor. Launch your consulting practice here.',
        type: 'forum',
      },
      {
        name: 'build-log',
        topic: 'Share your Boost|Bridge journey. What are you building? Show the receipts.',
        type: 'forum',
      },
      {
        name: 'feature-remix',
        topic: 'Community voting on platform evolution. Your voice shapes what gets built next.',
        type: 'forum',
      },
    ],
  },
];

// ─── Role Definitions ─────────────────────────────────────────────────────

export const DISCORD_ROLES = [
  { name: 'Companion', color: 0x8b5cf6, description: 'Boost|Bridge AI Companion — automated posts and moderation' },
  { name: 'Builder', color: 0x3b82f6, description: 'Active platform user — building and testing ideas' },
  { name: 'Verified', color: 0x22c55e, description: 'Identity verified through The Gate — trusted community member' },
  { name: 'White Belt', color: 0xf5f5f5, description: 'Completed a Dojo course' },
  { name: 'Blue Belt', color: 0x3b82f6, description: 'Passed assessment with 80%+' },
  { name: 'Black Belt', color: 0x1a1a2e, description: 'Created and taught a certified course' },
  { name: 'Sensei', color: 0xf59e0b, description: '3+ Black Belt certifications with 4.5+ rating' },
  { name: 'Consultant', color: 0xec4899, description: 'Expert on the Consulting Launch Pad — verified freelance professional' },
  { name: 'Trial Runner', color: 0x22c55e, description: 'Currently participating in a product trial' },
];

// ─── Webhook Configuration ────────────────────────────────────────────────

export const WEBHOOK_CONFIGS = {
  syntheticFeedback: {
    channel: 'synthetic-feedback',
    name: 'The Crowd',
    avatar: 'crowd-avatar.png',
    envKey: 'DISCORD_WEBHOOK_SYNTHETIC',
  },
  marketSims: {
    channel: 'market-sims',
    name: 'Market Sim Engine',
    avatar: 'sim-avatar.png',
    envKey: 'DISCORD_WEBHOOK_MARKET_SIMS',
  },
  agentRoast: {
    channel: 'agent-roast',
    name: 'The Haters',
    avatar: 'roast-avatar.png',
    envKey: 'DISCORD_WEBHOOK_AGENT_ROAST',
  },
  accreditation: {
    channel: 'accreditation-log',
    name: 'Certifier Bot',
    avatar: 'badge-avatar.png',
    envKey: 'DISCORD_WEBHOOK_ACCREDITATION',
  },
  verificationLog: {
    channel: 'verification-log',
    name: 'The Gate',
    avatar: 'gate-avatar.png',
    envKey: 'DISCORD_WEBHOOK_VERIFICATION',
  },
  credentialWall: {
    channel: 'credential-wall',
    name: 'Credential Verifier',
    avatar: 'credential-avatar.png',
    envKey: 'DISCORD_WEBHOOK_CREDENTIAL_WALL',
  },
};
