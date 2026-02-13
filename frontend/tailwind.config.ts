/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Base
        black: '#000000',
        obsidian: '#0A0A0A',
        charcoal: '#111111',
        leather: '#1A1A1A',
        gunmetal: '#2A2A2A',

        // Circuit Box — Ink (main background)
        ink: '#0B0E14',

        // Wireframe system
        wireframe: {
          stroke: 'rgba(255,255,255,0.12)',
          glow: 'rgba(255,255,255,0.04)',
          hover: 'rgba(255,255,255,0.18)',
        },

        // Accents
        gold: {
          DEFAULT: '#D4AF37', // AIMS Gold — owner authority
          light: '#E8D48A',   // Champagne-ish
          dark: '#B5952F',
          dim: 'rgba(212, 175, 55, 0.1)',
        },
        champagne: '#F6C453',

        // Circuit Box — Status signals
        'cb-cyan': '#22D3EE',    // Electric Cyan — live/streaming/routing
        'cb-green': '#22C55E',   // Signal Green — healthy/connected/on
        'cb-amber': '#F59E0B',   // Amber — warning/degraded/needs attention
        'cb-red': '#EF4444',     // Red — blocked/offline/kill-switch
        'cb-fog': '#6B7280',     // Fog — secondary text/dividers

        // Signals
        signal: {
          green: '#10B981',
          red: '#EF4444',
          blue: '#3B82F6',
        },

        // Text
        'frosty-white': '#EDEDED',
        muted: '#A1A1AA',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Doto', 'monospace'],     // For headers/data
        doto: ['Doto', 'monospace'],        // Alias for explicit Doto usage
        mono: ['Doto', 'monospace'],        // For code
        marker: ['Permanent Marker', 'cursive'], // A.I.M.S. wordmark
        handwriting: ['Caveat', 'cursive'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-shine': 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.05) 50%, transparent 70%)',
        'subtle-grid': 'linear-gradient(to right, #1a1a1a 1px, transparent 1px), linear-gradient(to bottom, #1a1a1a 1px, transparent 1px)',
        'dot-matrix': 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
        'grid-fine': 'linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)',
      },
      backgroundSize: {
        'dot-matrix': '24px 24px',
        'grid-fine': '48px 48px',
      },
      boxShadow: {
        'glass': '0 4px 30px rgba(0, 0, 0, 0.1)',
        'neon-gold': '0 0 20px rgba(212, 175, 55, 0.3)',
        'neon-blue': '0 0 20px rgba(59, 130, 246, 0.3)',
        'wireframe-inner': 'inset 0 1px 1px rgba(255,255,255,0.06), inset 0 -1px 1px rgba(255,255,255,0.02)',
        'card-lift': '0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)',
        'glow-controlled': '0 0 40px rgba(212, 175, 55, 0.06)',
      },
      // Circuit Box spacing (8px base grid)
      spacing: {
        'cb-xs': '8px',
        'cb-sm': '16px',
        'cb-md': '24px',
        'cb-lg': '32px',
        'cb-xl': '40px',
        'cb-chip': '28px',    // Status chip height
        'cb-row': '44px',     // Control row height
      },
      // Circuit Box transition timing
      transitionDuration: {
        'cb-toggle': '150ms',   // Toggle interactions
        'cb-panel': '200ms',    // Panel expand/collapse
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulse_gold: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 10px rgba(212, 175, 55, 0.2)' },
          '50%': { opacity: '0.8', boxShadow: '0 0 25px rgba(212, 175, 55, 0.5)' },
        },
        connector_pulse: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.6' },
        },
        shelf_slide: {
          '0%': { opacity: '0', transform: 'translateX(60px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        head_bob: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-2px)' },
        },
        // Circuit Box micro-motion
        cb_breathe: {
          '0%, 100%': { opacity: '0.4', boxShadow: '0 0 4px currentColor' },
          '50%': { opacity: '0.8', boxShadow: '0 0 12px currentColor' },
        },
        cb_scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(300%)' },
        },
        cb_route_pulse: {
          '0%': { strokeDashoffset: '100' },
          '100%': { strokeDashoffset: '0' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'pulse-gold': 'pulse_gold 3s ease-in-out infinite',
        'connector-pulse': 'connector_pulse 4s ease-in-out infinite',
        'shelf-slide': 'shelf_slide 0.5s ease-out forwards',
        'head-bob': 'head_bob 4s ease-in-out infinite',
        'cb-breathe': 'cb_breathe 3s ease-in-out infinite',
        'cb-scan': 'cb_scanline 2.5s linear infinite',
        'cb-route': 'cb_route_pulse 1.5s ease-out forwards',
      }
    },
  },
  plugins: [],
}
