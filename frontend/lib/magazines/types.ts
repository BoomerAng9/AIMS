/**
 * Magazine Types — Frontend type definitions
 * Mirrors backend/uef-gateway/src/types/magazine.ts
 */

export interface Magazine {
  id: string;
  name: string;
  description: string;
  icon: string;
  systemPrompt: string;
  dataSources: DataSource[];
  skills: string[];
  voiceConfig?: MagazineVoiceConfig;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isDefault?: boolean;
  isPublic?: boolean;
}

export interface DataSource {
  id: string;
  magazineId: string;
  type: 'text' | 'url' | 'file' | 'api' | 'notion';
  name: string;
  content: string;
  metadata: {
    fileName?: string;
    mimeType?: string;
    charCount?: number;
    wordCount?: number;
    summary?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface MagazineVoiceConfig {
  voiceId?: string;
  speed?: number;
  stability?: number;
  style?: number;
}

export interface MagazineSlot {
  slotIndex: number;
  magazineId: string;
  magazine?: Magazine;
  active: boolean;
  loadedAt: string;
}
