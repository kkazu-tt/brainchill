/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // BrainChill Design System
        base: "#1A1D21",        // Background (deep charcoal)
        surface: "#24282D",     // Card background
        sauna: {
          DEFAULT: "#FF8C42",   // Primary accent (sauna orange)
          soft: "#FFA76A",
        },
        teal: {
          DEFAULT: "#2AB7CA",   // Secondary accent (calm blue-green)
          soft: "#5FCDDC",
        },
        text: {
          primary: "#FFFFFF",
          secondary: "#A6ADB4",
          muted: "#6B7178",
        },
        border: "#2F343A",
      },
      borderRadius: {
        card: "20px",
        pill: "999px",
      },
    },
  },
  plugins: [],
};
