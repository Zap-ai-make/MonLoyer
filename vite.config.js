import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

// Configuration Vite
export default defineConfig({
  plugins: [react(), tailwindcss()],
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
    minify: 'esbuild',
    cssMinify: 'lightningcss',
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Code splitting optimisé pour réduire le bundle initial
          if (id.includes('node_modules')) {
            // Firebase (authentication, firestore, storage) - ~400KB
            if (id.includes('firebase') || id.includes('@firebase')) {
              return 'firebase'
            }
            // Recharts (graphiques) - ~500KB
            if (id.includes('recharts')) {
              return 'recharts'
            }
            // Google Maps - ~300KB
            if (id.includes('@react-google-maps') || id.includes('googlemaps')) {
              return 'google-maps'
            }
            // jsPDF (génération PDF) - ~200KB
            if (id.includes('jspdf')) {
              return 'jspdf'
            }
            // Zod (validation) - ~50KB
            if (id.includes('zod')) {
              return 'zod'
            }
            // React core (react, react-dom) - SANS react-router pour éviter les duplications
            if (id.includes('react-dom')) {
              return 'react-vendor'
            }
            if (id.includes('react') && !id.includes('react-router') && !id.includes('react-redux')) {
              return 'react-vendor'
            }
            // React Router dans un chunk séparé
            if (id.includes('react-router')) {
              return 'react-router'
            }
            // Autres vendors (lucide-react, etc.)
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
    include: ['react', 'react-dom', 'react-is', 'react-router-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
    exclude: ['@react-google-maps/api'], // Lazy load Google Maps
    esbuildOptions: {
      target: 'es2020'
    }
  },
  define: {
    global: 'globalThis'
  },
  server: {
    host: true,
    port: 5173
  }
})
