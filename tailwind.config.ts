import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        neon: {
          pink: "#00d4ff",
          blue: "#6366f1",
          green: "#39ff14",
          purple: "#a855f7",
          yellow: "#f5f740",
        },
        cyber: {
          dark: "#0a0a0f",
          darker: "#050508",
          card: "#12121a",
          border: "#1e1e2e",
          surface: "#1a1a2e",
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', "monospace"],
        display: ['"Orbitron"', "sans-serif"],
        body: ['"Inter"', "sans-serif"],
      },
      animation: {
        "glow-pulse": "glow-pulse 2s ease-in-out infinite alternate",
        "scan-line": "scan-line 8s linear infinite",
        "flicker": "flicker 3s linear infinite",
        "float": "float 6s ease-in-out infinite",
        "data-stream": "data-stream 20s linear infinite",
        "border-glow": "border-glow 2s ease-in-out infinite alternate",
        "typing": "typing 3s steps(30) 1s forwards, blink 0.5s step-end infinite alternate",
        glitch1: "glitch-anim-1 2s infinite linear alternate-reverse",
        glitch2: "glitch-anim-2 2s infinite linear alternate-reverse",
      },
      keyframes: {
        "glow-pulse": {
          "0%": { boxShadow: "0 0 5px #00d4ff, 0 0 10px #00d4ff" },
          "100%": { boxShadow: "0 0 20px #00d4ff, 0 0 40px #00d4ff" },
        },
        "scan-line": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        "flicker": {
          "0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, 100%": { opacity: "1" },
          "20%, 21.999%, 63%, 63.999%, 65%, 69.999%": { opacity: "0.33" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        "data-stream": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        "border-glow": {
          "0%": { borderColor: "#00d4ff" },
          "50%": { borderColor: "#6366f1" },
          "100%": { borderColor: "#39ff14" },
        },
        "typing": {
          "from": { width: "0" },
          "to": { width: "100%" },
        },
        "blink": {
          "50%": { borderColor: "transparent" },
        },
        "glitch-anim-1": {
          "0%": { clipPath: "inset(20% 0 80% 0)", transform: "translate(-3px, 0)" },
          "10%": { clipPath: "inset(60% 0 10% 0)", transform: "translate(3px, 0)" },
          "20%": { clipPath: "inset(30% 0 50% 0)", transform: "translate(-2px, 0)" },
          "30%": { clipPath: "inset(80% 0 5% 0)", transform: "translate(1px, 0)" },
          "40%": { clipPath: "inset(10% 0 70% 0)", transform: "translate(-1px, 0)" },
          "50%": { clipPath: "inset(50% 0 30% 0)", transform: "translate(2px, 0)" },
          "60%": { clipPath: "inset(5% 0 85% 0)", transform: "translate(-3px, 0)" },
          "70%": { clipPath: "inset(70% 0 15% 0)", transform: "translate(3px, 0)" },
          "80%": { clipPath: "inset(40% 0 40% 0)", transform: "translate(-1px, 0)" },
          "90%": { clipPath: "inset(90% 0 2% 0)", transform: "translate(2px, 0)" },
          "100%": { clipPath: "inset(15% 0 65% 0)", transform: "translate(-2px, 0)" },
        },
        "glitch-anim-2": {
          "0%": { clipPath: "inset(80% 0 5% 0)", transform: "translate(3px, 0)" },
          "10%": { clipPath: "inset(30% 0 50% 0)", transform: "translate(-3px, 0)" },
          "20%": { clipPath: "inset(60% 0 10% 0)", transform: "translate(2px, 0)" },
          "30%": { clipPath: "inset(10% 0 70% 0)", transform: "translate(-2px, 0)" },
          "40%": { clipPath: "inset(50% 0 30% 0)", transform: "translate(1px, 0)" },
          "50%": { clipPath: "inset(20% 0 80% 0)", transform: "translate(-1px, 0)" },
          "60%": { clipPath: "inset(70% 0 15% 0)", transform: "translate(3px, 0)" },
          "70%": { clipPath: "inset(5% 0 85% 0)", transform: "translate(-3px, 0)" },
          "80%": { clipPath: "inset(90% 0 2% 0)", transform: "translate(1px, 0)" },
          "90%": { clipPath: "inset(40% 0 40% 0)", transform: "translate(-2px, 0)" },
          "100%": { clipPath: "inset(15% 0 65% 0)", transform: "translate(2px, 0)" },
        },
      },
      backgroundImage: {
        "grid-pattern": "linear-gradient(rgba(0,212,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.05) 1px, transparent 1px)",
        "grid-pattern-lg": "linear-gradient(rgba(0,212,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.08) 1px, transparent 1px)",
      },
      backgroundSize: {
        "grid": "40px 40px",
        "grid-lg": "80px 80px",
      },
    },
  },
  plugins: [],
};

export default config;
