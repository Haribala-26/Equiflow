import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "#172B4D",
        background: "#F6F8FA",
        card: "#FFFFFF",
        teal: "#167D83",
        critical: "#B42318",
        high: "#E04444",
        moderate: "#D99118",
        low: "#23865B",
        textPrimary: "#263445",
        borderDefault: "#DCE2E8",
      },
    },
  },
  plugins: [],
} satisfies Config;
