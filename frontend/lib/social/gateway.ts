/**
 * Social Messaging Gateway — Provider-agnostic inbound message pipeline
 *
 * All social providers (Telegram, WhatsApp, Discord) normalize their events
 * into this common format before routing to ACHEEVY chat orchestration.
 */

export type SocialProvider = 'telegram' | 'whatsapp' | 'discord';

export interface NormalizedMessage {
  provider: SocialProvider;
  provider_user_id: string;
  channel_id: string;
  message_text: string;
  timestamp: number;
  metadata: {
    username?: string;
    display_name?: string;
    is_command?: boolean;
    command?: string;
    reply_to_message_id?: string;
  };
}

export interface SocialLinkCode {
  code: string;
  provider: SocialProvider;
  provider_user_id: string;
  created_at: number;
  expires_at: number;
  claimed: boolean;
  platform_user_id?: string;
}

export interface OutboundMessage {
  provider: SocialProvider;
  channel_id: string;
  text: string;
  parse_mode?: 'Markdown' | 'HTML' | 'plain';
}

export interface AuditEvent {
  id: string;
  timestamp: number;
  direction: 'inbound' | 'outbound';
  provider: SocialProvider;
  provider_user_id: string;
  platform_user_id?: string;
  message_preview: string;
  status: 'received' | 'processed' | 'sent' | 'failed' | 'rejected';
  error?: string;
}

// In-memory stores (will be replaced with Firebase/DB later)
const linkCodes = new Map<string, SocialLinkCode>();
const userMappings = new Map<string, string>(); // "provider:provider_user_id" → platform_user_id
const auditLog: AuditEvent[] = [];

export function generateLinkCode(provider: SocialProvider, providerUserId: string): SocialLinkCode {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const entry: SocialLinkCode = {
    code,
    provider,
    provider_user_id: providerUserId,
    created_at: Date.now(),
    expires_at: Date.now() + 10 * 60 * 1000, // 10 minutes
    claimed: false,
  };
  linkCodes.set(code, entry);
  return entry;
}

export function claimLinkCode(code: string, platformUserId: string): boolean {
  const entry = linkCodes.get(code);
  if (!entry || entry.claimed || Date.now() > entry.expires_at) return false;
  entry.claimed = true;
  entry.platform_user_id = platformUserId;
  const key = `${entry.provider}:${entry.provider_user_id}`;
  userMappings.set(key, platformUserId);
  return true;
}

export function lookupPlatformUser(provider: SocialProvider, providerUserId: string): string | undefined {
  return userMappings.get(`${provider}:${providerUserId}`);
}

export function unlinkUser(provider: SocialProvider, providerUserId: string): boolean {
  return userMappings.delete(`${provider}:${providerUserId}`);
}

export function logAuditEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): AuditEvent {
  const full: AuditEvent = {
    ...event,
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
  };
  auditLog.push(full);
  if (auditLog.length > 500) auditLog.shift();
  return full;
}

export function getRecentAuditEvents(limit = 50): AuditEvent[] {
  return auditLog.slice(-limit).reverse();
}
