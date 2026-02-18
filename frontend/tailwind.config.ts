/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces
        obsidian: '#0A0A0A',
        surface: '#111111',
        'surface-raised': '#161616',
        charcoal: '#111111',
        leather: '#1A1A1A',
        gunmetal: '#2A2A2A',
        ink: '#0B0E14',

        // Wireframe border system
        wireframe: {
          stroke: 'rgba(255,255,255,0.10)',
          glow: 'rgba(255,255,255,0.04)',
          hover: 'rgba(255,255,255,0.20)',
        },

        // Gold accent — A.I.M.S. brand
        gold: {
          DEFAULT: '#D4AF37',
          light: '#E8D48A',
          dark: '#B5952F',
          dim: 'rgba(212, 175, 55, 0.1)',
        },
        champagne: '#F6C453',

        // Status signals
        signal: {
          green: '#22C55E',
          amber: '#F59E0B',
          red: '#EF4444',
          blue: '#3B82F6',
          cyan: '#22D3EE',
        },

        // Circuit Box status
        'cb-cyan': '#22D3EE',
        'cb-green': '#22C55E',
        'cb-amber': '#F59E0B',
        'cb-red': '#EF4444',
        'cb-fog': '#6B7280',

        // Text
        'frosty-white': '#EDEDED',
        muted: '#A1A1AA',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-doto)', 'Doto', 'monospace'],
        doto: ['var(--font-doto)', 'Doto', 'monospace'],
        mono: ['var(--font-doto)', 'Doto', 'monospace'],
        marker: ['var(--font-marker)', 'Permanent Marker', 'cursive'],
        handwriting: ['var(--font-caveat)', 'Caveat', 'cursive'],
      },
      borderRadius: {
        'card': '20px',
        'card-lg': '28px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-shine': 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.04) 50%, transparent 70%)',
        'subtle-grid': 'linear-gradient(to right, #1a1a1a 1px, transparent 1px), linear-gradient(to bottom, #1a1a1a 1px, transparent 1px)',
        'dot-matrix': 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
        'grid-fine': 'linear-gradient(to right, rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.025) 1px, transparent 1px)',
      },
      backgroundSize: {
        'dot-matrix': '24px 24px',
        'grid-fine': '48px 48px',
      },
      boxShadow: {
        'glass': '0 4px 30px rgba(0, 0, 0, 0.1)',
        'neon-gold': '0 0 20px rgba(212, 175, 55, 0.3)',
        'neon-blue': '0 0 20px rgba(59, 130, 246, 0.3)',
        'glow-gold': '0 0 24px rgba(212, 175, 55, 0.15)',
        'glow-gold-soft': '0 0 40px rgba(212, 175, 55, 0.08)',
        'wireframe-inner': 'inset 0 1px 1px rgba(255,255,255,0.06), inset 0 -1px 1px rgba(255,255,255,0.02)',
        'card-lift': '0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)',
        'glow-controlled': '0 0 40px rgba(212, 175, 55, 0.06)',
      },
      spacing: {
        'cb-xs': '8px',
        'cb-sm': '16px',
        'cb-md': '24px',
        'cb-lg': '32px',
        'cb-xl': '40px',
        'cb-chip': '28px',
        'cb-row': '44px',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulse_gold: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 10px rgba(212,175,55,0.15)' },
          '50%': { opacity: '0.85', boxShadow: '0 0 24px rgba(212,175,55,0.35)' },
        },
        connector_pulse: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.6' },
        },
        shelf_slide: {
          '0%': { opacity: '0', transform: 'translateX(60px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        cb_breathe: {
          '0%, 100%': { opacity: '0.4', boxShadow: '0 0 4px currentColor' },
          '50%': { opacity: '0.8', boxShadow: '0 0 12px currentColor' },
        },
        cb_scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(300%)' },
        },
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'fade-in': 'fade-in 0.5s ease-out forwards',
        'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
        'pulse-gold': 'pulse_gold 3s ease-in-out infinite',
        'connector-pulse': 'connector_pulse 4s ease-in-out infinite',
        'shelf-slide': 'shelf_slide 0.5s ease-out forwards',
        'cb-breathe': 'cb_breathe 3s ease-in-out infinite',
        'cb-scan': 'cb_scanline 2.5s linear infinite',
      },
    },
  },
  plugins: [],
}
