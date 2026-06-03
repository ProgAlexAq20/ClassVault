import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: "/ClassVault/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/classvault.svg", "icons/apple-touch-icon.svg"],
      manifest: {
        name: "ClassVault",
        short_name: "ClassVault",
        description: "Organize. Estude. Conquiste.",
        lang: "pt-BR",
        theme_color: "#0f1720",
        background_color: "#0f1720",
        display: "standalone",
        orientation: "portrait-primary",
        start_url: "/ClassVault/",
        scope: "/ClassVault/",
        icons: [
          {
            src: "/ClassVault/icons/classvault.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any"
          },
          {
            src: "/ClassVault/icons/apple-touch-icon.svg",
            sizes: "180x180",
            type: "image/svg+xml",
            purpose: "any maskable"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,json}"],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === "document",
            handler: "NetworkFirst",
            options: {
              cacheName: "classvault-pages",
              networkTimeoutSeconds: 3
            }
          },
          {
            urlPattern: ({ request }) => ["script", "style", "font", "image"].includes(request.destination),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "classvault-assets"
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/firebase") || id.includes("node_modules/@firebase")) return "firebase";
          if (id.includes("node_modules")) return "vendor";
        }
      }
    }
  }
});
