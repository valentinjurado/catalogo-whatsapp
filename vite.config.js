import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base './' => los assets quedan con rutas relativas y el build funciona igual
// en Vercel, Netlify o en una subcarpeta de GitHub Pages (usuario.github.io/repo/).
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
  },
})
