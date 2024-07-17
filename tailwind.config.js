/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './resources/**/*.blade.php',
    './resources/js/**/*.vue'
  ],
  darkMode: ['selector'],
  theme: {
    extend: {}
  },
  plugins: [require('tailwindcss-primeui')]
};
