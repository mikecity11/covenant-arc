/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#ffffff', 2: '#f5f8ff', 3: '#edf3ff', 4: '#dfe9ff' },
        ivory: { DEFAULT: '#0b1739', dim: '#425574', mute: '#586887' },
        gold: { DEFAULT: '#2457ff', soft: '#1844d9', deep: '#1532a6' },
        mint: { DEFAULT: '#007e71', deep: '#006659' },
        rose: { alert: '#c93652' },
      },
      fontFamily: {
        display: ['"Instrument Sans"', 'ui-sans-serif', 'sans-serif'],
        sans: ['"Instrument Sans"', 'ui-sans-serif', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderColor: { line: 'rgba(30,65,130,0.13)' },
      boxShadow: {
        gold: '0 0 0 1px rgba(36,87,255,0.35), 0 10px 40px -12px rgba(36,87,255,0.25)',
        mint: '0 0 0 1px rgba(0,126,113,0.35), 0 10px 40px -12px rgba(0,126,113,0.2)',
      },
    },
  },
  plugins: [],
}
