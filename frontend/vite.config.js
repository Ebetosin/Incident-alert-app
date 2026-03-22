import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const defineGlobals = {
  global: 'globalThis'
}

export default defineConfig({
  plugins: [react()],
  define: defineGlobals,
  optimizeDeps: {
    esbuildOptions: {
      define: defineGlobals
    }
  },
  server: {
    port: 5180,
    proxy: {
      '/api': 'http://localhost:8090',
      '/ws': 'http://localhost:8090'
    }
  }
})
