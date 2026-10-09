import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const backend = { target: 'http://localhost:3000', changeOrigin: true };

export default defineConfig({
  plugins: [react()],
  root: 'frontend',
  build: {
    outDir: '../dist',
    emptyOutDir: true
  },
  server: {
    port: 5173,
    proxy: {
      '/api': backend,
      '/uploads': backend,
      '/auth': backend
    }
  }
});
