/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Light Surfaces
        obsidian: '#F8FAFC',
        surface: '#FFFFFF',
        'surface-raised': '#F1F5F9',
        charcoal: '#F8FAFC',
        leather: '#F1F5F9',
        gunmetal: '#E2E8F0',
        ink: '#F8FAFC',

        // Warm Loft Palette — updated for light theme
        loft: {
          bg: '#F8FAFC',
          floor: '#F1F5F9',
          brick: '#D97706',
          leather: '#B45309',
          tan: '#F59E0B',
          cream: '#0F172A',
          wall: '#F1F5F9',
        },

        // Border system — light
        wireframe: {
          stroke: '#E2E8F0',
          glow: '#F1F5F9',
          hover: '#CBD5E1',
        },

        // Accent — modernized amber/gold
        gold: {
          DEFAULT: '#D97706',
          light: '#F59E0B',
          dark: '#B45309',
          dim: 'rgba(217, 119, 6, 0.08)',
        },
        champagne: '#F59E0B',

        // Status signals
        signal: {
          green: '#16A34A',
          amber: '#D97706',
          red: '#DC2626',
          blue: '#2563EB',
          cyan: '#0891B2',
        },

        // Circuit Box status — adjusted for light bg
        'cb-cyan': '#0891B2',
        'cb-green': '#16A34A',
        'cb-amber': '#D97706',
        'cb-red': '#DC2626',
        'cb-fog': '#94A3B8',

        // Text
        'frosty-white': '#0F172A',
        muted: '#64748B',
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
        'glass-shine': 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.6) 50%, transparent 70%)',
        'subtle-grid': 'linear-gradient(to right, #F1F5F9 1px, transparent 1px), linear-gradient(to bottom, #F1F5F9 1px, transparent 1px)',
        'dot-matrix': 'radial-gradient(circle, rgba(0,0,0,0.05) 1px, transparent 1px)',
        'grid-fine': 'linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px)',
      },
      backgroundSize: {
        'dot-matrix': '24px 24px',
        'grid-fine': '48px 48px',
      },
      boxShadow: {
        'glass': '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'neon-gold': '0 4px 14px rgba(217, 119, 6, 0.15)',
        'neon-blue': '0 4px 14px rgba(37, 99, 235, 0.15)',
        'glow-gold': '0 4px 14px rgba(217, 119, 6, 0.1)',
        'glow-gold-soft': '0 2px 8px rgba(217, 119, 6, 0.06)',
        'wireframe-inner': '0 1px 2px rgba(0,0,0,0.04)',
        'card-lift': '0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
        'glow-controlled': '0 2px 8px rgba(217, 119, 6, 0.04)',
        'card-sm': '0 1px 2px rgba(0,0,0,0.04)',
        'card-md': '0 2px 8px rgba(0,0,0,0.06)',
        'card-lg': '0 8px 24px rgba(0,0,0,0.08)',
        'card-xl': '0 16px 48px rgba(0,0,0,0.1)',
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
          '0%, 100%': { opacity: '1', boxShadow: '0 0 6px rgba(217,119,6,0.1)' },
          '50%': { opacity: '0.85', boxShadow: '0 0 16px rgba(217,119,6,0.2)' },
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
