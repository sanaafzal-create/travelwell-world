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
    // change. Auto-updates so travelers always get the latest. (When SSG lands,
    // revisit navigateFallback so per-route static HTML isn't shadowed.)
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
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        navigateFallback: "/index.html",
        // Never cache Supabase (DB / auth / the image + Atlas edge functions) —
        // the trip, catalog, and sign-in must always be live.
        runtimeCaching: [
          { urlPattern: ({ url }) => url.hostname.endsWith("supabase.co"), handler: "NetworkOnly" },
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
