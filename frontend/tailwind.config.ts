/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Dark Surfaces
        obsidian: '#09090B',
        surface: '#111113',
        'surface-raised': '#18181B',
        'surface-elevated': '#1F1F23',
        charcoal: '#111113',
        leather: '#18181B',
        gunmetal: '#27272A',
        ink: '#09090B',

        // Warm Loft Palette — dark theme
        loft: {
          bg: '#09090B',
          floor: '#111113',
          brick: '#F59E0B',
          leather: '#D97706',
          tan: '#FBBF24',
          cream: '#FAFAFA',
          wall: '#18181B',
        },

        // Border system — dark
        wireframe: {
          stroke: 'rgba(255, 255, 255, 0.08)',
          glow: 'rgba(255, 255, 255, 0.04)',
          hover: 'rgba(255, 255, 255, 0.15)',
        },

        // Accent — amber/gold optimized for dark
        gold: {
          DEFAULT: '#F59E0B',
          light: '#FBBF24',
          dark: '#D97706',
          dim: 'rgba(245, 158, 11, 0.08)',
        },
        champagne: '#FBBF24',

        // Status signals — brighter for dark bg
        signal: {
          green: '#22C55E',
          amber: '#F59E0B',
          red: '#EF4444',
          blue: '#3B82F6',
          cyan: '#06B6D4',
        },

        // Circuit Box status — dark bg
        'cb-cyan': '#06B6D4',
        'cb-green': '#22C55E',
        'cb-amber': '#F59E0B',
        'cb-red': '#EF4444',
        'cb-fog': '#71717A',

        // Text
        'frosty-white': '#FAFAFA',
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
        'card': '16px',
        'card-lg': '20px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-shine': 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.06) 50%, transparent 70%)',
        'subtle-grid': 'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
        'dot-matrix': 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
        'grid-fine': 'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
      },
      backgroundSize: {
        'dot-matrix': '24px 24px',
        'grid-fine': '48px 48px',
      },
      boxShadow: {
        'glass': '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)',
        'neon-gold': '0 4px 14px rgba(245, 158, 11, 0.2)',
        'neon-blue': '0 4px 14px rgba(59, 130, 246, 0.2)',
        'glow-gold': '0 4px 14px rgba(245, 158, 11, 0.15)',
        'glow-gold-soft': '0 2px 8px rgba(245, 158, 11, 0.08)',
        'wireframe-inner': '0 1px 2px rgba(0,0,0,0.3)',
        'card-lift': '0 4px 16px rgba(0,0,0,0.4), 0 1px 4px rgba(0,0,0,0.3)',
        'glow-controlled': '0 2px 8px rgba(245, 158, 11, 0.06)',
        'card-sm': '0 1px 2px rgba(0,0,0,0.3)',
        'card-md': '0 2px 8px rgba(0,0,0,0.4)',
        'card-lg': '0 8px 24px rgba(0,0,0,0.5)',
        'card-xl': '0 16px 48px rgba(0,0,0,0.6)',
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
          '0%, 100%': { opacity: '1', boxShadow: '0 0 6px rgba(245,158,11,0.1)' },
          '50%': { opacity: '0.85', boxShadow: '0 0 16px rgba(245,158,11,0.25)' },
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
        gradient_shift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glow_rotate: {
          to: { '--glow-angle': '360deg' },
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
        'gradient-shift': 'gradient_shift 8s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'glow-rotate': 'glow_rotate 4s linear infinite',
      },
    },
  },
  plugins: [],
}
