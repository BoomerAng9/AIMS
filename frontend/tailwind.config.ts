/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        obsidian: '#0A0A0A',
        leather: '#1A1A1A',
        'frosty-white': '#F5F5F5',
        champagne: '#F6C453',
        gold: {
          DEFAULT: '#D4AF37',
          light: '#E8D48A'
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        display: ['var(--font-doto)', 'monospace'],
        marker: ['var(--font-marker)', 'cursive'],
        handwriting: ['var(--font-caveat)', 'cursive'],
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        }
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
