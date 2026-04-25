import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // For GitHub Pages: set base to '/jyotish_skyview/' in production build.
  // Local dev uses '/' (the default).
  base: process.env.NODE_ENV === 'production' ? '/vedic_skyview/' : '/',
})
