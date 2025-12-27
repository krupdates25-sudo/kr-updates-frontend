import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import ogPlugin from './vite-plugin-og.js';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), ogPlugin()],
  server: {
    host: '0.0.0.0', // Allow external connections
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
