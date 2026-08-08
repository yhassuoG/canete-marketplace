import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sand: "#f7f0df",
        coral: "#ff7a59",
        ocean: "#083d77",
        ink: "#101828",
        mist: "#eff6ff",
      },
      boxShadow: {
        soft: "0 20px 80px rgba(16, 24, 40, 0.12)",
      },
      backgroundImage: {
        "hero-grid": "radial-gradient(circle at top, rgba(255, 122, 89, 0.18), transparent 35%), linear-gradient(135deg, rgba(247, 240, 223, 0.85), rgba(239, 246, 255, 0.75))",
      },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};

export default config;
