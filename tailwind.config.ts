import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#EEEFE8",
          100: "#D8DBC9",
          400: "#8A906A",
          500: "#53593D",
          600: "#42472E",
          700: "#323620",
        },
      },
    },
  },
  plugins: [],
};

export default config;
