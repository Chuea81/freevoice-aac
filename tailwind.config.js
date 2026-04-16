/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base:    '#F2F5F2',
          app:     '#FAFBFA',
          surface: '#F0F3F0',
          card:    '#FFFFFF',
          raised:  '#E4EBE4',
        },
        amber: {
          DEFAULT: '#43A047',
          dark:    '#2E7D32',
          glow:    'rgba(67,160,71,0.10)',
        },
        speak:  '#43A047',
        clear:  '#E53935',
        sky:    '#2196F3',
        fitz: {
          pronoun: '#F9A825',
          verb:    '#2E7D32',
          social:  '#5C6BC0',
          noun:    '#E65100',
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
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(67,160,71,0.2)' },
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
