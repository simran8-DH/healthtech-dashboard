import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Project site: https://simran8-DH.github.io/healthtech-dashboard/
const base = process.env.VITE_BASE || '/healthtech-dashboard/';

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
