import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'node:fs';

const dataVersion = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version;

// Сборка фронтенда + PWA. Запросы /api проксируются на локальный wrangler pages dev.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Регистрация — в src/main.tsx (registerSW), чтобы новая версия применялась сразу.
      injectRegister: false,
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'YAi Translator',
        short_name: 'YAi',
        description: 'Переводчик, словарь и учебник немецкого языка',
        lang: 'ru',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#3b6ef6',
        background_color: '#f6f7fb',
        categories: ['education', 'productivity'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        globIgnores: ['word/**', 'app/**'],
        navigateFallback: 'index.html',
        // Запросы к API никогда не подменяем офлайн-страницей.
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        // Новая версия включается сразу, не дожидаясь закрытия всех вкладок сайта.
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            // Шрифт Inter: кэшируем, чтобы интерфейс выглядел одинаково офлайн.
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-css' },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-files',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            // Статическая база слов /lex/<lang>/: кэшируем на клиенте (CacheFirst)
            urlPattern: /\/lex\/.*\.json$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: `lexicon-chunks-${dataVersion}`,
              expiration: { maxEntries: 600, maxAgeSeconds: 60 * 60 * 24 * 60 },
            },
          },
          {
            // Примеры предложений Tatoeba /ex/<lang>/: кэшируем на клиенте
            urlPattern: /\/ex\/.*\.json$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: `examples-chunks-${dataVersion}`,
              expiration: { maxEntries: 600, maxAgeSeconds: 60 * 60 * 24 * 60 },
            },
          },
          {
            // Офлайн-карточки слов /cards/
            urlPattern: /\/cards\/.*\.json$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: `offline-cards-${dataVersion}`,
              expiration: { maxEntries: 600, maxAgeSeconds: 60 * 60 * 24 * 60 },
            },
          },
          {
            // Темы грамматики и ресурсы: доступны офлайн
            urlPattern: /\/api\/(grammar|resources).*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-content',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 14 },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8788',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            if (id.includes('i18next')) {
              return 'vendor-i18n';
            }
            if (id.includes('@capacitor') || id.includes('@capgo')) {
              return 'vendor-capacitor';
            }
          }
        },
      },
    },
  },
});
