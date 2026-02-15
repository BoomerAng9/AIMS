/**
 * Per|Form Data Contracts
 *
 * AthleteCardJSON — the canonical payload every renderer and publisher consumes.
 * CardStyleSpec  — the design contract every card render must follow.
 *
 * These are the two foundation contracts that make the entire Per|Form
 * closed-loop deterministic and style-extensible.
 */

// ---------------------------------------------------------------------------
// AthleteCardJSON — the athlete data payload
// ---------------------------------------------------------------------------

export interface AthleteIdentity {
  athleteId: string;
  firstName: string;
  lastName: string;
  suffix?: string;               // Jr., III, etc.
  position: string;              // QB, WR, LB, etc.
  positionGroup?: string;        // OFFENSE, DEFENSE, SPECIAL_TEAMS
  school: string;
  city?: string;
  state: string;
  classYear: number;             // graduation year (2025, 2026, etc.)
  heightInches?: number;
  weightLbs?: number;
  jersey?: number;
}

export interface SeasonStatsSummary {
  season: string;                // "2024", "2024-2025"
  level: 'HIGH_SCHOOL' | 'JUCO' | 'FBS' | 'FCS' | 'D2' | 'D3' | 'NAIA';
  gamesPlayed: number;
  statLines: StatLine[];
}

export interface StatLine {
  category: string;              // "Passing", "Rushing", "Receiving", "Tackles", etc.
  stats: Record<string, number | string>;
  // e.g. { yards: 3200, touchdowns: 28, completionPct: "67.2%" }
}

export interface GradeBreakdown {
  overallGrade: number;          // 0-100
  tier: 'ELITE' | 'BLUE_CHIP' | 'PROSPECT' | 'SLEEPER' | 'DEVELOPMENTAL';
  components: GradeComponent[];
  methodology: string;           // "per|form_v1_historical"
  confidence: number;            // 0-100, how much data backed this grade
}

export interface GradeComponent {
  name: string;                  // "Production", "Efficiency", "Consistency", "Competition Level"
  score: number;                 // 0-100
  weight: number;                // 0-1
}

export interface RankContext {
  nationalRank?: number;
  stateRank?: number;
  positionRank?: number;
  cohortSize: number;            // how many in the ranking pool
  cohortDescription: string;     // "2024 QB - All States"
}

export interface AthleteMedia {
  headshotUrl?: string;
  actionPhotoUrl?: string;
  highlightsUrl?: string;        // link to film/highlights
  schoolLogoUrl?: string;
  sourceAttribution?: string;    // "Photo via MaxPreps" etc.
}

export interface AthleteBioMemo {
  bio: string;                   // 2-4 sentence public bio
  scoutMemo: string;             // 1-2 paragraph evaluator's take
  tags: string[];                // ["dual-threat", "pocket-passer", "film-grinder"]
  comparisons?: string[];        // ["plays like a young Russell Wilson"]
}

export interface AthleteCardJSON {
  // Contract metadata
  contractVersion: '1.0';
  generatedAt: string;           // ISO timestamp
  generatedBy: string;           // agent or pipeline ID

  // Core payload
  identity: AthleteIdentity;
  seasonStats: SeasonStatsSummary[];
  grade: GradeBreakdown;
  rank: RankContext;
  bioMemo: AthleteBioMemo;
  media: AthleteMedia;

  // Rendering
  cardStyleId: string;           // references CardStyleSpec.styleId

  // Compliance
  dataSourceIds: string[];       // audit trail: what datasets/sources fed this
  complianceFlags: string[];     // any warnings (e.g., "photo_unverified")
}

// ---------------------------------------------------------------------------
// CardStyleSpec — the design contract for rendering
// ---------------------------------------------------------------------------

export interface CardTypographyTokens {
  nameFont: string;
  nameSizeRem: number;
  nameWeight: number;
  positionFont: string;
  positionSizeRem: number;
  schoolFont: string;
  schoolSizeRem: number;
  statsFont: string;
  statsSizeRem: number;
  gradeFont: string;
  gradeSizeRem: number;
}

export interface CardSpacingTokens {
  cardWidthPx: number;
  cardHeightPx: number;
  paddingPx: number;
  borderRadiusPx: number;
  shadowSpec: string;            // CSS box-shadow value
  imageHeight: string;           // "60%" or "240px"
}

export interface CardColorTokens {
  background: string;
  backgroundGradient?: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  gradeColor: Record<string, string>;  // tier → color
  // { ELITE: "#FFD700", BLUE_CHIP: "#00BFFF", ... }
}

export interface CardSlot {
  field: string;                 // which AthleteCardJSON field maps here
  position: 'top-left' | 'top-center' | 'top-right' | 'center' | 'bottom-left' | 'bottom-center' | 'bottom-right' | 'overlay';
  zIndex: number;
  customCss?: string;
}

export interface CardStyleSpec {
  styleId: string;
  styleName: string;
  layoutVersion: string;         // semver
  description: string;

  // What data must exist to render
  inputsRequired: string[];      // keys from AthleteCardJSON

  // Design tokens
  typography: CardTypographyTokens;
  spacing: CardSpacingTokens;
  colors: CardColorTokens;

  // Layout slots
  slots: CardSlot[];

  // Render targets
  renderTargets: ('card_png' | 'card_svg' | 'webpage_section')[];

  // Style learning
  exampleRefs: string[];         // URLs or IDs of reference images

  // Compliance
  complianceRules: string[];     // things the renderer must never do
}

// ---------------------------------------------------------------------------
// Pipeline contracts
// ---------------------------------------------------------------------------

export type PipelineStage =
  | 'INGEST'
  | 'ENRICH'
  | 'GRADE'
  | 'RANK'
  | 'WRITE_BIO'
  | 'RENDER_CARD'
  | 'PUBLISH_CDN'
  | 'VALIDATE';

export interface PipelineInput {
  athleteName?: string;
  athleteId?: string;
  cardStyleId?: string;          // defaults to BryceYoung_Classic
  dataSourceOverride?: string;   // specific dataset to use
}

export interface PipelineOutput {
  athleteCard: AthleteCardJSON;
  artifacts: {
    cardPngUrl?: string;
    cardSvgUrl?: string;
    webpageUrl?: string;
  };
  pipelineLog: string[];
  totalCost: { tokens: number; usd: number };
}

// ---------------------------------------------------------------------------
// Gridiron Sandbox contracts — adversarial scouting + GROC+Luke grading
// ---------------------------------------------------------------------------

export interface ProspectTarget {
  name: string;
  pool: 'HIGH_SCHOOL' | 'COLLEGE';
  source: string;
  position?: string;
  school?: string;
  state?: string;
  classYear?: number;
}

export interface DebateArgument {
  hawk: 'Lil_Bull_Hawk' | 'Lil_Bear_Hawk';
  stance: 'UNDERRATED' | 'OVERRATED';
  points: string[];
  statsCited: Record<string, string | number>[];
  confidence: number;
}

export interface ScoutingDebateLog {
  debateId: string;
  prospect: ProspectTarget;
  timestamp: string;
  arguments: DebateArgument[];
  rawData: {
    braveResults: number;
    firecrawlPages: number;
    statsFound: number;
  };
  status: 'COMPLETE' | 'PARTIAL' | 'FAILED';
}

/** GROC = Game performance, Raw athletics, Overall production, Competition level */
export interface GROCScore {
  gamePerformance: number;
  rawAthletics: number;
  overallProduction: number;
  competitionLevel: number;
}

/** Luke = Leadership, Upside, Known concerns, Evaluator confidence */
export interface LukeAdjustment {
  leadershipMultiplier: number;
  upsideCeiling: number;
  knownConcerns: string[];
  evaluatorConfidence: number;
}

export interface GradingDossier {
  dossierId: string;
  prospectName: string;
  pool: string;
  grocScore: GROCScore;
  lukeAdjustment: LukeAdjustment;
  preliminaryGrade: number;
  tier: 'ELITE' | 'BLUE_CHIP' | 'PROSPECT' | 'SLEEPER' | 'DEVELOPMENTAL';
  flaggedForFilm: boolean;
  debateWinner: 'BULL' | 'BEAR' | 'SPLIT';
  validatedStats: Record<string, string | number>[];
}

export interface PerFormRanking {
  rank: number;
  prospectName: string;
  position: string;
  pool: string;
  grade: number;
  tier: string;
  trend: 'UP' | 'DOWN' | 'STEADY' | 'NEW';
  previousRank?: number;
  lastUpdated: string;
}

export interface FilmAnalysisRequest {
  requestId: string;
  prospectName: string;
  videoUrl: string;
  clickCoords: [number, number][];
  frameRate?: number;
  analysisType: 'FULL_GAME' | 'HIGHLIGHT_REEL' | 'SINGLE_PLAY';
}

export interface FilmAnalysisMetrics {
  speedBursts: number;
  avgSeparationYards: number;
  routeSharpness: number;
  playRecognition: number;
}

export interface ContentOutput {
  type: 'BLOG' | 'PODCAST' | 'RANKING_UPDATE';
  prospectName: string;
  title: string;
  content: string;
  generatedAt: string;
  generatedBy: string;
}
