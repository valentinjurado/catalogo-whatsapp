import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { NEGOCIO } from './src/config/negocio.js'

/**
 * Inyecta los datos del negocio en el HTML en tiempo de build.
 * Así el <title>, la descripción para buscadores y el mensaje de <noscript>
 * salen ya escritos desde el servidor, con una sola fuente de verdad
 * (src/config/negocio.js): no hay que tocar el HTML a mano ni duplicar datos.
 */
function datosDelNegocioEnElHtml() {
  const reemplazos = {
    '%NEGOCIO%': NEGOCIO.marca.nombre,
    '%ESLOGAN%': NEGOCIO.marca.eslogan,
    '%DESCRIPCION%': NEGOCIO.marca.descripcion,
    '%WHATSAPP%': NEGOCIO.whatsapp.numero,
    '%WHATSAPP_LINK%': `https://wa.me/${NEGOCIO.whatsapp.numero}`,
  }
  return {
    name: 'datos-negocio-html',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) =>
        Object.entries(reemplazos).reduce(
          (acumulado, [clave, valor]) => acumulado.replaceAll(clave, valor),
          html,
        ),
    },
  }
}

// base './' => los assets quedan con rutas relativas y el build funciona igual
// en Vercel, Netlify o en una subcarpeta de GitHub Pages (usuario.github.io/repo/).
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), datosDelNegocioEnElHtml()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
  },
})
