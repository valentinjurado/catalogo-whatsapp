import Papa from 'papaparse'
import { NEGOCIO, urlHojaCsv } from '../config/negocio.js'
import { normalizarTexto, parsearBooleano, parsearPrecio, slug } from './formato.js'

/**
 * ============================================================================
 *  SERVICIO DE MENÚ  —  Google Sheets (CSV público) → array de objetos
 * ============================================================================
 *  Flujo:
 *    1. urlHojaCsv() devuelve la URL (CSV publicado o endpoint gviz).
 *    2. Se lee con Papa Parse (header: true) y se normaliza cada fila.
 *    3. Se filtra lo inactivo, se calcula el precio final y se ordena.
 *    4. Se guarda en memoria durante la sesión de la página, así navegar por el
 *       menú o reordenar no vuelve a pedirle datos a Google.
 *
 *  PRIVACIDAD: la app NO usa localStorage, cookies ni sessionStorage. Nada del
 *  menú ni del pedido queda guardado en el dispositivo del cliente: si recarga
 *  la página, el carrito arranca vacío y el menú se vuelve a pedir a Google.
 */

// Caché en memoria (se pierde al recargar: no toca el disco del cliente)
let cacheMemoria = null

// Alias aceptados por columna: el dueño puede escribir "nombre" o "titulo".
const ALIAS = {
  id: ['id', 'codigo', 'código', 'sku'],
  titulo: ['titulo', 'título', 'nombre', 'producto', 'articulo', 'artículo'],
  descripcion: ['descripcion', 'descripción', 'detalle', 'desc'],
  ingredientes: ['ingredientes', 'composicion', 'composición', 'info', 'informacion', 'información'],
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

/**
 * Convierte links de Google Drive "de compartir" en links que se pueden usar
 * como <img src>. El dueño sube la foto a Drive, la comparte y pega el link:
 * la app lo arregla sola.
 *   …/file/d/ID/view?usp=sharing   ->  https://drive.google.com/uc?export=view&id=ID
 *   …/open?id=ID                   ->  idem
 *   …/uc?id=ID  o link directo      ->  queda igual
 */
export function normalizarUrlImagen(url) {
  return urlsImagen(url).principal
}

/**
 * Devuelve el link principal y uno alternativo para la misma foto.
 *
 * Dos formas de definir un respaldo:
 *  1. Google Drive: se convierte el link de compartir a link directo y se agrega
 *     el otro formato de Drive como alternativa (según el archivo y la cuenta,
 *     uno puede fallar y el otro no).
 *  2. A mano: en la celda se pueden escribir DOS links separados por "|":
 *     url_imagen = "https://sitio.com/foto.jpg|https://otro.com/foto.jpg"
 *     La web usa el primero y, si falla, prueba el segundo.
 */
export function urlsImagen(url) {
  const original = String(url || '').trim()
  if (!original) return { principal: '', alternativa: null }

  if (original.includes('|')) {
    const [primero, segundo] = original.split('|').map((u) => u.trim())
    const principal = convertirDrive(primero)
    return { principal: principal.principal, alternativa: segundo ? convertirDrive(segundo).principal : principal.alternativa }
  }

  return convertirDrive(original)
}

/** Link de compartir de Drive -> link directo + el formato alternativo. */
function convertirDrive(original) {
  const id = original.match(/\/file\/d\/([a-zA-Z0-9_-]{10,})/)?.[1]
    || original.match(/[?&]id=([a-zA-Z0-9_-]{10,})/)?.[1]
  if (id && /drive\.google\.com|docs\.google\.com/.test(original)) {
    return {
      principal: `https://drive.google.com/uc?export=view&id=${id}`,
      alternativa: `https://lh3.googleusercontent.com/d/${id}=w1200`,
    }
  }
  return { principal: original, alternativa: null }
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
  const imagenes = urlsImagen(buscar(fila, ALIAS.urlImagen))

  return {
    id: String(buscar(fila, ALIAS.id) || slug(titulo) || `prod-${indice + 1}`),
    titulo,
    descripcion: String(buscar(fila, ALIAS.descripcion) || '').trim(),
    // Texto largo para la ficha del producto (ingredientes, composición, etc.)
    ingredientes: String(buscar(fila, ALIAS.ingredientes) || '').trim(),
    precio,
    precioOferta: hayOferta ? oferta : null,
    precioFinal: hayOferta ? oferta : precio,
    categoria: String(buscar(fila, ALIAS.categoria) || 'Sin categoría').trim(),
    urlImagen: imagenes.principal,
    // Segundo link para la misma foto (Drive): la tarjeta lo prueba si el primero falla
    urlImagenAlt: imagenes.alternativa,
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

/** CSV crudo → { productos, categorias, etiquetas, avisos, totalFilas } */
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

  // Las etiquetas se usan como filtros rápidos (Vegetariano, Vegano, Sin TACC…).
  // Se cuentan y se ordenan por frecuencia para que las más usadas queden primero.
  const conteo = new Map()
  productos.forEach((p) =>
    p.etiquetas.forEach((e) => conteo.set(e, (conteo.get(e) || 0) + 1)),
  )
  const etiquetas = [...conteo.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], NEGOCIO.pedido.locale))
    .map(([nombre, cantidad]) => ({ nombre, cantidad }))

  if (erroresParseo?.length) {
    avisos.push(`${erroresParseo.length} advertencia(s) de formato en el CSV.`)
  }
  return { productos, categorias, etiquetas, avisos, totalFilas: filas.length }
}

/* ------------------------------- Caché ---------------------------------- */

export function limpiarCache() {
  cacheMemoria = null
}

export function cacheVencido(cache, minutos = NEGOCIO.catalogo.refrescoMinutos) {
  if (!cache?.guardadoEn) return true
  return Date.now() - cache.guardadoEn > minutos * 60 * 1000
}

/** Menú ya cargado en esta sesión (sin tocar la red ni el disco). */
export function catalogoEnCache() {
  return cacheMemoria ? { ...cacheMemoria, desdeCache: true } : null
}

/* ------------------------------- Descarga -------------------------------- */

/**
 * Descarga y transforma el menú.
 * @param {{forzar?: boolean, señal?: AbortSignal}} opciones
 * @returns {Promise<{productos, categorias, etiquetas, avisos, totalFilas, actualizado, desdeCache, demo}>}
 */
export async function obtenerCatalogo({ forzar = false, señal } = {}) {
  const url = urlHojaCsv()
  if (!url) {
    throw new Error(
      'Falta configurar el Google Sheet en src/config/negocio.js (catalogo.hojaCsv o catalogo.hojaId).',
    )
  }

  if (cacheMemoria && !forzar && !cacheVencido(cacheMemoria)) {
    return { ...cacheMemoria, desdeCache: true }
  }

  let respuesta
  try {
    respuesta = await fetch(url, { signal: señal, redirect: 'follow' })
  } catch (error) {
    if (cacheMemoria) return { ...cacheMemoria, desdeCache: true, avisoRed: true }
    throw new Error(
      'No pudimos leer el menú. Revisá tu conexión e intentá de nuevo. ' +
        `(detalle: ${error.message})`,
    )
  }

  if (!respuesta.ok) {
    if (cacheMemoria) return { ...cacheMemoria, desdeCache: true, avisoRed: true }
    throw new Error(
      `El menú respondió ${respuesta.status}. Verificá que la hoja esté publicada como CSV.`,
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
  cacheMemoria = {
    ...datos,
    actualizado: new Date().toISOString(),
    guardadoEn: Date.now(),
    demo: url.includes('productos-demo.csv'),
  }
  return { ...cacheMemoria, desdeCache: false }
}
