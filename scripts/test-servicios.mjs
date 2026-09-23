#!/usr/bin/env node
/**
 * Pruebas de la lógica pura (sin navegador):
 *   node scripts/test-servicios.mjs
 *
 * Verifica parseo de precios, totales, validaciones, numeración de órdenes y el
 * mensaje de WhatsApp. Es la red de seguridad antes de tocar la lógica.
 */
import assert from 'node:assert/strict'
import { formatearPrecio, parsearBooleano, parsearPrecio, slug } from '../src/services/formato.js'
import {
  calcularTotales,
  construirPedido,
  envioGratis,
  generarNumeroOrden,
  validarCheckout,
} from '../src/services/pedido.js'
import { construirMensajePedido, construirUrlWhatsapp } from '../src/services/whatsapp.js'
import { transformarCatalogo, normalizarUrlImagen, urlsImagen } from '../src/services/catalogo.js'
import { NEGOCIO } from '../src/config/negocio.js'

let pruebas = 0
const t = (nombre, fn) => {
  fn()
  pruebas += 1
  console.log(`  ✓ ${nombre}`)
}

console.log('\nformato.js')

t('parsea precios escritos como los escribe la gente', () => {
  assert.equal(parsearPrecio('1.500,50'), 1500.5)
  assert.equal(parsearPrecio('$1500'), 1500)
  assert.equal(parsearPrecio('1500.50'), 1500.5)
  assert.equal(parsearPrecio('1,500.50'), 1500.5)
  assert.equal(parsearPrecio('8500'), 8500)
  assert.equal(parsearPrecio(''), 0)
  assert.equal(parsearPrecio(undefined), 0)
})

t('interpreta booleanos de la planilla', () => {
  assert.equal(parsearBooleano('si'), true)
  assert.equal(parsearBooleano('no'), false)
  assert.equal(parsearBooleano('', true), true)
})

t('genera slugs sin tildes', () => {
  assert.equal(slug('Milanesa Napolitana'), 'milanesa-napolitana')
  assert.equal(slug('Tarta de jamón y queso'), 'tarta-de-jamon-y-queso')
})

console.log('\ncatalogo.js (mismo parser que usa la web)')

t('normaliza filas, respeta mayúsculas/tildes de encabezados y filtra inactivos', () => {
  const csv = [
    'ID,Título,Descripcion,Precio,Precio Oferta,Categoría,Url_Imagen,Stock,Unidad,Etiquetas,Destacado,Activo,Orden',
    'A1,Milanesa,Con guarnición,"8.500,50",7500,Rotisería,http://x/a.jpg,10,porción,"Popular,Oferta",si,si,1',
    'A2,Producto oculto,,1000,,Almacén,,5,,, no,no,2',
    'A3,Coca-Cola 1.5 L,Gaseosa,3500,,Bebidas,,0,1.5 l,,no,si,3',
    ',,,', // fila fantasma de Google
    'A5,,sin título se ignora,900,,Varios,,,,,si,5',
  ].join('\n')

  const { productos, categorias, avisos } = transformarCatalogo(csv)

  assert.equal(productos.length, 2, 'los inactivos, sin título y filas fantasma no se publican')
  assert.equal(productos[0].titulo, 'Milanesa')
  assert.equal(productos[0].categoria, 'Rotisería')
  assert.equal(productos[0].precio, 8500.5)
  assert.equal(productos[0].precioOferta, 7500)
  assert.equal(productos[0].precioFinal, 7500, 'usa el precio de oferta')
  assert.deepEqual(productos[0].etiquetas, ['Popular', 'Oferta'])
  assert.equal(productos[0].destacado, true)
  assert.equal(productos[0].sinStock, false)
  assert.equal(productos.find((p) => p.id === 'A3').sinStock, true, 'stock 0 = agotado')
  const ordenados = productos.map((p) => p.id)
  assert.deepEqual(ordenados, ['A1', 'A3'], 'el destacado va primero y después respeta "orden"')
  assert.deepEqual([...categorias].sort(), ['Bebidas', 'Rotisería'])
  assert.ok(avisos.some((a) => a.includes('sin título')), 'avisa de la fila ignorada')
})

t('una oferta mayor al precio se descarta (no infla el total)', () => {
  const csv = 'titulo,precio,precio_oferta\nProducto,1000,2000'
  const { productos } = transformarCatalogo(csv)
  assert.equal(productos[0].precioOferta, null)
  assert.equal(productos[0].precioFinal, 1000)
})

t('convierte links de Google Drive en links directos de imagen', () => {
  assert.equal(
    normalizarUrlImagen('https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQr/view?usp=sharing'),
    'https://drive.google.com/uc?export=view&id=1AbCdEfGhIjKlMnOpQr',
  )
  assert.equal(
    normalizarUrlImagen('https://drive.google.com/open?id=1AbCdEfGhIjKlMnOpQr'),
    'https://drive.google.com/uc?export=view&id=1AbCdEfGhIjKlMnOpQr',
  )
  assert.equal(
    normalizarUrlImagen('https://miapp.com/fotos/pizza.jpg'),
    'https://miapp.com/fotos/pizza.jpg',
    'un link normal queda igual',
  )
  assert.equal(normalizarUrlImagen(''), '')
})

t('los links de Drive traen un segundo formato de respaldo', () => {
  const drive = urlsImagen('https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQr/view?usp=sharing')
  assert.equal(drive.principal, 'https://drive.google.com/uc?export=view&id=1AbCdEfGhIjKlMnOpQr')
  assert.equal(drive.alternativa, 'https://lh3.googleusercontent.com/d/1AbCdEfGhIjKlMnOpQr=w1200')

  const normal = urlsImagen('https://miapp.com/fotos/pizza.jpg')
  assert.equal(normal.principal, 'https://miapp.com/fotos/pizza.jpg')
  assert.equal(normal.alternativa, null, 'un link directo no necesita respaldo')
})

t('acepta un link de respaldo escrito a mano (separado con |)', () => {
  const par = urlsImagen('https://misitio.com/a.jpg|https://otro.com/b.jpg')
  assert.equal(par.principal, 'https://misitio.com/a.jpg')
  assert.equal(par.alternativa, 'https://otro.com/b.jpg')

  // cada mitad sigue convirtiendo links de Drive por separado
  const mixto = urlsImagen(
    'https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQr/view?usp=sharing|https://otro.com/b.jpg',
  )
  assert.equal(mixto.principal, 'https://drive.google.com/uc?export=view&id=1AbCdEfGhIjKlMnOpQr')
  assert.equal(mixto.alternativa, 'https://otro.com/b.jpg')
})

t('lee ingredientes y arma los filtros rápidos con las etiquetas', () => {
  const csv = [
    'titulo,precio,etiquetas,ingredientes',
    '"Pizza vegana","13.900","Vegano,Vegetariano","Masa, queso vegetal, tomates cherry"',
    'Empanada de carne,7500,Más pedida,"Carne, cebolla, huevo"',
    'Agua,2500,,Agua mineral',
  ].join('\n')
  const { productos, etiquetas } = transformarCatalogo(csv)
  const vegana = productos.find((p) => p.titulo === 'Pizza vegana')

  assert.equal(vegana.ingredientes, 'Masa, queso vegetal, tomates cherry')
  assert.deepEqual(vegana.etiquetas, ['Vegano', 'Vegetariano'])
  assert.deepEqual(
    etiquetas.map((e) => e.nombre),
    ['Más pedida', 'Vegano', 'Vegetariano'],
    'las etiquetas se cuentan y ordenan para los filtros rápidos',
  )
  assert.equal(etiquetas.find((e) => e.nombre === 'Vegano').cantidad, 1)
})

console.log('\npedido.js')

const items = [
  { id: 'A1', titulo: 'Milanesa', precio: 8500, precioOferta: 7500, precioFinal: 7500, cantidad: 3, nota: 'sin cebolla' },
  { id: 'A3', titulo: 'Coca-Cola', precio: 2900, precioOferta: null, precioFinal: 2900, cantidad: 1, nota: '' },
]

t('calcula subtotal, unidades, envío y total', () => {
  const totales = calcularTotales(items, 'envio')
  assert.equal(totales.subtotal, 7500 * 3 + 2900)
  assert.equal(totales.unidades, 4)
  assert.equal(totales.ahorro, 1000 * 3)
  assert.equal(
    totales.envio,
    0,
    `el subtotal (${totales.subtotal}) supera el umbral de envío gratis (${NEGOCIO.entrega.envio.gratisDesde})`,
  )
  assert.equal(totales.total, totales.subtotal)
})

t('cobra el envío cuando no llega al mínimo y no lo cobra en retiro', () => {
  const chico = [{ id: 'X', titulo: 'Pan', precio: 1000, precioFinal: 1000, cantidad: 1 }]
  assert.equal(calcularTotales(chico, 'envio').envio, NEGOCIO.entrega.envio.costo)
  assert.equal(calcularTotales(chico, 'retiro').envio, 0)
})

t('aplica envío gratis desde el umbral configurado', () => {
  const justo = NEGOCIO.entrega.envio.gratisDesde
  assert.equal(envioGratis(justo), true)
  assert.equal(envioGratis(justo - 1), false)
  assert.equal(calcularTotales([{ id: 'Y', precio: justo, precioFinal: justo, cantidad: 1 }], 'envio').envio, 0)
})

t('valida datos obligatorios del checkout', () => {
  const vacio = validarCheckout({ items, entrega: 'envio', pago: 'transferencia', datos: {} })
  assert.equal(vacio.valido, false)
  assert.ok(vacio.errores.nombre && vacio.errores.telefono && vacio.errores.direccion)

  const ok = validarCheckout({
    items,
    entrega: 'envio',
    pago: 'transferencia',
    datos: { nombre: 'Juan Pérez', telefono: '2494123456', direccion: 'Rivadavia 1234' },
  })
  assert.equal(ok.valido, true, JSON.stringify(ok.errores))

  const retiro = validarCheckout({
    items,
    entrega: 'retiro',
    pago: 'efectivo',
    datos: { nombre: 'Juan Pérez', telefono: '2494123456' },
  })
  assert.equal(retiro.valido, true, 'en retiro la dirección no es obligatoria')

  const sinItems = validarCheckout({
    items: [],
    entrega: 'retiro',
    pago: 'efectivo',
    datos: { nombre: 'Juan Pérez', telefono: '2494123456' },
  })
  assert.equal(sinItems.errores.items, 'El carrito está vacío.')
})

t('genera números de orden únicos y con formato legible', () => {
  const numeros = new Set(Array.from({ length: 200 }, () => generarNumeroOrden()))
  assert.equal(numeros.size, 200, 'no debería repetir en 200 intentos')
  for (const n of numeros) assert.match(n, /^PED-\d{6}-[A-Z0-9]{4}$/)
})

console.log('\nwhatsapp.js')

t('el mensaje identifica el pedido por nombre y apellido (sin número)', () => {
  const pedido = construirPedido({
    numeroOrden: 'PED-261004-7K3F', // aunque exista, no se muestra si el local no lo activó
    items,
    entrega: 'envio',
    pago: 'transferencia',
    datos: {
      nombre: 'Juan Pérez',
      telefono: '2494123456',
      direccion: 'Rivadavia 1234, Tandil',
      horario: 'entre 20 y 21',
      aclaraciones: '',
    },
  })
  const mensaje = construirMensajePedido(pedido)

  assert.ok(
    mensaje.startsWith('*NUEVO PEDIDO — Juan Pérez*'),
    `la primera línea debe identificar al cliente, llegó: ${mensaje.split('\n')[0]}`,
  )
  assert.ok(!mensaje.includes('PED-'), 'sin número de pedido a la vista')
  assert.ok(mensaje.includes(`• ${items[0].cantidad} x Milanesa`))
  assert.ok(mensaje.includes('↳ sin cebolla'))
  assert.ok(mensaje.includes('Envío a domicilio'))
  assert.ok(mensaje.includes('Dirección: Rivadavia 1234, Tandil'))
  assert.ok(mensaje.includes('*Pago*'))
  assert.ok(mensaje.includes('Juan Pérez'))
  assert.ok(mensaje.includes('*TOTAL:'))
})

t('el número de pedido se puede activar para un local que lo pida', () => {
  const pedido = construirPedido({
    numeroOrden: 'PED-261004-7K3F',
    items,
    entrega: 'retiro',
    pago: 'efectivo',
    datos: { nombre: 'Ana Gómez', telefono: '2494111222', direccion: '', horario: '', aclaraciones: '' },
  })
  const negocioConNumero = {
    ...NEGOCIO,
    pedido: { ...NEGOCIO.pedido, mostrarNumeroOrden: true },
  }
  const mensaje = construirMensajePedido(pedido, negocioConNumero)
  assert.ok(mensaje.includes('Pedido: PED-261004-7K3F'))
  assert.ok(mensaje.startsWith('*NUEVO PEDIDO — Ana Gómez*'), 'sigue identificando por nombre')
})

t('la web no publica datos bancarios: el mensaje avisa que hay que pasar el alias', () => {
  const pedido = construirPedido({
    numeroOrden: 'PED-261004-TR01',
    items,
    entrega: 'retiro',
    pago: 'transferencia',
    datos: { nombre: 'Juan Pérez', telefono: '2494123456' },
  })
  const mensaje = construirMensajePedido(pedido)

  assert.ok(
    mensaje.includes('pasame el alias'),
    'el mensaje debe pedirle el alias al local cuando el pago es por transferencia',
  )
  assert.ok(!/\b(alias|CBU|CVU):\s*\S+/i.test(mensaje), 'no debe incluir datos bancarios')
  assert.ok(!mensaje.includes('Ya realicé el pago'), 'ya no existe la frase de autoconfirmación de pago')
})

t('en efectivo el mensaje no habla de alias', () => {
  const pedido = construirPedido({
    numeroOrden: 'PED-261004-EF01',
    items,
    entrega: 'retiro',
    pago: 'efectivo',
    datos: { nombre: 'Juan Pérez', telefono: '2494123456' },
  })
  const mensaje = construirMensajePedido(pedido)
  assert.ok(!mensaje.toLowerCase().includes('alias'))
  assert.ok(/Efectivo/i.test(mensaje))
})

t('el link wa.me está bien formado y codificado', () => {
  const pedido = construirPedido({
    numeroOrden: 'PED-261004-AAAA',
    items,
    entrega: 'retiro',
    pago: 'efectivo',
    datos: { nombre: 'Juan Pérez', telefono: '2494123456' },
  })
  const url = construirUrlWhatsapp(construirMensajePedido(pedido))
  assert.match(url, /^https:\/\/wa\.me\/\d+\?text=/)
  assert.ok(!/[\s"]/.test(url), 'no debe quedar ningún espacio ni comilla sin codificar')
  const texto = decodeURIComponent(url.split('?text=')[1])
  assert.ok(texto.startsWith('*NUEVO PEDIDO — Juan Pérez*'), 'identifica por nombre y apellido')
  assert.ok(!texto.includes('PED-'), 'sin número de pedido cuando el local no lo pidió')
  assert.ok(texto.includes('Retiro en el local'))
  assert.ok(/Efectivo al recibir el pedido\./.test(texto))
  assert.ok(!texto.toLowerCase().includes('alias'), 'en efectivo no se habla de alias')
  assert.ok(!/CBU|CVU/i.test(texto))
})

t('formatea el total en pesos argentinos', () => {
  const texto = formatearPrecio(19900)
  assert.ok(/19\.900/.test(texto), `esperaba 19.900 en "${texto}"`)
})

t('arma el link wa.me con el número en formato internacional', () => {
  const url = construirUrlWhatsapp('hola', '5492494684061')
  assert.equal(url, 'https://wa.me/5492494684061?text=hola')
  // con espacios, guiones o + los limpia igual
  assert.equal(construirUrlWhatsapp('hola', '+54 9 249 468-4061'), 'https://wa.me/5492494684061?text=hola')
})

console.log(`\n✓ ${pruebas} pruebas de servicios OK\n`)
