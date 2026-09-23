#!/usr/bin/env node
/**
 * Validador del CSV del menú (uso interno antes de publicar la planilla).
 *
 *   node scripts/validar-catalogo.mjs docs/mi-menu.csv
 *   node scripts/validar-catalogo.mjs https://docs.google.com/.../pub?output=csv
 *
 * Usa EXACTAMENTE el mismo parser que la web (src/services/catalogo.js), así
 * que si acá pasa, en el navegador también. Sale con código 1 si hay errores.
 */
import { readFile } from 'node:fs/promises'
import { normalizarUrlImagen, transformarCatalogo } from '../src/services/catalogo.js'

const origen = process.argv[2]
if (!origen) {
  console.error('Uso: node scripts/validar-catalogo.mjs <archivo.csv | url>')
  process.exit(2)
}

const esUrl = /^https?:\/\//i.test(origen)
const texto = esUrl
  ? await (async () => {
      const r = await fetch(origen)
      if (!r.ok) throw new Error(`La URL respondió ${r.status}`)
      return r.text()
    })()
  : await readFile(origen, 'utf8')

if (/^\s*<(!doctype|html)/i.test(texto)) {
  console.error('✗ La respuesta es HTML, no CSV: la hoja no está publicada como CSV.')
  process.exit(1)
}

const { productos, categorias, etiquetas, avisos, totalFilas } = transformarCatalogo(texto)

console.log(`Filas leídas:      ${totalFilas}`)
console.log(`Productos activos: ${productos.length}`)
console.log(`Categorías:        ${categorias.join(' | ') || '(ninguna)'}`)
console.log(`Filtros rápidos:   ${etiquetas.map((e) => `${e.nombre} (${e.cantidad})`).join(' | ') || '(ninguna etiqueta)'}`)

const sinPrecio = productos.filter((p) => !p.precio && !p.precioOferta)
const sinImagen = productos.filter((p) => !p.urlImagen)
const sinStock = productos.filter((p) => p.sinStock)
const sinIngredientes = productos.filter((p) => !p.ingredientes)
const conDetalle = productos.filter((p) => p.ingredientes || p.descripcion)
const duplicados = Object.entries(
  productos.reduce((acc, p) => ({ ...acc, [p.id]: (acc[p.id] || 0) + 1 }), {}),
).filter(([, n]) => n > 1)

console.log(`\nSin precio:        ${sinPrecio.length}`)
console.log(`Sin imagen:        ${sinImagen.length}`)
console.log(`Sin stock:         ${sinStock.length}`)
console.log(`Sin ingredientes:  ${sinIngredientes.length} (la ficha mostrará menos info)`)
console.log(`Con ficha:         ${conDetalle.length}`)
console.log(`IDs repetidos:     ${duplicados.length}`)

if (avisos.length) {
  console.log('\nAvisos del parser:')
  avisos.forEach((a) => console.log(`  - ${a}`))
}
if (sinPrecio.length) {
  console.log('\nProductos sin precio válido:')
  sinPrecio.forEach((p) => console.log(`  - ${p.titulo}`))
}
if (duplicados.length) {
  console.log('\nOjo: dos filas comparten el mismo id (el pedido las mezclaría):')
  duplicados.forEach(([id, n]) => console.log(`  - ${id} (x${n})`))
}

// Links de Google Drive: se avisa cómo quedan después de la conversión automática
const drive = productos.filter((p) => /drive\.google\.com|docs\.google\.com/.test(p.urlImagen))
if (drive.length) {
  console.log('\nFotos en Google Drive (la web las convierte sola a link directo):')
  drive.forEach((p) => console.log(`  - ${p.titulo} -> ${p.urlImagen}`))
}

const sospechosas = productos.filter(
  (p) => p.urlImagen && !/^https?:\/\//i.test(p.urlImagen),
)
if (sospechosas.length) {
  console.log('\nURLs de imagen que no son http(s) (revisar):')
  sospechosas.forEach((p) => console.log(`  - ${p.titulo}: ${p.urlImagen}`))
}

const errores = sinPrecio.length + duplicados.length + sospechosas.length
if (errores) {
  console.log(`\n✗ ${errores} problema(s) a corregir antes de publicar.`)
  process.exit(1)
}
console.log('\n✓ Menú válido.')
if (normalizarUrlImagen('https://drive.google.com/file/d/ABC123456789/view?usp=sharing') !==
  'https://drive.google.com/uc?export=view&id=ABC123456789') {
  console.log('⚠ La conversión de links de Drive cambió: revisar normalizarUrlImagen()')
}
