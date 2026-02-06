/**
 * Card Style Registry
 *
 * In-memory registry for now. Designed to be backed by Firestore/Postgres
 * when persistence layer lands.
 *
 * Every card render resolves a card_style_id through this registry
 * before producing output. Unknown style → falls back to default.
 */

import logger from '../../logger';
import { CardStyleSpec } from '../contracts';

// ---------------------------------------------------------------------------
// BryceYoung_Classic — the default style
// ---------------------------------------------------------------------------

export const BRYCE_YOUNG_CLASSIC: CardStyleSpec = {
  styleId: 'bryce-young-classic',
  styleName: 'BryceYoung_Classic',
  layoutVersion: '1.0.0',
  description: 'Clean, modern prospect card inspired by premium recruiting profiles. Dark background, gold accents, large hero image with stats overlay.',

  inputsRequired: [
    'identity.firstName',
    'identity.lastName',
    'identity.position',
    'identity.school',
    'identity.state',
    'identity.classYear',
    'grade.overallGrade',
    'grade.tier',
    'rank.positionRank',
    'media.headshotUrl',
  ],

  typography: {
    nameFont: 'Inter',
    nameSizeRem: 2.0,
    nameWeight: 800,
    positionFont: 'Inter',
    positionSizeRem: 0.875,
    schoolFont: 'Inter',
    schoolSizeRem: 1.0,
    statsFont: 'Inter',
    statsSizeRem: 0.75,
    gradeFont: 'Inter',
    gradeSizeRem: 3.5,
  },

  spacing: {
    cardWidthPx: 400,
    cardHeightPx: 560,
    paddingPx: 24,
    borderRadiusPx: 24,
    shadowSpec: '0 8px 32px rgba(0,0,0,0.6)',
    imageHeight: '55%',
  },

  colors: {
    background: '#0A0A0A',
    backgroundGradient: 'linear-gradient(180deg, #1A1A1A 0%, #0A0A0A 100%)',
    textPrimary: '#FAFAFA',
    textSecondary: 'rgba(255,255,255,0.6)',
    accent: '#D4AF37',
    gradeColor: {
      ELITE: '#FFD700',
      BLUE_CHIP: '#00BFFF',
      PROSPECT: '#90EE90',
      SLEEPER: '#FFA500',
      DEVELOPMENTAL: '#A0A0A0',
    },
  },

  slots: [
    { field: 'media.headshotUrl', position: 'top-center', zIndex: 1 },
    { field: 'identity.firstName + identity.lastName', position: 'center', zIndex: 10 },
    { field: 'identity.position', position: 'center', zIndex: 10 },
    { field: 'identity.school + identity.state', position: 'center', zIndex: 10 },
    { field: 'grade.overallGrade', position: 'top-right', zIndex: 20, customCss: 'font-size: 3.5rem; font-weight: 900;' },
    { field: 'grade.tier', position: 'top-right', zIndex: 20 },
    { field: 'rank.positionRank', position: 'top-left', zIndex: 20 },
    { field: 'seasonStats[0].statLines', position: 'bottom-center', zIndex: 10 },
    { field: 'bioMemo.tags', position: 'bottom-left', zIndex: 10 },
  ],

  renderTargets: ['card_png', 'card_svg', 'webpage_section'],

  exampleRefs: [],

  complianceRules: [
    'Never display team logos without licensing agreement',
    'Never use NCAA or NFL trademarks',
    'Always include data source attribution',
    'Never fabricate stats — show "N/A" if data missing',
    'Photo must match athlete or show generic silhouette',
    'Grade must include methodology reference',
  ],
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

class CardStyleRegistry {
  private styles = new Map<string, CardStyleSpec>();
  private defaultStyleId: string;

  constructor() {
    this.defaultStyleId = BRYCE_YOUNG_CLASSIC.styleId;
    this.register(BRYCE_YOUNG_CLASSIC);
  }

  register(spec: CardStyleSpec): void {
    this.styles.set(spec.styleId, spec);
    logger.info({ styleId: spec.styleId, name: spec.styleName }, '[CardStyleRegistry] Style registered');
  }

  get(styleId: string): CardStyleSpec {
    const style = this.styles.get(styleId);
    if (!style) {
      logger.warn({ styleId, fallback: this.defaultStyleId }, '[CardStyleRegistry] Unknown style, using default');
      return this.styles.get(this.defaultStyleId)!;
    }
    return style;
  }

  getDefault(): CardStyleSpec {
    return this.styles.get(this.defaultStyleId)!;
  }

  list(): Array<{ styleId: string; styleName: string; description: string }> {
    return Array.from(this.styles.values()).map(s => ({
      styleId: s.styleId,
      styleName: s.styleName,
      description: s.description,
    }));
  }

  has(styleId: string): boolean {
    return this.styles.has(styleId);
  }

  /**
   * Validate whether an AthleteCardJSON payload has all required
   * fields for a given style. Returns missing field paths.
   */
  validateInputs(styleId: string, payload: Record<string, unknown>): string[] {
    const style = this.get(styleId);
    const missing: string[] = [];

    for (const path of style.inputsRequired) {
      const value = resolvePath(payload, path);
      if (value === undefined || value === null || value === '') {
        missing.push(path);
      }
    }

    return missing;
  }
}

function resolvePath(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

export const cardStyleRegistry = new CardStyleRegistry();
