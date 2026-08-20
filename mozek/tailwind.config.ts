import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mozek: {
          bg: "#0b0d12",
          panel: "#12151c",
          border: "#232733",
          accent: "#7c5cff",
          accent2: "#22d3ee",
          text: "#e6e8ee",
          muted: "#8b90a0",
          good: "#34d399",
          warn: "#fbbf24",
          bad: "#f87171",
        },
      },
    },
  },
  plugins: [],
};

export default config;
