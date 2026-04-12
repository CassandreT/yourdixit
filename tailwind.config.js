/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base:    '#1a0f2e',
        surface: '#2a1a0e',
        surface2:'#231529',
        accent:  '#f5c842',
        violet:  '#c084fc',
        dim:     '#c4a882',
      },
      fontFamily: {
        display: ['"Cinzel Decorative"', 'serif'],
        body:    ['"Crimson Text"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
