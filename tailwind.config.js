/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      screens: {
        wide: '1100px',
      },
      fontFamily: {
        display: ['Fredoka', 'Nunito', 'system-ui', 'sans-serif'],
        sans: ['Nunito', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        paper: {
          bg: '#FFFBF2',
          card: '#FFFDF7',
          brown: '#8B5E3C',
          text: '#5C3D2E',
        },
        pastel: {
          blue: '#DCEEF2',
          peach: '#F2D29B',
          lavender: '#E2DCEB',
          olive: '#E8E0A9',
          pink: '#F8D0CC',
          beige: '#F0DED4',
          green: '#BFE3C0',
          greenText: '#2F6B3A',
          red: '#F5B8B0',
          redText: '#9B2C20',
          yellow: '#F7E2A0',
        },
      },
    },
  },
  plugins: [],
};
