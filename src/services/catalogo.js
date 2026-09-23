import Papa from 'papaparse'
import { NEGOCIO, urlHojaCsv } from '../config/negocio.js'
import { normalizarTexto, parsearBooleano, parsearPrecio, slug } from './formato.js'

/**
 * ============================================================================
 *  SERVICIO DE CATÁLOGO  —  Google Sheets (CSV público) → array de objetos
 * ============================================================================
 *  Flujo:
 *    1. urlHojaCsv() devuelve la URL (CSV publicado o endpoint gviz).
 *    2. Se lee con Papa Parse (header: true) y se normaliza cada fila.
 *    3. Se filtra lo inactivo, se calcula precio final y se ordena.
 *    4. Se cachea en localStorage (TTL configurable) para que la web abra al
 *       instante y no dependa de Google en cada visita.
 *
 *  El caché es "stale-while-revalidate": se devuelve lo guardado y, si venció,
 *  se refresca en segundo plano (ver hooks/useCatalogo.js).
 */

const CLAVE_CACHE = 'catalogo.cache.v1'

// Alias aceptados por columna: el dueño del local puede escribir "nombre" o "titulo".
const ALIAS = {
  id: ['id', 'codigo', 'código', 'sku'],
  titulo: ['titulo', 'título', 'nombre', 'producto', 'articulo', 'artículo'],
  descripcion: ['descripcion', 'descripción', 'detalle', 'desc'],
  precio: ['precio', 'precio_lista', 'precio_lista', 'precio normal', 'valor'],
  precioOferta: ['precio_oferta', 'oferta', 'precio_promo', 'precio_promocional', 'promo'],
  categoria: ['categoria', 'categoría', 'rubro', 'seccion', 'sección', 'categoria '],
  urlImagen: ['url_imagen', 'imagen', 'foto', 'url_foto', 'url'],
  stock: ['stock', 'disponible', 'cantidad'],
  unidad: ['unidad', 'medida', 'presentacion', 'presentación'],
  etiquetas: ['etiquetas', 'tags', 'badges'],
  destacado: ['destacado', 'featured'],
  activo: ['activo', 'visible', 'publicado'],
  orden: ['orden', 'posicion', 'posición'],
}

const buscar = (fila, claves) => {
  for (const k of claves) {
    if (fila[k] !== undefined && String(fila[k]).trim() !== '') return fila[k]
  }
  return ''
}

/** Normaliza los encabezados: minúsculas, sin tildes, espacios → "_" */
function limpiarEncabezado(encabezado) {
  return normalizarTexto(encabezado).replace(/\s+/g, '_')
}

/** Convierte el texto CSV en filas-objeto con encabezados limpios. */
export function parsearCsv(csv) {
  const { data, errors } = Papa.parse(csv.trim(), {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: limpiarEncabezado,
  })
  return { filas: data, erroresParseo: errors }
}

/** Fila cruda de la planilla → producto canónico que consume React. */
export function normalizarProducto(fila, indice = 0) {
  const titulo = String(buscar(fila, ALIAS.titulo)).trim()
  if (!titulo) return null

  const precio = parsearPrecio(buscar(fila, ALIAS.precio))
  const ofertaCruda = buscar(fila, ALIAS.precioOferta)
  const oferta = parsearPrecio(ofertaCruda)
  const hayOferta = oferta > 0 && oferta < precio
  const stockCrudo = String(buscar(fila, ALIAS.stock)).trim()
  const stock = stockCrudo === '' ? -1 : parsearPrecio(stockCrudo) // -1 = sin control de stock

  return {
    id: String(buscar(fila, ALIAS.id) || slug(titulo) || `prod-${indice + 1}`),
    titulo,
    descripcion: String(buscar(fila, ALIAS.descripcion) || '').trim(),
    precio,
    precioOferta: hayOferta ? oferta : null,
    precioFinal: hayOferta ? oferta : precio,
    categoria: String(buscar(fila, ALIAS.categoria) || 'Sin categoría').trim(),
    urlImagen: String(buscar(fila, ALIAS.urlImagen) || '').trim(),
    stock,
    sinStock: stock === 0,
    unidad: String(buscar(fila, ALIAS.unidad) || '').trim(),
    etiquetas: String(buscar(fila, ALIAS.etiquetas) || '')
      .split(/[,;|]/)
      .map((e) => e.trim())
      .filter(Boolean),
    destacado: parsearBooleano(buscar(fila, ALIAS.destacado), false),
    activo: parsearBooleano(buscar(fila, ALIAS.activo), true),
    orden: parsearPrecio(buscar(fila, ALIAS.orden)) || 9999,
  }
}

/** Orden: destacados primero, luego el campo "orden", luego alfabético. */
function ordenar(a, b) {
  if (a.destacado !== b.destacado) return a.destacado ? -1 : 1
  if (a.orden !== b.orden) return a.orden - b.orden
  return a.titulo.localeCompare(b.titulo, NEGOCIO.pedido.locale)
}

/** CSV crudo → { productos, categorias, avisos, totalFilas } */
export function transformarCatalogo(csv) {
  const { filas, erroresParseo } = parsearCsv(csv)
  const avisos = []
  const productos = []

  filas.forEach((fila, i) => {
    // Filas totalmente vacías (Google agrega filas fantasma al final)
    const tieneAlgo = Object.values(fila).some((v) => String(v ?? '').trim() !== '')
    if (!tieneAlgo) return
    const producto = normalizarProducto(fila, i)
    if (!producto) {
      avisos.push(`Fila ${i + 2}: sin título, se ignoró.`)
      return
    }
    if (!producto.precio && !producto.precioOferta) {
      avisos.push(`"${producto.titulo}" no tiene precio válido (fila ${i + 2}).`)
    }
    if (!producto.activo) return
    productos.push(producto)
  })

  productos.sort(ordenar)
  const categorias = [...new Set(productos.map((p) => p.categoria))]
  if (erroresParseo?.length) {
    avisos.push(`${erroresParseo.length} advertencia(s) de formato en el CSV.`)
  }
  return { productos, categorias, avisos, totalFilas: filas.length }
}

/* ------------------------------- Caché ---------------------------------- */

function leerCache() {
  try {
    const crudo = localStorage.getItem(CLAVE_CACHE)
    if (!crudo) return null
    const cache = JSON.parse(crudo)
    if (!cache?.productos?.length) return null
    return cache
  } catch {
    return null
  }
}

function guardarCache(datos) {
  try {
    localStorage.setItem(CLAVE_CACHE, JSON.stringify(datos))
  } catch {
    /* modo incógnito / cuota llena: se ignora, la app sigue funcionando */
  }
}

export function limpiarCache() {
  try {
    localStorage.removeItem(CLAVE_CACHE)
  } catch {
    /* noop */
  }
}

export function cacheVencido(cache, minutos = NEGOCIO.catalogo.refrescoMinutos) {
  if (!cache?.guardadoEn) return true
  return Date.now() - cache.guardadoEn > minutos * 60 * 1000
}

/** Caché disponible sin tocar la red (arranque instantáneo de la UI). */
export function catalogoEnCache() {
  const cache = leerCache()
  return cache ? { ...cache, desdeCache: true } : null
}

/* ------------------------------- Descarga -------------------------------- */

/**
 * Descarga y transforma el catálogo.
 * @param {{forzar?: boolean, señal?: AbortSignal}} opciones
 * @returns {Promise<{productos, categorias, avisos, totalFilas, actualizado, desdeCache, demo}>}
 */
export async function obtenerCatalogo({ forzar = false, señal } = {}) {
  const url = urlHojaCsv()
  if (!url) {
    throw new Error(
      'Falta configurar el Google Sheet en src/config/negocio.js (catalogo.hojaCsv o catalogo.hojaId).',
    )
  }

  const cache = leerCache()
  if (cache && !forzar && !cacheVencido(cache)) {
    return { ...cache, desdeCache: true }
  }

  let respuesta
  try {
    respuesta = await fetch(url, { signal: señal, redirect: 'follow' })
  } catch (error) {
    if (cache) return { ...cache, desdeCache: true, avisoRed: true }
    throw new Error(
      'No pudimos leer el catálogo. Revisá tu conexión e intentá de nuevo. ' +
        `(detalle: ${error.message})`,
    )
  }

  if (!respuesta.ok) {
    if (cache) return { ...cache, desdeCache: true, avisoRed: true }
    throw new Error(
      `El catálogo respondió ${respuesta.status}. Verificá que la hoja esté publicada como CSV.`,
    )
  }

  const texto = await respuesta.text()
  // Si la hoja no es pública, Google devuelve el HTML del login.
  if (/^\s*<(!doctype|html)/i.test(texto)) {
    throw new Error(
      'La hoja no está pública. En Google Sheets: Archivo > Compartir > Publicar en la web > CSV.',
    )
  }

  const datos = transformarCatalogo(texto)
  const guardado = {
    ...datos,
    actualizado: new Date().toISOString(),
    guardadoEn: Date.now(),
    demo: url.includes('productos-demo.csv'),
  }
  guardarCache(guardado)
  return { ...guardado, desdeCache: false }
}
