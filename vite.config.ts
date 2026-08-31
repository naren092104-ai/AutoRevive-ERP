import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: path.resolve(__dirname, 'frontend'),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'frontend'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
    cors: true,
    allowedHosts: true,
    hmr: process.env.DISABLE_HMR !== 'true',
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    cors: true,
    allowedHosts: true,
  },
});
