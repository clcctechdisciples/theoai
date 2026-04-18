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
        blue: {
          50: '#e6f7f5',
          100: '#c2f0e7',
          200: '#8ae2d2',
          300: '#4bccb7',
          400: '#23a893',
          500: '#069c84',
          600: '#047361',
          DEFAULT: '#047361',
        },
        dark: {
          950: '#011410',
          900: '#021c17',
          800: '#03211c',
          700: '#053b32',
          600: '#075246',
          DEFAULT: '#011410',
        },
        cream: '#F5F5F5',
        gold: {
          light: '#ceb382',
          DEFAULT: '#b39b6d',
          dark: '#8b754a',
        },
        forest: {
          light: '#069c84',
          DEFAULT: '#047361',
          dark: '#024b3f'
        }
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
          '0%, 100%': { boxShadow: '0 0 10px rgba(206,179,130,0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(206,179,130,0.7)' },
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
