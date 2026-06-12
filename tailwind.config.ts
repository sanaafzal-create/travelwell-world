import type { Config } from "tailwindcss";

/**
 * TravelWell.World — Tailwind theme bound to the design tokens.
 * Colors reference the CSS custom properties defined in src/styles/tokens.css
 * so light/dark band scoping and RTL stay in one source of truth.
 */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: { DEFAULT: "var(--card)", foreground: "var(--card-foreground)" },
        surface: "var(--surface-alt)",
        primary: { DEFAULT: "var(--primary)", hover: "var(--primary-hover)", foreground: "var(--primary-foreground)" },
        secondary: { DEFAULT: "var(--secondary)", foreground: "var(--secondary-foreground)" },
        muted: { DEFAULT: "var(--muted)", foreground: "var(--muted-foreground)" },
        accent: { DEFAULT: "var(--accent)", foreground: "var(--accent-foreground)" },
        "gold-deep": "var(--gold-deep)",
        destructive: { DEFAULT: "var(--destructive)", foreground: "var(--destructive-foreground)" },
        border: "var(--border)",
        ring: "var(--ring)",
        "dark-band": { DEFAULT: "var(--dark-band)", foreground: "var(--dark-band-foreground)", muted: "var(--dark-band-muted)" },
        "safety-1": "var(--safety-1)",
        "safety-2": "var(--safety-2)",
        "safety-3": "var(--safety-3)",
        "safety-4": "var(--safety-4)",
      },
      fontFamily: {
        display: "var(--font-display)",
        sans: "var(--font-sans)",
        ar: "var(--font-ar-sans)",
        "ar-display": "var(--font-ar-display)",
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
        sm: "var(--radius-sm)",
        lg: "var(--radius-lg)",
        pill: "var(--radius-pill)",
      },
      boxShadow: {
        e1: "var(--e1)",
        e2: "var(--e2)",
        e3: "var(--e3)",
      },
      maxWidth: {
        content: "var(--content-max)",
        reading: "var(--reading-max)",
      },
      fontSize: {
        "display-xl": ["var(--t-display-xl)", { lineHeight: "var(--lh-display-xl)", letterSpacing: "-0.01em" }],
        "display-l": ["var(--t-display-l)", { lineHeight: "var(--lh-display-l)" }],
        h2: ["var(--t-h2)", { lineHeight: "var(--lh-h2)" }],
        h3: ["var(--t-h3)", { lineHeight: "var(--lh-h3)" }],
        lead: ["var(--t-lead)", { lineHeight: "var(--lh-lead)" }],
        body: ["var(--t-body)", { lineHeight: "var(--lh-body)" }],
        "body-s": ["var(--t-body-s)", { lineHeight: "var(--lh-body-s)" }],
        micro: ["var(--t-micro)", { lineHeight: "var(--lh-micro)" }],
      },
      screens: {
        // breakpoints from the prototype: 560 / 700 / 760 / 880 / 900 / 920
        xs: "560px",
      },
    },
  },
  plugins: [],
} satisfies Config;
