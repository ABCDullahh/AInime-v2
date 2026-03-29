import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 3232,
    proxy: {
      '/api-proxy/anilist': {
        target: 'https://graphql.anilist.co',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-proxy\/anilist/, ''),
        secure: false,
      },
      '/img-proxy/anilist': {
        target: 'https://s4.anilist.co',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/img-proxy\/anilist/, ''),
        secure: false,
      },
      '/img-proxy/mal': {
        target: 'https://cdn.myanimelist.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/img-proxy\/mal/, ''),
        secure: false,
      },
      '/img-proxy/mal-main': {
        target: 'https://myanimelist.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/img-proxy\/mal-main/, ''),
        secure: false,
      },
      '/img-proxy/youtube': {
        target: 'https://img.youtube.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/img-proxy\/youtube/, ''),
        secure: false,
      },
      '/img-proxy/dailymotion': {
        target: 'https://www.dailymotion.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/img-proxy\/dailymotion/, ''),
        secure: false,
      },
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "favicon.ico", "logo.png", "pwa-icon.svg", "pwa-maskable.svg"],
      manifest: {
        name: "AInime - Smart Anime Discovery",
        short_name: "AInime",
        description: "Discover anime with AI-powered search and recommendations. Your personal anime companion.",
        theme_color: "#1a1f2e",
        background_color: "#1a1f2e",
        display: "standalone",
        orientation: "portrait-primary",
        scope: "/",
        start_url: "/",
        categories: ["entertainment", "lifestyle"],
        icons: [
          {
            src: "favicon.png",
            sizes: "64x64",
            type: "image/png",
          },
          {
            src: "pwa-icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "pwa-maskable.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "maskable",
          },
        ],
        screenshots: [
          {
            src: "logo.png",
            sizes: "800x418",
            type: "image/png",
            form_factor: "wide",
            label: "AInime Homepage",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.jikan\.moe\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "jikan-api-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/graphql\.anilist\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "anilist-api-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/cdn\.myanimelist\.net\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "mal-images-cache",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/s4\.anilist\.co\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "anilist-images-cache",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
