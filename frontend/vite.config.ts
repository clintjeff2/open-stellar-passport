import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    // snarkjs / ffjavascript expect a Node-ish global in the browser.
    global: 'globalThis',
  },
  optimizeDeps: {
    // snarkjs ships ESM that Vite's pre-bundler chokes on otherwise.
    exclude: ['snarkjs'],
  },
  build: { target: 'es2022' },
  server: { fs: { allow: ['..'] } },
})
