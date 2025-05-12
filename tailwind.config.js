/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        antique: {
          50: '#fdf8f0',
          100: '#f7f0e3',
          200: '#ede4c7',
          300: '#dfd3a3',
          400: '#d0c17d',
          500: '#c4b563',
          600: '#b8a855',
          700: '#9a8e47',
          800: '#7e753c',
          900: '#665f32',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      borderRadius: {
        'elegant': '0.75rem',
      },
      boxShadow: {
        'elegant': '0 10px 25px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.1)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
    },
  },
  plugins: [],
}