import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // PWA: "add to home screen" → one-tap way back into the saved trip, already
    // signed in (the session persists on-device). Icons are placeholders in
    // public/icon-*.png — swap for the real mark (same filenames), no config
    // change. Auto-updates so travelers always get the latest. (The "revisit
    // navigateFallback when SSG lands" debt this note used to carry is paid —
    // see the workbox block below for what it cost while unpaid.)
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["apple-touch-icon.png"],
      manifest: {
        name: "TravelWell.World",
        short_name: "TravelWell",
        description: "A Travel Operating System — from a feeling to a beautifully organized trip.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        theme_color: "#244a3c",
        background_color: "#ebede6",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Precache the app shell and hashed assets ONLY — never `**/*.html`.
        // The old glob swept all 647 prerendered pages into every visitor's
        // precache (megabytes re-downloaded per deploy), and `navigateFallback`
        // answered every navigation from that cache — so a returning visitor
        // never saw the server again: prerendered heads were shadowed by the
        // shell (the debt the note below this config carried since SSG landed),
        // an unknown path got the cached shell instead of the real 404, and a
        // deploy mid-session could strand a page whose hashed CSS no longer
        // existed anywhere — David hit exactly that on 2026-09-09: a fully
        // unstyled 404, raw text and invisible buttons, on the live site.
        globPatterns: ["assets/**/*.{js,css,woff2}", "index.html", "*.{ico,svg}", "icon-*.png", "apple-touch-icon.png"],
        // Navigations go NETWORK-FIRST: online, the server's answer is the
        // answer (real prerendered page, real 404 status). The precached shell
        // is the OFFLINE fallback only — which keeps the emergency panel's
        // no-network guarantee: the app boots from the bundle and the panel
        // renders with zero requests.
        navigateFallback: null,
        runtimeCaching: [
          // Never cache Supabase (DB / auth / the image + Atlas edge functions) —
          // the trip, catalog, and sign-in must always be live.
          { urlPattern: ({ url }) => url.hostname.endsWith("supabase.co"), handler: "NetworkOnly" },
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "pages",
              // A dead connection should feel like offline, not like a hang.
              networkTimeoutSeconds: 4,
              precacheFallback: { fallbackURL: "/index.html" },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
