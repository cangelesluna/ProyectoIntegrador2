import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef9ff',
          100: '#d8f0ff',
          200: '#b0e0ff',
          300: '#79c9ff',
          400: '#32a8ff',
          500: '#0e7beb',
          600: '#0c66d0',
          700: '#0e52a8',
          800: '#14417f',
          900: '#16315c'
        }
      },
      boxShadow: {
        soft: '0 20px 50px rgba(15, 23, 42, 0.08)'
      }
    }
  },
  plugins: [],
} satisfies Config;
