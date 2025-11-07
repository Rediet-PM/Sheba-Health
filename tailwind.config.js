/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1D9A94',
          dark: '#14736E',
          light: '#5FCAC4',
        },
      },
    },
  },
  plugins: [],
}

