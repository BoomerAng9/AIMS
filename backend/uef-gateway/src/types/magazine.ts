/**
 * Magazine Types — A.I.M.S. Context Loading System
 *
 * A "Magazine" is a loadable context package (persona + system prompt +
 * reference documents + skills + voice config) that can be hot-swapped
 * in the ACHEEVY chat. Think: gun magazine → load, swap, fire.
 *
 * Based on the NotebookLM data-source concept adapted for A.I.M.S.
 */

// ─────────────────────────────────────────────────────────────
// Core Types
// ─────────────────────────────────────────────────────────────

export interface Magazine {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji or icon key
  systemPrompt: string;
  dataSources: DataSource[];
  skills: string[]; // Skill IDs from the skills registry
  voiceConfig?: MagazineVoiceConfig;
  tags: string[];
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  createdBy: string; // User ID
  isDefault?: boolean; // Pre-loaded magazines
  isPublic?: boolean; // Visible in marketplace
}

export interface DataSource {
  id: string;
  magazineId: string;
  type: DataSourceType;
  name: string;
  content: string; // Raw content or URL
  metadata: DataSourceMetadata;
  embeddingRef?: string; // Reference to vector embedding (future RAG)
  contentHash?: string; // SHA-256 for dedup
  createdAt: string;
  updatedAt: string;
}

export type DataSourceType = 'text' | 'url' | 'file' | 'api' | 'notion';

export interface DataSourceMetadata {
  /** Original filename for file uploads */
  fileName?: string;
  /** MIME type */
  mimeType?: string;
  /** Character count of content */
  charCount?: number;
  /** Word count */
  wordCount?: number;
  /** For URL sources — last fetched timestamp */
  lastFetched?: string;
  /** For API sources — endpoint URL */
  endpoint?: string;
  /** For Notion sources — page ID */
  notionPageId?: string;
  /** Extraction summary (first 500 chars) */
  summary?: string;
}

export interface MagazineVoiceConfig {
  voiceId?: string; // ElevenLabs voice ID
  speed?: number; // 0.5–2.0
  stability?: number; // 0.0–1.0
  style?: number; // 0.0–1.0
}

// ─────────────────────────────────────────────────────────────
// Magazine Slots — What's "in the chamber"
// ─────────────────────────────────────────────────────────────

export interface MagazineSlot {
  slotIndex: number;
  magazineId: string;
  magazine?: Magazine; // Hydrated reference
  active: boolean;
  loadedAt: string;
}

export interface ActiveMagazineState {
  slots: MagazineSlot[];
  maxSlots: number; // Default: 3 (can load up to 3 magazines simultaneously)
  combinedContext: string; // Pre-built context string from all active magazines
  totalTokenEstimate: number;
}

// ─────────────────────────────────────────────────────────────
// API Request / Response shapes
// ─────────────────────────────────────────────────────────────

export interface CreateMagazineRequest {
  name: string;
  description: string;
  icon?: string;
  systemPrompt?: string;
  tags?: string[];
  skills?: string[];
  voiceConfig?: MagazineVoiceConfig;
}

export interface UpdateMagazineRequest {
  name?: string;
  description?: string;
  icon?: string;
  systemPrompt?: string;
  tags?: string[];
  skills?: string[];
  voiceConfig?: MagazineVoiceConfig;
}

export interface AddDataSourceRequest {
  type: DataSourceType;
  name: string;
  content: string;
  metadata?: Partial<DataSourceMetadata>;
}

export interface LoadMagazineRequest {
  magazineId: string;
  slotIndex?: number; // Auto-assign if not specified
}

export interface MagazineListResponse {
  magazines: Magazine[];
  total: number;
}

export interface ActiveMagazineResponse {
  slots: MagazineSlot[];
  maxSlots: number;
  totalTokenEstimate: number;
}

// ─────────────────────────────────────────────────────────────
// Default Magazines (pre-loaded templates)
// ─────────────────────────────────────────────────────────────

export const DEFAULT_MAGAZINES: Omit<Magazine, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>[] = [
  {
    name: 'Business Builder',
    description: 'Startup advisor mode. Hormozi-style direct strategy. Every question advances toward action.',
    icon: '🏗️',
    systemPrompt: `You are in BUSINESS BUILDER mode. Be direct. Hormozi-style.
Every question must advance toward ACTION. Push for specifics.
When the chain completes, ALWAYS offer to execute: "Ready to build this?"
No fluff, no filler, no motivational speeches. Be a strategist, not a cheerleader.`,
    dataSources: [],
    skills: ['market-research', 'business-plan', 'landing-page'],
    tags: ['business', 'startup', 'strategy'],
    isDefault: true,
    isPublic: true,
  },
  {
    name: 'Growth Advisor',
    description: 'Data-first scaling mode. Systems thinker. Growth engineer.',
    icon: '📈',
    systemPrompt: `You are in GROWTH ADVISOR mode. Systems thinker. Growth engineer.
Every recommendation must be backed by data or a named framework.
Focus on SYSTEMS, not one-off tactics. Build repeatable processes that scale.
Reference metrics: CAC, LTV, churn, MRR, conversion rates, time-to-value.`,
    dataSources: [],
    skills: ['analytics', 'seo-audit', 'competitor-analysis'],
    tags: ['growth', 'analytics', 'scaling'],
    isDefault: true,
    isPublic: true,
  },
  {
    name: 'Code Architect',
    description: 'Full-stack engineering mode. Architecture-first. Clean code, performance, security.',
    icon: '⚙️',
    systemPrompt: `You are in CODE ARCHITECT mode. Engineering-first.
Always consider: architecture, performance, security, maintainability.
Suggest patterns, not just code. Reference best practices by name.
When building: start with types/interfaces, then implementation, then tests.`,
    dataSources: [],
    skills: ['code-review', 'architecture-design', 'deployment'],
    tags: ['engineering', 'architecture', 'code'],
    isDefault: true,
    isPublic: true,
  },
  {
    name: 'Content Studio',
    description: 'Creative content mode. Copy, scripts, social media, brand voice.',
    icon: '🎬',
    systemPrompt: `You are in CONTENT STUDIO mode. Creative director.
Focus on brand voice, hook-first writing, visual storytelling.
Every piece of content needs: a hook, a body, a CTA.
Adapt tone to platform: LinkedIn = professional, Twitter = punchy, Blog = detailed.`,
    dataSources: [],
    skills: ['copywriting', 'social-media', 'video-script'],
    tags: ['content', 'creative', 'marketing'],
    isDefault: true,
    isPublic: true,
  },
];
