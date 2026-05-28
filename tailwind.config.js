/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FAF6EF',
        ink: '#2A2A28',
        'ink-muted': '#6B6359',
        'ink-hint': '#8A8378',
        border: '#E8DFCE',
        'border-light': '#EFE4D3',
        brand: '#C56F45',
        oat: '#E8DCC4',
        olive: '#5A5946',
        leather: '#8B6F47',
        skin: '#F0E2CC',
        dark: '#3D3833',
      },
      fontFamily: {
        sans: ['Pretendard', 'system-ui', 'sans-serif'],
        serif: ['"DM Serif Display"', 'Georgia', 'serif'],
      },
      borderRadius: {
        card: '20px',
        cta: '16px',
        pill: '100px',
      },
    },
  },
  plugins: [],
}
