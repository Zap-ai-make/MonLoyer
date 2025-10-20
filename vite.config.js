import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

// Configuration Vite
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    target: 'es2015',
    sourcemap: false,
    minify: 'esbuild',
    cssMinify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Séparer les dépendances vendor des modules applicatifs
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        },
        entryFileNames: 'assets/app.[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    },
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: false
  },
  define: {
    global: 'globalThis'
  },
  server: {
    host: true,
    port: 5173
  }
})
