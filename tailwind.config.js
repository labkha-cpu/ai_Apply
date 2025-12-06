/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,jsx,js}'],
  theme: {
    extend: {
      colors: {
        indigo: {
          950: '#0b0c2c'
        }
      },
      boxShadow: {
        soft: '0 15px 40px rgba(15,23,42,0.12)'
      }
    },
  },
  plugins: [],
};
