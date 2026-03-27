/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base:    '#060C1A',
          app:     '#0C1428',
          surface: '#111827',
          card:    '#1B2845',
          raised:  '#243356',
        },
        amber: {
          DEFAULT: '#F59E0B',
          dark:    '#D97706',
          glow:    'rgba(245,158,11,0.15)',
        },
        speak:  '#27AE60',
        clear:  '#E11D48',
        sky:    '#4FC3F7',
        fitz: {
          pronoun: '#FCD34D',
          verb:    '#86EFAC',
          social:  '#A5B4FC',
          noun:    '#FDBA74',
        },
      },
      fontFamily: {
        display: ['"Baloo 2"', 'cursive'],
        body:    ['Nunito', 'sans-serif'],
      },
      borderRadius: {
        sm:   '8px',
        md:   '12px',
        lg:   '16px',
        xl:   '20px',
        full: '100px',
      },
      keyframes: {
        tokenPop: {
          from: { transform: 'scale(0.65)', opacity: '0' },
          to:   { transform: 'scale(1)',    opacity: '1' },
        },
        speakPulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(39,174,96,0.2)' },
          '50%':      { boxShadow: '0 0 0 10px transparent' },
        },
        sheetUp: {
          from: { transform: 'translateY(100%)' },
          to:   { transform: 'translateY(0)' },
        },
      },
      animation: {
        'token-pop': 'tokenPop 150ms ease-out both',
        'speak-pulse': 'speakPulse 1.2s ease-in-out infinite',
        'sheet-up': 'sheetUp 220ms ease-out both',
      },
    },
  },
  plugins: [],
};
