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
        // Legacy tokens — still used by dashboard/admin panels not yet
        // covered by the ValleCañete visual redesign. Do not remove until
        // those panels are restyled too.
        sand: "#f7f0df",
        coral: "#ff7a59",
        ocean: "#083d77",
        ink: "#101828",
        mist: "#eff6ff",
        // ValleCañete redesign palette — nature/tourism green + warm neutrals.
        brand: {
          50: "#f2f8f1",
          100: "#e2f0df",
          200: "#c3dfbc",
          300: "#9cc891",
          400: "#6fac63",
          500: "#438a3d",
          600: "#316e2e",
          700: "#275726",
          800: "#20461f",
          900: "#12290f",
        },
        cream: "#faf8f2",
        stone: "#f4f3ee",
      },
      boxShadow: {
        soft: "0 20px 80px rgba(16, 24, 40, 0.12)",
        card: "0 12px 40px rgba(18, 41, 15, 0.08)",
      },
      backgroundImage: {
        "hero-grid": "radial-gradient(circle at top, rgba(255, 122, 89, 0.18), transparent 35%), linear-gradient(135deg, rgba(247, 240, 223, 0.85), rgba(239, 246, 255, 0.75))",
        "hero-nature": "radial-gradient(circle at top, rgba(67, 138, 61, 0.16), transparent 38%), linear-gradient(135deg, rgba(250, 248, 242, 0.9), rgba(226, 240, 223, 0.65))",
      },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};

export default config;
