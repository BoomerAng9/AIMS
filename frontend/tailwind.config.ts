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

        // Wireframe system
        wireframe: {
          stroke: 'rgba(255,255,255,0.12)',
          glow: 'rgba(255,255,255,0.04)',
          hover: 'rgba(255,255,255,0.18)',
        },

        // Accents
        gold: {
          DEFAULT: '#D4AF37', // AIMS Gold
          light: '#E8D48A',   // Champagne-ish
          dark: '#B5952F',
          dim: 'rgba(212, 175, 55, 0.1)',
        },
        champagne: '#F6C453',

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
        mono: ['Doto', 'monospace'],        // For code
        marker: ['Permanent Marker', 'cursive'], // For human notes
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
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'pulse-gold': 'pulse_gold 3s ease-in-out infinite',
        'connector-pulse': 'connector_pulse 4s ease-in-out infinite',
        'shelf-slide': 'shelf_slide 0.5s ease-out forwards',
        'head-bob': 'head_bob 4s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
