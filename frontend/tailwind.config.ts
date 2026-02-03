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
      }
    },
  },
  plugins: [],
}
