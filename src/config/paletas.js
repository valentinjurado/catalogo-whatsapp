/**
 * Paletas de color predefinidas (white-label).
 * El negocio elige una en config/negocio.js -> marca.tema
 * Los valores se inyectan como variables CSS (--brand-*) en tiempo de ejecución,
 * por lo que NO hace falta recompilar Tailwind para re-marcar la plantilla.
 */
export const PALETAS = {
  verde: {
    nombre: 'Verde WhatsApp',
    50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7', 400: '#34d399',
    500: '#10b981', 600: '#059669', 700: '#047857', 800: '#065f46', 900: '#064e3b',
    950: '#022c22', metaColor: '#059669',
  },
  azul: {
    nombre: 'Azul confianza',
    50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa',
    500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a',
    950: '#172554', metaColor: '#2563eb',
  },
  bordo: {
    nombre: 'Bordo / Rojo',
    50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5', 400: '#f87171',
    500: '#ef4444', 600: '#dc2626', 700: '#b91c1c', 800: '#991b1b', 900: '#7f1d1d',
    950: '#450a0a', metaColor: '#dc2626',
  },
  naranja: {
    nombre: 'Naranja cálido',
    50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74', 400: '#fb923c',
    500: '#f97316', 600: '#ea580c', 700: '#c2410c', 800: '#9a3412', 900: '#7c2d12',
    950: '#431407', metaColor: '#ea580c',
  },
  violeta: {
    nombre: 'Violeta',
    50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd', 400: '#a78bfa',
    500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9', 800: '#5b21b6', 900: '#4c1d95',
    950: '#2e1065', metaColor: '#7c3aed',
  },
  grafito: {
    nombre: 'Grafito elegante',
    50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8',
    500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a',
    950: '#020617', metaColor: '#334155',
  },
}

/** Aplica la paleta como variables CSS en <html>. */
export function aplicarPaleta(clave = 'verde', radio = 16) {
  const paleta = PALETAS[clave] || PALETAS.verde
  const raiz = document.documentElement
  for (const [paso, valor] of Object.entries(paleta)) {
    if (paso === 'nombre' || paso === 'metaColor') continue
    raiz.style.setProperty(`--brand-${paso}`, valor)
  }
  raiz.style.setProperty('--radio', `${radio}px`)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', paleta.metaColor)
  return paleta
}
