/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        genesis: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc5fb',
          400: '#36a9f7',
          500: '#0c8ee8',
          600: '#0270c5',
          700: '#0459a0',
          800: '#0a4b85',
          900: '#0d406e',
          950: '#082847',
        },
        spiritual: {
          50: '#fdf8f1',
          100: '#f9edd9',
          200: '#f2d8b0',
          300: '#eabb7d',
          400: '#e39647',
          500: '#dd7a25',
          600: '#c65d1b',
          700: '#a54518',
          800: '#86371a',
          900: '#6f2f18',
          950: '#3d1609',
        }
      },
      fontFamily: {
        sans: ['Inter var', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'flow': '0 0 0 1px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.05)',
        'flow-hover': '0 0 0 1px rgba(0, 0, 0, 0.05), 0 4px 8px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
};