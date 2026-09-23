import { NEGOCIO } from '../config/negocio.js'

/** $ 12.500 → "$ 12.500,00" (o "ARS 12.500,00" si la moneda no es la local) */
export function formatearPrecio(valor) {
  const n = Number(valor) || 0
  try {
    return new Intl.NumberFormat(NEGOCIO.pedido.locale, {
      style: 'currency',
      currency: NEGOCIO.pedido.moneda,
      maximumFractionDigits: 2,
    }).format(n)
  } catch {
    return `$ ${n.toFixed(2)}`
  }
}

/**
 * Convierte precios escritos "como los escribe la gente" en la planilla:
 *   "1.500,50" | "$1500" | "1500.50" | "1,500.50" | "" → número
 * Regla: si aparecen coma y punto, el último separador es el decimal.
 */
export function parsearPrecio(valor) {
  if (valor === null || valor === undefined) return 0
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0
  let s = String(valor).trim().replace(/[^\d.,-]/g, '')
  if (!s) return 0
  const ultimaComa = s.lastIndexOf(',')
  const ultimoPunto = s.lastIndexOf('.')
  if (ultimaComa > -1 && ultimoPunto > -1) {
    if (ultimaComa > ultimoPunto) s = s.replace(/\./g, '').replace(',', '.')
    else s = s.replace(/,/g, '')
  } else if (ultimaComa > -1) {
    // "1500,5" decimal vs "1,500" miles
    const decimales = s.length - ultimaComa - 1
    s = decimales === 3 ? s.replace(/,/g, '') : s.replace(',', '.')
  }
  const n = Number.parseFloat(s)
  return Number.isFinite(n) ? n : 0
}

/** "1" | "si" | "TRUE" | "x" → true */
export function parsearBooleano(valor, porDefecto = true) {
  if (valor === null || valor === undefined || String(valor).trim() === '') return porDefecto
  const s = String(valor).trim().toLowerCase()
  return ['1', 'si', 'sí', 'true', 'verdadero', 'x', 'yes', 'y', 'on'].includes(s)
}

/** "coca cola 1.5l" → "coca-cola-1-5l" (sirve para anclas y comparaciones) */
export function slug(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

/** Quita tildes para buscar sin acentos */
export function normalizarTexto(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/** Fecha legible 24h para el mensaje del pedido: "04/10/2026 20:14" */
export function fechaLegible(fecha = new Date()) {
  const dia = new Intl.DateTimeFormat(NEGOCIO.pedido.locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(fecha)
  const hora = new Intl.DateTimeFormat(NEGOCIO.pedido.locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(fecha)
  return `${dia} ${hora}`
}

/** Sólo dígitos y + para el número de WhatsApp */
export function limpiarTelefono(numero) {
  return String(numero || '').replace(/[^\d]/g, '')
}

/** "5492494123456" → "+54 9 249 412 3456" (sólo para mostrar) */
export function telefonoLegible(numero) {
  const d = limpiarTelefono(numero)
  if (d.length < 10) return d
  return `+${d.slice(0, 2)} ${d.slice(2, 3)} ${d.slice(3, 6)} ${d.slice(6, 9)} ${d.slice(9)}`
}
