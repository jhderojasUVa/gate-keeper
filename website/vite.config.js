import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/gate-keeper/',
  build: {
    outDir: 'dist',
  }
})
