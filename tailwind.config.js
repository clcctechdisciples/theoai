/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#E8EFE7',
          100: '#D1DFCF',
          200: '#A4BF9F',
          300: '#779F6F',
          400: '#4A7F3F',
          500: '#2D5A27',
          600: '#244920',
          700: '#1A3316',
          DEFAULT: '#2D5A27',
        },
        cream: {
          50: '#FDFCFB',
          100: '#FBF9F6',
          200: '#F5F0E8',
          300: '#EBE2D0',
          400: '#DCCEB8',
          500: '#CDBAA0',
          DEFAULT: '#F5F0E8',
        },
        gold: {
          light: '#E8C86A',
          DEFAULT: '#C9A84C',
          dark: '#A6883B',
        },
        dark: {
          950: '#0A0F0A',
          900: '#0F1A0E',
          800: '#162214',
          DEFAULT: '#0F1A0E',
        },
      },
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        inter: ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-in-out',
        'fade-out': 'fadeOut 0.6s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        fadeOut: { '0%': { opacity: '1' }, '100%': { opacity: '0' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(201,168,76,0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(201,168,76,0.7)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
