/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        snapdragon: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48', // Primary Qualcomm/Snapdragon Red
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
          glow: 'rgba(225, 29, 72, 0.4)',
        },
        edge: {
          dark: '#080b11',
          surface: '#0f1420',
          card: 'rgba(17, 24, 39, 0.75)',
          border: 'rgba(255, 255, 255, 0.08)',
          cyan: '#00f0ff',
          amber: '#f59e0b',
          emerald: '#10b981',
          violet: '#8b5cf6'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glow 2.5s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 10px rgba(225, 29, 72, 0.2)' },
          '100%': { boxShadow: '0 0 25px rgba(225, 29, 72, 0.5)' },
        }
      }
    },
  },
  plugins: [],
}
