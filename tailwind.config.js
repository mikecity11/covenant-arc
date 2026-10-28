/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#0a0e17', 2: '#0f1522', 3: '#151c2c', 4: '#1c2438' },
        ivory: { DEFAULT: '#f3ecdd', dim: '#c4bdad', mute: '#9aa3b5' },
        gold: { DEFAULT: '#c9a55c', soft: '#e3cb92', deep: '#8f7436' },
        mint: { DEFAULT: '#6fe3b5', deep: '#3fb98a' },
        rose: { alert: '#f08a8a' },
      },
      fontFamily: {
        display: ['Newsreader', 'Georgia', 'serif'],
        sans: ['"Instrument Sans"', 'ui-sans-serif', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderColor: { line: 'rgba(243,236,221,0.12)' },
      boxShadow: {
        gold: '0 0 0 1px rgba(201,165,92,0.35), 0 10px 40px -12px rgba(201,165,92,0.25)',
        mint: '0 0 0 1px rgba(111,227,181,0.35), 0 10px 40px -12px rgba(111,227,181,0.2)',
      },
    },
  },
  plugins: [],
}
