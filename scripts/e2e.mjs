#!/usr/bin/env node
/**
 * E2E del flujo de compra completo, por CDP directo (sin dependencias).
 *
 *   npm run e2e                        (usa http://localhost:4173)
 *   node scripts/e2e.mjs http://localhost:5173
 *
 * Verifica de punta a punta:
 *   catálogo -> búsqueda -> filtros -> carrito -> checkout (datos, validación,
 *   transferencia) -> link de WhatsApp con el mensaje codificado -> pantalla de
 *   éxito -> persistencia en localStorage.
 *
 * Deja el informe en docs/e2e-resultado.json y sale con código 1 si algo falla.
 * Requiere un navegador con puerto de depuración (ver scripts/cdp.mjs).
 */
import { writeFile } from 'node:fs/promises'
import {
  abrirNavegador,
  esperar,
  scriptClickTexto,
  scriptForzarPintado,
  scriptLlenarCampo,
  scriptTexto,
} from './cdp.mjs'

const URL_BASE = process.argv[2] || 'http://localhost:4173/'
const informe = { url: URL_BASE, fecha: new Date().toISOString(), checks: {}, datos: {} }
const fallos = []

function comprobar(nombre, condicion, detalle = '') {
  informe.checks[nombre] = { ok: Boolean(condicion), detalle }
  if (!condicion) fallos.push(`${nombre}${detalle ? ` — ${detalle}` : ''}`)
  console.log(`${condicion ? 'OK  ' : 'FALLA'} ${nombre}${detalle ? ` · ${detalle}` : ''}`)
}

const nav = await abrirNavegador({ url: URL_BASE, ancho: 1440, alto: 900 })

try {
  const { evaluar } = nav

  /* ------------------------- 0. punto de partida ------------------------- */
  // El carrito se persiste en localStorage: se limpia y se recarga para que la
  // prueba sea repetible (idempotente) sin importar corridas anteriores.
  await evaluar("localStorage.removeItem('carrito.v1'); true")
  await nav.enviar('Page.navigate', { url: URL_BASE })
  await nav.esperarSelector("document.querySelectorAll('article').length > 0")
  comprobar('carrito arranca vacío', (await evaluar("JSON.parse(localStorage.getItem('carrito.v1')).items.length")) === 0)

  /* ----------------------------- 1. catálogo ----------------------------- */
  informe.datos.tarjetas = await evaluar("document.querySelectorAll('article').length")
  comprobar('catálogo renderiza productos', informe.datos.tarjetas >= 10, `${informe.datos.tarjetas} tarjetas`)
  comprobar('modo demostración avisado', await evaluar("document.body.innerText.includes('Modo demostraci\\u00f3n')"))
  comprobar(
    'producto agotado bloqueado',
    (await evaluar("document.querySelectorAll('article button:disabled').length")) >= 1 &&
      (await evaluar("[...document.querySelectorAll('article button:disabled')].every(b => /agotado/i.test(b.textContent))")),
    'botón deshabilitado',
  )
  comprobar('ofertas con precio tachado', (await evaluar("document.querySelectorAll('article .line-through').length")) > 0)

  await evaluar(scriptForzarPintado)
  await esperar(6000)
  informe.datos.imagenes = await evaluar(
    "(() => { const im=[...document.querySelectorAll('article img')]; return im.filter(i=>i.naturalWidth>0 && getComputedStyle(i).opacity==='1').length + '/' + im.length; })()",
  )
  comprobar('imágenes de producto cargadas', informe.datos.imagenes.split('/')[0] === informe.datos.imagenes.split('/')[1], informe.datos.imagenes)

  /* ------------------------- 2. búsqueda y filtros ----------------------- */
  await evaluar(scriptLlenarCampo('input[type=search]', 'empanada'))
  await esperar(600)
  informe.datos.busqueda = await evaluar("document.querySelectorAll('article').length")
  comprobar('el buscador filtra', informe.datos.busqueda > 0 && informe.datos.busqueda < informe.datos.tarjetas, `${informe.datos.busqueda} resultados`)

  await evaluar(scriptLlenarCampo('input[type=search]', ''))
  await esperar(500)
  await evaluar(`[...document.querySelectorAll('button[aria-pressed]')].find(b => b.textContent.includes('Panader\\u00eda')).click()`)
  await esperar(600)
  informe.datos.porCategoria = await evaluar("document.querySelectorAll('article').length")
  comprobar('el filtro por categoría funciona', informe.datos.porCategoria > 0 && informe.datos.porCategoria < informe.datos.tarjetas, `${informe.datos.porCategoria} en Panadería`)
  await evaluar(`[...document.querySelectorAll('button[aria-pressed]')].find(b => b.textContent.startsWith('Todo')).click()`)
  await esperar(500)

  /* ------------------------------- 3. carrito ---------------------------- */
  for (let i = 0; i < 3; i++) {
    await evaluar(scriptClickTexto('Agregar al pedido'))
    await esperar(400)
  }
  const enCarrito = await evaluar("JSON.parse(localStorage.getItem('carrito.v1')).items.length")
  comprobar('agrega productos al carrito', enCarrito === 3, `${enCarrito} líneas`)

  await evaluar("document.querySelector('header button[aria-label^=\"Ver mi pedido\"]').click()")
  await esperar(800)
  comprobar('abre el carrito lateral (off-canvas)', await evaluar("!!document.querySelector('aside')"))
  comprobar('ofrece envío y retiro', (await evaluar("[...document.querySelectorAll('aside input[name=entrega]')].map(i=>i.value).length")) === 2)
  informe.datos.totalesCarrito = await evaluar(scriptTexto('aside dl'))
  comprobar('calcula totales', /Total/.test(informe.datos.totalesCarrito || ''), informe.datos.totalesCarrito)

  /* ------------------------------ 4. checkout ---------------------------- */
  await evaluar(scriptClickTexto('Continuar con el pedido'))
  await esperar(1000)
  comprobar('abre el checkout en el paso de datos', (await evaluar(scriptTexto('[role=dialog] header p'))) === 'Datos y entrega')

  await evaluar(scriptClickTexto('Elegir forma de pago'))
  await esperar(700)
  informe.datos.erroresValidacion = await evaluar("[...document.querySelectorAll('[role=dialog] p.text-red-600')].map(p => p.textContent).length")
  comprobar('bloquea el avance sin datos', informe.datos.erroresValidacion >= 2, `${informe.datos.erroresValidacion} errores marcados`)

  await evaluar(scriptLlenarCampo('#campo-nombre-y-apellido', 'Valentin Jurado'))
  await evaluar(scriptLlenarCampo('#campo-telefono-de-contacto', '2494 123456'))
  await evaluar(scriptLlenarCampo('#campo-direccion-de-entrega', 'Rivadavia 1234, Tandil'))
  await esperar(400)
  await evaluar(scriptClickTexto('Elegir forma de pago'))
  await esperar(1000)
  comprobar('avanza al paso de pago', (await evaluar(scriptTexto('[role=dialog] header p'))) === 'Forma de pago')
  informe.datos.formasDePago = await evaluar("[...document.querySelectorAll('[role=dialog] input[name=pago]')].map(i => i.value)")
  comprobar('ofrece efectivo y transferencia', informe.datos.formasDePago?.join() === 'efectivo,transferencia')
  comprobar('no pide datos de tarjeta', !(await evaluar("/(nro de tarjeta|cvv|vencimiento|card number)/i.test(document.querySelector('[role=dialog]').innerText)")))

  await evaluar(`[...document.querySelectorAll('[role=dialog] label')].find(l => l.textContent.includes('Transferencia')).click()`)
  await esperar(1000)
  comprobar('muestra el alias para transferir', await evaluar("document.body.innerText.includes('almacen.donarosa.mp')"))
  comprobar('muestra el CBU', await evaluar("document.body.innerText.includes('0140011500150012345678')"))
  informe.datos.botonesCopiar = await evaluar("[...document.querySelectorAll('[role=dialog] button')].filter(b => b.textContent.includes('Copiar')).length")
  comprobar('permite copiar los datos bancarios', informe.datos.botonesCopiar >= 3, `${informe.datos.botonesCopiar} botones Copiar`)
  comprobar('pide adjuntar el comprobante', await evaluar("/adjunt\\w* (el|ahi|ah\\u00ed).{0,20}comprobante/i.test(document.body.innerText)"))

  /* --------------------- 5. link de WhatsApp + cierre -------------------- */
  await evaluar(scriptClickTexto('Revisar y confirmar'))
  await esperar(1200)
  comprobar('llega al paso de confirmación', (await evaluar(scriptTexto('[role=dialog] header p'))) === 'Confirmar')

  const href = await evaluar("document.querySelector('[role=dialog] a[href^=\"https://wa.me\"]')?.href")
  informe.datos.numeroOrden = await evaluar("document.querySelector('[role=dialog] .font-mono')?.innerText")
  const texto = href ? decodeURIComponent(href.split('?text=')[1] || '') : ''
  informe.datos.mensaje = texto

  comprobar('el enlace apunta a wa.me con el número configurado', /^https:\/\/wa\.me\/\d{10,}\?text=/.test(href || ''), (href || '').split('?')[0])
  comprobar('la URL no tiene espacios ni comillas sin codificar', !/[\s"]/.test(href || ''))
  comprobar('el mensaje lleva el número de orden', new RegExp(`NUEVO PEDIDO ${informe.datos.numeroOrden}`).test(texto), informe.datos.numeroOrden)
  comprobar('el mensaje lleva el detalle con subtotales', /• \d+ x .+ — \$/.test(texto))
  comprobar('el mensaje lleva los totales', /Subtotal \(\d+ ítems\):/.test(texto) && /\*TOTAL: \$/.test(texto))
  comprobar('el mensaje lleva la modalidad de entrega', /Modalidad: Env[íi]o a domicilio/.test(texto) && texto.includes('Rivadavia 1234'))
  comprobar('el mensaje lleva la forma de pago', /Forma de pago: Transferencia bancaria/.test(texto))
  comprobar(
    'el mensaje incluye la frase de transferencia exigida',
    texto.includes('Ya realicé el pago al alias indicado, te adjunto el comprobante'),
  )
  comprobar('el mensaje lleva los datos del cliente', texto.includes('Valentin Jurado') && texto.includes('2494 123456'))

  // Click real en el enlace, pero sin salir del sitio (se corta la navegación)
  await evaluar(`(() => {
    const a = document.querySelector('[role=dialog] a[href^="https://wa.me"]');
    a.addEventListener('click', (e) => e.preventDefault(), { capture: true });
    a.click();
    return true;
  })()`)
  await esperar(1300)
  comprobar('muestra la pantalla de éxito', (await evaluar("document.querySelector('[role=dialog] h2')?.innerText")) === 'Pedido enviado')
  informe.datos.ordenGuardada = await evaluar("JSON.parse(localStorage.getItem('carrito.v1')).numeroOrden")
  comprobar('guarda el número de orden en el dispositivo', informe.datos.ordenGuardada === informe.datos.numeroOrden)

  /* ---------------------------- 6. responsive --------------------------- */
  await evaluar("document.querySelector('[role=dialog] button[aria-label=Cerrar]').click()")
  await esperar(900)
  await nav.enviar('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true })
  await esperar(1200)
  comprobar('en celular aparece la barra de pedido', await evaluar("!!document.querySelector('div.fixed.inset-x-0.bottom-0 button')"))
  informe.datos.barraMovil = await evaluar(scriptTexto('div.fixed.inset-x-0.bottom-0 button'))
  await nav.enviar('Emulation.clearDeviceMetricsOverride')

  /* --------------------------- 7. persistencia -------------------------- */
  await nav.enviar('Page.navigate', { url: URL_BASE })
  await nav.esperarSelector("document.querySelectorAll('article').length > 0")
  const tras = await evaluar("JSON.parse(localStorage.getItem('carrito.v1')).items.length")
  comprobar('el carrito sobrevive al recargar', tras === 3, `${tras} líneas`)
} finally {
  await nav.cerrar()
}

informe.resumen = {
  total: Object.keys(informe.checks).length,
  ok: Object.values(informe.checks).filter((c) => c.ok).length,
  fallos,
}
await writeFile('docs/e2e-resultado.json', JSON.stringify(informe, null, 1))
console.log(`\n${informe.resumen.ok}/${informe.resumen.total} comprobaciones OK`)
if (fallos.length) {
  console.error('FALLOS:\n - ' + fallos.join('\n - '))
  process.exit(1)
}
console.log('Informe: docs/e2e-resultado.json')
