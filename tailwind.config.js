/** @type {import('tailwindcss').Config} */
// Brand tokens mirror tokens.css from the design bundle:
//   #1f6f43 primary (matches web emerald-700), #f5f0eb cream surface,
//   Playfair Display serif + Inter sans. Use the named utilities
//   (bg-cream, text-ink, font-serif, font-display-italic) rather than
//   reaching for raw Tailwind palette tokens — keeps every screen one
//   refactor away from a brand-wide colour change.
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1f6f43",
          press: "#175534",
          soft: "#e3efe7",
          ink: "#134a2d",
        },
        accent: {
          DEFAULT: "#b9842c",
          soft: "#f5ead4",
        },
        cream: {
          DEFAULT: "#f5f0eb",
          2: "#ece6df",
          3: "#ddd5c9",
        },
        ink: {
          DEFAULT: "#1a2120",
          2: "#4d524f",
          3: "#7f857f",
        },
        line: {
          DEFAULT: "#e1dcd3",
          2: "#ece6df",
        },
      },
      fontFamily: {
        // Default sans / weights — call font-bold via the family, not the
        // weight utility, because React Native won't synthesize weights
        // from a single-weight TTF.
        sans: ["Inter_400Regular"],
        "sans-medium": ["Inter_500Medium"],
        "sans-semibold": ["Inter_600SemiBold"],
        "sans-bold": ["Inter_700Bold"],

        // Serif display — Playfair, used for headlines and prices.
        serif: ["PlayfairDisplay_400Regular"],
        "serif-italic": ["PlayfairDisplay_400Regular_Italic"],
        "serif-semibold": ["PlayfairDisplay_600SemiBold"],
      },
    },
  },
  plugins: [],
};
