import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // cacheDir fuera del proyecto para evitar EACCES en rutas con espacios
  cacheDir: '/tmp/vite-wod-codex',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@store': path.resolve(__dirname, './src/store'),
      '@styles': path.resolve(__dirname, './src/styles'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // En desarrollo, proxea las llamadas a /api al backend FastAPI
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Chunking manual para mejor caching
        manualChunks: {
          react:  ['react', 'react-dom'],
          router: ['react-router-dom'],
          state:  ['zustand'],
        },
      },
    },
  },
})
