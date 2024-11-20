/** @type {import('tailwindcss').Config} */

import { sansFontFamily } from "./resources/js/font.js";

export default {
  content: ["./resources/**/*.blade.php", "./resources/js/**/*.vue"],
  darkMode: ["selector"],
  theme: {
    fontFamily: {
      sans: sansFontFamily,
    },
    extend: {},
  },
  plugins: [require("tailwindcss-primeui")],
};
