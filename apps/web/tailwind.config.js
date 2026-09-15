/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        yaqin: {
          bg: '#0B0D12',
          surface: '#151923',
          border: '#222838',
          text: '#FFFFFF',
          muted: '#9AA4B8',
          primary: '#FF4F79',
          coral: '#FF4F79',
          rose: '#FF4F79',
          secondary: '#6D3B63',
          plum: '#6D3B63',
          gold: '#D9A441',
          accent: '#FF4F79',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 10px 30px rgba(0, 0, 0, 0.04)',
        'card': '0 12px 36px rgba(255, 75, 110, 0.08)',
        'floating': '0 8px 24px rgba(0, 0, 0, 0.08)',
        'coral': '0 8px 25px rgba(255, 75, 110, 0.35)',
      },
      borderRadius: {
        '3xl': '24px',
        '4xl': '28px',
      },
    },
  },
  plugins: [],
};
