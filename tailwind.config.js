/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base:    '#ffffff',
        surface: '#f5f0e8',
        surface2:'#f0eaf5',
        accent:  '#d4a017',
        violet:  '#7c3aed',
        dim:     '#4a3728',
      },
      fontFamily: {
        display: ['"Cinzel Decorative"', 'serif'],
        body:    ['"Crimson Text"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
