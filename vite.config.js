import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import ogPlugin from './vite-plugin-og.js';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), ogPlugin()],
  build: {
    minify: 'esbuild',
    // Console.logs are disabled via disableConsole.js utility
    // esbuild will also remove them during minification
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', 'framer-motion'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    host: true, // Allow external connections
    port: 5173,
    strictPort: false,
    allowedHosts: [
      'localhost',
      '.ngrok-free.app',
      '.ngrok.io',
      '.ngrok.app',
      '6bcbcd211145.ngrok-free.app', // Your specific ngrok domain
    ],
    hmr: {
      // Only use custom port if explicitly set via env variable
      clientPort: process.env.VITE_HMR_PORT ? parseInt(process.env.VITE_HMR_PORT) : undefined,
      // Handle WebSocket errors gracefully
      overlay: {
        warnings: false,
        errors: true,
      },
    },
    // Handle WebSocket connection errors
    ws: {
      // Only use custom port if explicitly set
      port: process.env.VITE_WS_PORT ? parseInt(process.env.VITE_WS_PORT) : undefined,
    },
  },
});
