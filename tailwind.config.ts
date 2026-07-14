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
          50:  "#f0f7f2",
          100: "#dce8df",
          500: "#4A7C59",
          600: "#3d6a4a",
          700: "#31583c",
        },
      },
    },
  },
  plugins: [],
};

export default config;
