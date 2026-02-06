'use client';

/**
 * A.I.M.S. Tech Stack & Infrastructure
 *
 * Visual overview of the platform's sophisticated foundation.
 * Adapted from NurdsCode vision with A.I.M.S. branding.
 */

import { motion } from 'framer-motion';
import { CircuitBoardPattern, AIMS_CIRCUIT_COLORS } from '@/components/ui/CircuitBoard';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface TechItem {
  name: string;
  description: string;
  icon?: string;
  color?: string;
}

interface TechCategory {
  title: string;
  icon: React.ReactNode;
  items: TechItem[];
  color?: string;
}

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────

const CodeIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

const ServerIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
    <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
    <line x1="6" y1="6" x2="6.01" y2="6" />
    <line x1="6" y1="18" x2="6.01" y2="18" />
  </svg>
);

const BrainIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2a4 4 0 0 1 4 4v1a4 4 0 0 1-4 4 4 4 0 0 1-4-4V6a4 4 0 0 1 4-4z" />
    <path d="M12 11v11" />
    <path d="M8 14a4 4 0 0 0-4 4" />
    <path d="M16 14a4 4 0 0 1 4 4" />
  </svg>
);

const ShieldIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const CloudIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
  </svg>
);

// ─────────────────────────────────────────────────────────────
// Tech Data
// ─────────────────────────────────────────────────────────────

const TECH_STACK: TechCategory[] = [
  {
    title: 'Frontend Technologies',
    icon: <CodeIcon className="w-6 h-6" />,
    color: '#3b82f6',
    items: [
      { name: 'Next.js 15', description: 'App Router framework', color: '#fff' },
      { name: 'React 19', description: 'UI framework', color: '#61dafb' },
      { name: 'TypeScript', description: 'Type safety', color: '#3178c6' },
      { name: 'Tailwind CSS', description: 'Styling', color: '#38bdf8' },
      { name: 'Framer Motion', description: 'Animations', color: '#ff0055' },
      { name: 'Vercel AI SDK', description: 'AI integration', color: '#fff' },
      { name: 'shadcn/ui', description: 'Components (if available)', color: '#fff' },
      { name: 'React Query', description: 'State management', color: '#ff4154' },
    ],
  },
  {
    title: 'Backend Technologies',
    icon: <ServerIcon className="w-6 h-6" />,
    color: '#f97316',
    items: [
      { name: 'Cloudflare Workers', description: 'Serverless functions', color: '#f48120' },
      { name: 'Cloudflare D1', description: 'SQLite database', color: '#f48120' },
      { name: 'PostgreSQL', description: 'Data persistence', color: '#336791' },
      { name: 'Drizzle ORM', description: 'Database abstraction', color: '#c5f74f' },
      { name: 'WebSocket', description: 'Real-time features', color: '#fff' },
      { name: 'Redis', description: 'Caching layer', color: '#dc382d' },
      { name: 'Express.js', description: 'API server', color: '#fff' },
    ],
  },
  {
    title: 'AI & External Services',
    icon: <BrainIcon className="w-6 h-6" />,
    color: '#a855f7',
    items: [
      { name: 'OpenRouter', description: 'Unified AI gateway', color: AIMS_CIRCUIT_COLORS.primary },
      { name: 'Claude Opus/Sonnet', description: 'Primary AI models', color: '#d4a574' },
      { name: 'GPT-4o', description: 'OpenAI models', color: '#10a37f' },
      { name: 'Gemini', description: 'Google AI', color: '#4285f4' },
      { name: 'ElevenLabs', description: 'Voice STT/TTS', color: '#fff' },
      { name: 'Brave Search', description: 'Web search API', color: '#fb542b' },
      { name: 'SAM', description: 'Video/Image analysis', color: '#fff' },
      { name: 'Stripe', description: 'Payment processing', color: '#635bff' },
    ],
  },
  {
    title: 'Infrastructure & Security',
    icon: <ShieldIcon className="w-6 h-6" />,
    color: '#22c55e',
    items: [
      { name: 'Docker', description: 'Containerization', color: '#2496ed' },
      { name: 'Cloudflare', description: 'CDN & deployment', color: '#f48120' },
      { name: 'GitHub Actions', description: 'CI/CD', color: '#fff' },
      { name: 'JWT', description: 'Authentication', color: '#fff' },
      { name: 'Zod', description: 'Input validation', color: '#3068b7' },
      { name: 'CORS', description: 'Security config', color: '#fff' },
      { name: 'Rate Limiting', description: 'API protection', color: '#fff' },
      { name: 'WCAG AA', description: 'Accessibility', color: '#fff' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────────

function TechCard({ item, delay }: { item: TechItem; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.05, duration: 0.3 }}
      className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:scale-105"
      style={{
        backgroundColor: '#1a2234',
        border: '1px solid #2d3a4d',
      }}
    >
      {/* Color indicator */}
      <div
        className="w-2 h-8 rounded-full"
        style={{ backgroundColor: item.color || AIMS_CIRCUIT_COLORS.primary }}
      />

      <div className="flex-1">
        <div className="text-sm font-medium text-white">{item.name}</div>
        <div className="text-xs text-gray-400">{item.description}</div>
      </div>

      {/* Arrow */}
      <svg
        className="w-4 h-4 text-gray-600"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M9 18l6-6-6-6" />
      </svg>
    </motion.div>
  );
}

function CategoryColumn({ category, index }: { category: TechCategory; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex flex-col"
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-4 rounded-t-lg"
        style={{
          backgroundColor: category.color + '20',
          borderTop: `3px solid ${category.color}`,
          borderLeft: `1px solid ${category.color}40`,
          borderRight: `1px solid ${category.color}40`,
        }}
      >
        <div
          className="p-2 rounded-lg"
          style={{ backgroundColor: category.color + '30' }}
        >
          <div style={{ color: category.color }}>{category.icon}</div>
        </div>
        <h3
          className="font-semibold text-sm uppercase tracking-wider"
          style={{ color: category.color }}
        >
          {category.title}
        </h3>
      </div>

      {/* Items */}
      <div
        className="flex-1 p-3 space-y-2 rounded-b-lg"
        style={{
          backgroundColor: '#0f172a',
          borderLeft: `1px solid ${category.color}20`,
          borderRight: `1px solid ${category.color}20`,
          borderBottom: `1px solid ${category.color}20`,
        }}
      >
        {category.items.map((item, i) => (
          <TechCard key={item.name} item={item} delay={index * 8 + i} />
        ))}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function TechStack() {
  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#0a0f1a' }}>
      {/* Background */}
      <CircuitBoardPattern density="sparse" animated={false} glowIntensity={0.1} />

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
            style={{
              backgroundColor: AIMS_CIRCUIT_COLORS.primary + '20',
              border: `1px solid ${AIMS_CIRCUIT_COLORS.primary}40`,
            }}
          >
            <CloudIcon className="w-5 h-5" style={{ color: AIMS_CIRCUIT_COLORS.primary }} />
            <span style={{ color: AIMS_CIRCUIT_COLORS.primary }} className="text-sm font-medium">
              Powered by Modern Technology
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            <span style={{ color: AIMS_CIRCUIT_COLORS.accent }}>A.I.M.S:</span>{' '}
            <span style={{ color: AIMS_CIRCUIT_COLORS.secondary }}>Tech Stack & Infrastructure</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-400 max-w-2xl mx-auto"
          >
            Our sophisticated foundation, powered by modern technology.
          </motion.p>
        </header>

        {/* Tech Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TECH_STACK.map((category, index) => (
            <CategoryColumn key={category.title} category={category} index={index} />
          ))}
        </div>

        {/* Connection Lines (Visual) */}
        <div className="hidden lg:block absolute top-1/2 left-0 right-0 pointer-events-none">
          <svg className="w-full h-20" viewBox="0 0 1200 80" fill="none">
            {/* Connecting arrows between columns */}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill={AIMS_CIRCUIT_COLORS.primary + '60'}
                />
              </marker>
            </defs>
            <path
              d="M 150 40 L 350 40"
              stroke={AIMS_CIRCUIT_COLORS.primary + '40'}
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
            />
            <path
              d="M 450 40 L 650 40"
              stroke={AIMS_CIRCUIT_COLORS.primary + '40'}
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
            />
            <path
              d="M 750 40 L 950 40"
              stroke={AIMS_CIRCUIT_COLORS.primary + '40'}
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
            />
          </svg>
        </div>

        {/* A.I.M.S. Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-16 text-center"
        >
          <div
            className="inline-flex items-center gap-4 px-8 py-4 rounded-2xl"
            style={{
              backgroundColor: '#1a2234',
              border: `1px solid ${AIMS_CIRCUIT_COLORS.primary}40`,
              boxShadow: `0 0 40px ${AIMS_CIRCUIT_COLORS.primary}10`,
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl text-black"
              style={{
                background: `linear-gradient(135deg, ${AIMS_CIRCUIT_COLORS.primary}, ${AIMS_CIRCUIT_COLORS.accent})`,
                boxShadow: `0 0 20px ${AIMS_CIRCUIT_COLORS.glow}`,
              }}
            >
              A
            </div>
            <div className="text-left">
              <div className="text-lg font-bold" style={{ color: AIMS_CIRCUIT_COLORS.secondary }}>
                A.I.M.S. - AI Managed Solutions
              </div>
              <div className="text-sm" style={{ color: AIMS_CIRCUIT_COLORS.primary }}>
                Build Smarter. Deploy Faster. Scale Infinitely.
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
