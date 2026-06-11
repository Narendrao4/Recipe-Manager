/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#1B3A2D',
          light: '#2D5A45',
          dark: '#0F1F1A',
        },
        cream: {
          DEFAULT: '#F5EDD6',
          light: '#FFFEF9',
          dark: '#E8DCC0',
        },
        terracotta: {
          DEFAULT: '#C4622D',
          light: '#D47842',
          dark: '#A54E1F',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      },
    },
  },
  plugins: [],
}
