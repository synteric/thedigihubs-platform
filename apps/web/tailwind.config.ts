import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#2563EB',
          600: '#155EEF',
          700: '#174EA6',
        },
        text: '#10213F',
        muted: '#60708F',
        surface: '#FFFFFF',
        soft: '#F6FAFF',
        line: '#DFE9F7',
      },
      boxShadow: {
        soft: '0 18px 50px rgba(37, 99, 235, 0.10)',
        card: '0 8px 24px rgba(16, 33, 63, 0.06)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};

export default config;
