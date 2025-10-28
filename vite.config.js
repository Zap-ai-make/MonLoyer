import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
// import reorderPreloadsPlugin from './vite-plugin-reorder-preloads.js' // DÉSACTIVÉ - causait des bugs HTML

// Configuration Vite
export default defineConfig({
  plugins: [react(), tailwindcss()], // Plugin reorder désactivé
  base: '/',
  resolve: {
    // Forcer une seule instance de React/react-is/react-dom pour éviter les duplications
    dedupe: ['react', 'react-dom', 'react-is']
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    target: 'es2015',
    sourcemap: false,
    minify: 'esbuild', // Minification activée pour production
    cssMinify: 'lightningcss',
    // Désactiver le tree shaking agressif pour éviter les circular dependencies
    modulePreload: {
      polyfill: false
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Code splitting MINIMAL - ne séparer QUE recharts pour lazy loading
          if (id.includes('node_modules')) {
            // ISOLER recharts - pour lazy loading
            if (id.includes('recharts') || id.includes('react-redux') || id.includes('@reduxjs/toolkit')) {
              return 'recharts-isolated'
            }

            // TOUT LE RESTE ensemble dans vendor (React + Firebase + jsPDF + lucide + zod + etc.)
            // Cela évite les problèmes d'ordre de chargement
            return 'vendor'
          }
        },
        entryFileNames: 'assets/app.[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    },
    chunkSizeWarningLimit: 500,
    reportCompressedSize: false,
    // Optimisations de compression
    terserOptions: {
      compress: {
        drop_console: true, // Supprimer tous les console.* en production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      }
    }
  },
  // Optimiser les dépendances
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-is', 'react-router-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'lucide-react'],
    exclude: ['@react-google-maps/api', 'recharts'], // Lazy load: Google Maps, recharts
    esbuildOptions: {
      target: 'es2020'
    },
    // Force React à être pré-bundlé en premier
    force: true
  },
  define: {
    global: 'globalThis'
  },
  server: {
    host: true,
    port: 5173
  }
})
