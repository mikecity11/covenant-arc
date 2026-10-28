import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [react(), nodePolyfills()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    // Only crawl this app's entry. The nested covenant-arc/ git checkout has its own index.html,
    // and scanning it would trigger dependency re-optimisation and full page reloads.
    entries: ['index.html'],
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
      '@tanstack/react-query',
      'wagmi',
      'wagmi/chains',
      'wagmi/connectors',
      'viem',
      'viem/chains',
      'connectkit',
      'framer-motion',
      'lucide-react',
      'sonner',
      'clsx',
      'tailwind-merge',
      'vite-plugin-node-polyfills/shims/buffer',
      'vite-plugin-node-polyfills/shims/global',
      'vite-plugin-node-polyfills/shims/process',
    ],
  },
  server: {
    allowedHosts: true,
    cors: true,
    // Never let the preview proxy or browser reuse a stale module (a stale index.css once rendered the starter theme).
    headers: { 'Cache-Control': 'no-store' },
    watch: {
      // Do not react to edits inside the nested git checkout (its own tsconfig/index.html).
      ignored: ['**/covenant-arc/**', '**/contracts/out/**', '**/contracts/cache/**'],
    },
  },
})
