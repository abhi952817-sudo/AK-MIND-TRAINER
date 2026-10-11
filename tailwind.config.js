/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ludoRed: '#E63946',
        ludoGreen: '#2A9D8F',
        ludoYellow: '#F4A261',
        ludoBlue: '#457B9D',
        bgDark: '#1A1A2E',
        surfaceDark: '#16213E',
        bgLight: '#F8F9FA',
        surfaceLight: '#FFFFFF',
      },
    },
  },
  plugins: [],
};
