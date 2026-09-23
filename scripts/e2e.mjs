#!/usr/bin/env node
/**
 * E2E del flujo de compra completo, por CDP directo (sin dependencias).
 *
 *   npm run e2e                        (usa http://localhost:4173)
 *   node scripts/e2e.mjs https://valentinjurado.github.io/catalogo-whatsapp/
 *
 * Verifica de punta a punta:
 *   menú -> búsqueda -> filtros -> producto agotado -> carrito -> checkout
 *   (datos, foco al escribir, validación, forma de pago) -> link de WhatsApp con
 *   el mensaje codificado y validado -> pantalla de éxito -> persistencia.
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
  const { evaluar, enviar } = nav

  /* ------------------------- 0. punto de partida ------------------------- */
  // Sin almacenamiento local: la app no debe escribir nada en el dispositivo.
  await evaluar('localStorage.clear(); sessionStorage.clear(); true')
  await enviar('Page.navigate', { url: URL_BASE })
  await nav.esperarSelector("document.querySelectorAll('article').length > 0")
  informe.datos.almacenamiento = {
    localStorage: await evaluar('localStorage.length'),
    sessionStorage: await evaluar('sessionStorage.length'),
    cookies: await evaluar('document.cookie'),
  }
  comprobar(
    'no guarda nada en el dispositivo (sin localStorage/cookies)',
    informe.datos.almacenamiento.localStorage === 0 &&
      informe.datos.almacenamiento.sessionStorage === 0 &&
      informe.datos.almacenamiento.cookies === '',
  )

  /* ------------------------------ 1. menú ------------------------------- */
  informe.datos.tarjetas = await evaluar("document.querySelectorAll('article').length")
  comprobar('el menú se renderiza primero', (await evaluar("document.querySelector('h1')?.innerText")) === 'Menú')
  comprobar('los productos aparecen sin hero de por medio', (await evaluar("document.querySelector('article').getBoundingClientRect().top")) < 900)
  comprobar('renderiza productos', informe.datos.tarjetas >= 10, `${informe.datos.tarjetas} tarjetas`)
  comprobar(
    'producto agotado bloqueado',
    (await evaluar("document.querySelectorAll('article button:disabled').length")) >= 1 &&
      (await evaluar("[...document.querySelectorAll('article button:disabled')].every(b => /agotado/i.test(b.textContent))")),
    'botón deshabilitado',
  )
  comprobar('ofertas con precio tachado', (await evaluar("document.querySelectorAll('article .line-through').length")) > 0)
  comprobar('sin textos técnicos en la página', await evaluar("!/sitio est[áa]tico|sin base de datos|no pedimos datos de tarjeta|modo demostraci[óo]n|javascript/i.test(document.body.innerText)"))

  await evaluar(scriptForzarPintado)
  await esperar(6000)
  informe.datos.imagenes = await evaluar(
    "(() => { const im=[...document.querySelectorAll('article img')]; return im.filter(i=>i.naturalWidth>0 && getComputedStyle(i).opacity==='1').length + '/' + im.length; })()",
  )
  comprobar('imágenes de producto cargadas', informe.datos.imagenes.split('/')[0] === informe.datos.imagenes.split('/')[1], informe.datos.imagenes)

  /* --------------------------- 2. búsqueda y filtros --------------------- */
  await evaluar(scriptLlenarCampo('input[type=search]', 'muzzarella'))
  await esperar(600)
  informe.datos.busqueda = await evaluar("document.querySelectorAll('article').length")
  comprobar('el buscador filtra', informe.datos.busqueda > 0 && informe.datos.busqueda < informe.datos.tarjetas, `${informe.datos.busqueda} resultados`)

  await evaluar(scriptLlenarCampo('input[type=search]', ''))
  await esperar(500)
  await evaluar(`[...document.querySelectorAll('button[aria-pressed]')].find(b => b.textContent.includes('Hamburguesas')).click()`)
  await esperar(600)
  informe.datos.porCategoria = await evaluar("document.querySelectorAll('article').length")
  comprobar('el filtro por categoría funciona', informe.datos.porCategoria > 0 && informe.datos.porCategoria < informe.datos.tarjetas, `${informe.datos.porCategoria} en Hamburguesas`)
  await evaluar(`[...document.querySelectorAll('button[aria-pressed]')].find(b => b.textContent.startsWith('Todo')).click()`)
  await esperar(500)

  // Filtros rápidos: salen de la columna `etiquetas` del Sheet (Vegano, Veggie…)
  const hayFiltroVegano = await evaluar(`(() => { const b = [...document.querySelectorAll('button[aria-pressed]')].find(x => x.textContent.startsWith('Vegano')); if (!b) return false; b.click(); return true; })()`)
  await esperar(700)
  informe.datos.filtroDieta = await evaluar("document.querySelectorAll('article').length")
  const soloVegano = await evaluar("(() => { const a = [...document.querySelectorAll('article')]; return a.length > 0 && a.every(x => /vegano/i.test(x.innerText)); })()")
  comprobar('el filtro rápido por dieta funciona (Vegano)', hayFiltroVegano && soloVegano, `${informe.datos.filtroDieta} productos veganos`)
  await evaluar(`(() => { const b = [...document.querySelectorAll('button[aria-pressed]')].find(x => x.textContent.startsWith('Vegano')); if (b) b.click(); return true; })()`)
  await esperar(500)

  /* ------------------------ 2b. ficha del producto ----------------------- */
  await evaluar("[...document.querySelectorAll('article h3 button')][0].click()")
  await esperar(900)
  informe.datos.ficha = await evaluar(scriptTexto('[role=dialog]'))
  comprobar('abre la ficha con el detalle del producto', await evaluar("!!document.querySelector('[role=dialog] h2')"))
  comprobar('la ficha muestra los ingredientes', /Ingredientes/i.test(informe.datos.ficha || ''))
  const agregadoDesdeFicha = await evaluar(`(() => { const b = [...document.querySelectorAll('[role=dialog] button')].find(x => /^Agregar/.test(x.textContent.trim())); if (!b) return false; b.click(); return true; })()`)
  await esperar(1000)
  comprobar('agrega desde la ficha y la cierra', agregadoDesdeFicha && !(await evaluar("!!document.querySelector('[role=dialog] h2')")))

  /* ------------------------------- 3. carrito ---------------------------- */
  for (let i = 0; i < 3; i++) {
    await evaluar(scriptClickTexto('Agregar al pedido'))
    await esperar(400)
  }

  await evaluar("document.querySelector('header button[aria-label^=\"Ver mi pedido\"]').click()")
  await esperar(800)
  comprobar('abre el carrito lateral (off-canvas)', await evaluar("!!document.querySelector('aside')"))
  const enCarrito = await evaluar("document.querySelectorAll('aside ul li').length")
  comprobar('agrega productos al pedido (incluye el de la ficha)', enCarrito === 4, `${enCarrito} líneas`)
  comprobar('ofrece envío y retiro', (await evaluar("[...document.querySelectorAll('aside input[name=entrega]')].map(i=>i.value).length")) === 2)
  informe.datos.totalesCarrito = await evaluar(scriptTexto('aside dl'))
  comprobar('calcula totales', /Total/.test(informe.datos.totalesCarrito || ''), informe.datos.totalesCarrito)

  /* ------------------------------ 4. checkout ---------------------------- */
  await evaluar(scriptClickTexto('Continuar'))
  await esperar(1000)
  comprobar('abre el checkout en el paso de datos', (await evaluar(scriptTexto('[role=dialog] h2'))) === 'Finalizar pedido')

  /* ---- el bug reportado: al escribir, el campo NO debe perder el foco ---- */
  await evaluar("document.querySelector('#campo-nombre-y-apellido').focus(); true")
  const focos = []
  for (const ch of 'Valentin') {
    // solo el evento 'char' inserta texto (mandar keyDown con text duplicaría cada letra)
    await enviar('Input.dispatchKeyEvent', { type: 'char', key: ch, text: ch, unmodifiedText: ch })
    await esperar(90)
    focos.push(await evaluar('document.activeElement?.id || document.activeElement?.tagName'))
  }
  informe.datos.focoPorTecla = focos
  const valorEscrito = await evaluar("document.querySelector('#campo-nombre-y-apellido').value")
  comprobar(
    'el campo conserva el foco mientras se escribe',
    focos.every((id) => id === 'campo-nombre-y-apellido'),
    focos.join(' → '),
  )
  comprobar('el texto escrito llega completo al campo', valorEscrito === 'Valentin', `"${valorEscrito}"`)

  await evaluar(scriptLlenarCampo('#campo-nombre-y-apellido', 'Valentin Jurado'))
  await evaluar(scriptLlenarCampo('#campo-telefono-de-contacto', '2494 123456'))
  await evaluar(scriptLlenarCampo('#campo-direccion-de-entrega', 'Rivadavia 1234, Tandil'))
  await esperar(400)

  // validación: borrar el teléfono y verificar que no deja avanzar
  await evaluar(scriptLlenarCampo('#campo-telefono-de-contacto', ''))
  await evaluar(scriptClickTexto('Continuar'))
  await esperar(700)
  informe.datos.erroresValidacion = await evaluar("[...document.querySelectorAll('[role=dialog] p.text-red-600')].map(p => p.textContent).length")
  comprobar('bloquea el avance con datos incompletos', informe.datos.erroresValidacion >= 1, `${informe.datos.erroresValidacion} errores marcados`)
  await evaluar(scriptLlenarCampo('#campo-telefono-de-contacto', '2494 123456'))
  await esperar(300)
  await evaluar(scriptClickTexto('Continuar'))
  await esperar(1000)
  comprobar('avanza a la elección de forma de pago', (await evaluar(scriptTexto('[role=dialog] header p'))) === 'Forma de pago')

  informe.datos.formasDePago = await evaluar("[...document.querySelectorAll('[role=dialog] input[name=pago]')].map(i => i.value)")
  comprobar('ofrece efectivo y transferencia', informe.datos.formasDePago?.join() === 'efectivo,transferencia')
  comprobar('no hay ningún paso de "confirmar pedido" aparte', (await evaluar("![...document.querySelectorAll('[role=dialog] button')].some(b => /confirmar/i.test(b.textContent))")) === true)

  /* ------- la web NO muestra datos bancarios: solo se elige la forma ------ */
  const textoDialogo = await evaluar("document.querySelector('[role=dialog]').innerText")
  comprobar('no muestra CBU/CVU en pantalla', !/\b(CBU|CVU)\b/i.test(textoDialogo))
  comprobar('no muestra ningún alias con valor', !/(alias|Alias)\s*[:=]\s*\S/i.test(textoDialogo))
  comprobar('no pide datos de tarjeta', !/(nro de tarjeta|cvv|vencimiento|card number)/i.test(textoDialogo))

  await evaluar(`[...document.querySelectorAll('[role=dialog] label')].find(l => l.textContent.includes('Transferencia')).click()`)
  await esperar(900)
  comprobar('la transferencia explica que el alias llega por WhatsApp', /alias/i.test(await evaluar("document.querySelector('[role=dialog]').innerText")))

  /* --------------------- 5. link de WhatsApp + cierre -------------------- */
  const href = await evaluar("document.querySelector('[role=dialog] a[href^=\"https://wa.me\"]')?.href")
  const texto = href ? decodeURIComponent(href.split('?text=')[1] || '') : ''
  informe.datos.mensaje = texto

  comprobar('el enlace apunta a wa.me con el número configurado', /^https:\/\/wa\.me\/\d{10,}\?text=/.test(href || ''), (href || '').split('?')[0])
  comprobar(
    'el número está en formato internacional (con código de país)',
    /^https:\/\/wa\.me\/(?!0)\d{11,}\?/.test(href || ''),
    (href || '').split('?')[0],
  )
  comprobar('la URL no tiene espacios ni comillas sin codificar', !/[\s"]/.test(href || ''))
  comprobar(
    'el mensaje identifica el pedido por nombre y apellido',
    /^\*NUEVO PEDIDO — Valentin Jurado\*/.test(texto),
    texto.split('\n')[0],
  )
  comprobar('el mensaje no expone ningún número de pedido', !/PED-\d{6}/.test(texto))
  comprobar('la pantalla tampoco muestra número de pedido', !/PED-\d{6}/.test(await evaluar("document.querySelector('[role=dialog]').innerText")))
  comprobar('el mensaje lleva el detalle con subtotales', /• \d+ x .+ — \$/.test(texto))
  comprobar('el mensaje lleva los totales', /Subtotal:/.test(texto) && /\*TOTAL: \$/.test(texto))
  comprobar('el mensaje lleva la modalidad de entrega', /Envío a domicilio|Retiro en el local/.test(texto) && texto.includes('Rivadavia 1234'))
  comprobar('el mensaje avisa que hay que pasar el alias (transferencia)', texto.includes('pasame el alias'))
  comprobar('el mensaje NO incluye datos bancarios', !/\b(CBU|CVU)\b/i.test(texto) && !/alias\s*:\s*\S/i.test(texto))
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

  /* ---------------------------- 6. responsive --------------------------- */
  await evaluar("document.querySelector('[role=dialog] button[aria-label=Cerrar]').click()")
  await esperar(900)
  await enviar('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true })
  await esperar(1200)
  comprobar('en celular aparece la barra de pedido', await evaluar("!!document.querySelector('div.fixed.inset-x-0.bottom-0 button')"))
  informe.datos.barraMovil = await evaluar(scriptTexto('div.fixed.inset-x-0.bottom-0 button'))
  await enviar('Emulation.clearDeviceMetricsOverride')

  /* ------------------ 7. el pedido NO queda en el dispositivo ------------ */
  await enviar('Page.navigate', { url: URL_BASE })
  await nav.esperarSelector("document.querySelectorAll('article').length > 0")
  const botonTrasRecargar = await evaluar(
    "document.querySelector('header button[aria-label^=\"Ver mi pedido\"]').innerText.replace(/\\s+/g, ' ').trim()",
  )
  comprobar(
    'al recargar, el pedido arranca vacío (no se guardó nada)',
    !/\d/.test(botonTrasRecargar.replace(/Mi pedido/g, '')),
    botonTrasRecargar,
  )
  comprobar(
    'sigue sin escribir en el dispositivo',
    (await evaluar('localStorage.length')) === 0 &&
      (await evaluar('sessionStorage.length')) === 0 &&
      (await evaluar('document.cookie')) === '',
  )
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
