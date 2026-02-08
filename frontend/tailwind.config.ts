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
        leather: '#1A1A1A',
        gunmetal: '#2A2A2A',
        
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
      },
      boxShadow: {
        'glass': '0 4px 30px rgba(0, 0, 0, 0.1)',
        'neon-gold': '0 0 20px rgba(212, 175, 55, 0.3)',
        'neon-blue': '0 0 20px rgba(59, 130, 246, 0.3)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulse_gold: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 10px rgba(212, 175, 55, 0.2)' },
          '50%': { opacity: '0.8', boxShadow: '0 0 25px rgba(212, 175, 55, 0.5)' },
        }
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'pulse-gold': 'pulse_gold 3s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
