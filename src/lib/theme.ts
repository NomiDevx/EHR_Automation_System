// src/lib/theme.ts

export const theme = {
  brand: {
    name: "MediSynx EHR",
    tagline: "Smart Records. Better Care.",
  },

  colors: {
    // Primary Brand
    primary: "#0891B2",      // Cyan
    primaryDark: "#0F766E",
    primaryLight: "#22D3EE",

    // Secondary
    secondary: "#4CAF50",    // Green
    secondaryDark: "#2E7D32",
    secondaryLight: "#81C784",

    // Accent
    accent: "#14B8A6",

    // Navy (Logo Text)
    navy: "#0B2A55",

    // Backgrounds
    background: "#F8FAFC",
    surface: "#FFFFFF",

    // Sidebar
    sidebar: "#0B2A55",
    sidebarHover: "#12386D",
    sidebarActive: "#0891B2",

    // Text
    text: {
      primary: "#0F172A",
      secondary: "#475569",
      muted: "#94A3B8",
      white: "#FFFFFF",
    },

    // Borders
    border: "#E2E8F0",
    borderLight: "#F1F5F9",

    // Status
    success: "#16A34A",
    warning: "#F59E0B",
    error: "#DC2626",
    info: "#0284C7",
  },

  gradient: {
    brand:
      "linear-gradient(135deg,#0891B2 0%,#14B8A6 50%,#4CAF50 100%)",

    button:
      "linear-gradient(135deg,#0B2A55 0%,#0891B2 100%)",
  },
} as const;

export type Theme = typeof theme;
