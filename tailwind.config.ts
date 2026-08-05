import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        cambria: ["Cambria", "Georgia", "CambriaMath", "serif"],
        display: ["Cambria", "Georgia", "CambriaMath", "serif"],
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      colors: {
        // MediSynx EHR Palette (Cyan / Teal / Green / Navy)
        background: "#F8FAFC",
        foreground: "#0F172A",
        surface: "#FFFFFF",
        "surface-hover": "#F1F5F9",
        border: "#E2E8F0",
        "border-muted": "#F1F5F9",
        muted: "#F1F5F9",
        "muted-foreground": "#475569",
        primary: {
          DEFAULT: "#0891B2",
          dark: "#0F766E",
          light: "#22D3EE",
          foreground: "#FFFFFF",
          50: "#ecfeff",
          100: "#cffaff",
          200: "#a5f3fc",
          300: "#67e8f9",
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
          700: "#0e7490",
          800: "#155e75",
          900: "#164e63",
        },
        secondary: {
          DEFAULT: "#4CAF50",
          dark: "#2E7D32",
          light: "#81C784",
        },
        accent: "#14B8A6",
        navy: "#0B2A55",
        sidebar: "#0B2A55",
        destructive: {
          DEFAULT: "#DC2626",
          foreground: "#FFFFFF",
        },
        critical: "#DC2626",
        warning: "#F59E0B",
        success: "#16A34A",
        info: "#0284C7",
      },
      borderRadius: {
        xs: "6px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        full: "9999px",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideInRight: {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(12px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      boxShadow: {
        glow: "0 0 20px rgba(8, 145, 178, 0.2)",
        "glow-sm": "0 0 10px rgba(8, 145, 178, 0.15)",
        card: "0 8px 25px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};
export default config;
