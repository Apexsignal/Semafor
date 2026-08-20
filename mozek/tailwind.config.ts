import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ApexSignal brand tokens (apexsignal.cz :root custom properties):
        // --bg:#08090b --surface:#111214 --line:#232427 --ink:#f4f4f2
        // --muted:#8b8d92 --accent:#2ee6c6 (their error red is #ff8080,
        // reused here for "bad"/IMMEDIATE since it already carries that
        // meaning on their own site). good/warn stay generic status hues —
        // status colors are reserved and shouldn't chase brand identity.
        mozek: {
          bg: "#08090b",
          panel: "#111214",
          border: "#232427",
          accent: "#2ee6c6",
          accent2: "#5eb1ff",
          text: "#f4f4f2",
          muted: "#8b8d92",
          good: "#34d399",
          warn: "#fbbf24",
          bad: "#ff8080",
        },
      },
    },
  },
  plugins: [],
};

export default config;
