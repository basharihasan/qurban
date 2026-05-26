import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },

  build: {
    // Target modern browsers (better tree shaking, smaller output)
    target: 'es2020',

    // Raise chunk size warning limit (recharts + xlsx are legitimately large)
    chunkSizeWarningLimit: 600,

    // Source maps for production debugging (optional — disable to save size)
    sourcemap: false,

    // Rollup options for advanced code splitting
    rollupOptions: {
      output: {
        /**
         * Manual chunk splitting strategy:
         * - vendor: React ecosystem (rarely changes → long cache)
         * - charts: Recharts (large, only needed on admin dashboard)
         * - xlsx: SheetJS (large, only needed for import/export)
         * - qrcode: QR libs (only needed on panitia pages)
         * - ui: Heroicons + toast (shared across all pages)
         */
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // React core — smallest, most cached
            if (id.includes('react-dom') || id.includes('react/') || id.includes('react-router')) {
              return 'vendor-react';
            }
            // Charts — only loaded on admin dashboard
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'vendor-charts';
            }
            // Excel — only loaded on import/export
            if (id.includes('xlsx')) {
              return 'vendor-xlsx';
            }
            // QR scanner — only loaded on panitia QR page
            if (id.includes('html5-qrcode') || id.includes('qrcode')) {
              return 'vendor-qr';
            }
            // PDF generation
            if (id.includes('jspdf') || id.includes('html2canvas')) {
              return 'vendor-pdf';
            }
            // State management + data fetching (shared everywhere)
            if (id.includes('zustand') || id.includes('@tanstack')) {
              return 'vendor-state';
            }
            // Socket.IO
            if (id.includes('socket.io-client') || id.includes('engine.io')) {
              return 'vendor-socket';
            }
            // UI utilities
            if (id.includes('@heroicons') || id.includes('react-hot-toast') || id.includes('react-dropzone') || id.includes('date-fns')) {
              return 'vendor-ui';
            }
            // Axios + networking
            if (id.includes('axios')) {
              return 'vendor-network';
            }
            // Everything else in node_modules → shared vendor chunk
            return 'vendor-misc';
          }
        },
      },
    },
  },

  // Development server settings
  server: {
    port: 5173,
    host: true, // Allow LAN access for mobile testing
    proxy: {
      // Proxy API calls to backend in dev (avoid CORS)
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },

  // Preview server (after build)
  preview: {
    port: 4173,
    host: true,
  },
});
