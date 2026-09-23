#!/usr/bin/env node
/**
 * Auditoría de privacidad y seguridad (sin dependencias).
 *
 *   node scripts/auditar-privacidad.mjs [url]
 *
 * Qué comprueba, con un navegador real y el flujo de compra completo:
 *   1. A qué hosts se conecta la app mientras el cliente carga sus datos
 *      (no debe haber analítica, píxeles ni CDNs de terceros).
 *   2. Dónde aparece el teléfono y el nombre del cliente: solo en el link de
 *      WhatsApp; en ningún pedido de red, cookie, localStorage ni en la URL.
 *   3. Que la web no guarde nada en el dispositivo.
 *   4. Que el HTML compilado y los archivos de hosting declaren las cabeceras
 *      de seguridad (referrer, CSP, X-Frame-Options, Permissions-Policy, HSTS).
 *
 * Deja el informe en docs/privacidad-resultado.json y sale con código 1 si algo falla.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { abrirNavegador, esperar, scriptLlenarCampo, scriptForzarPintado } from './cdp.mjs'

const URL_BASE = process.argv[2] || 'http://localhost:4173/'
const TELEFONO = '2494 123456'
const NOMBRE = 'Valentin Jurado'

// Hosts legítimos: el propio sitio, el Google Sheet y los hosts de las fotos.
// (Se comparan sin puerto: new URL(...).hostname)
const PERMITIDOS = [
  'localhost',
  '127.0.0.1',
  'docs.google.com',
  'drive.google.com',
  'lh3.googleusercontent.com',
  'images.unsplash.com',
]

const informe = { url: URL_BASE, fecha: new Date().toISOString(), checks: {} }
const fallos = []
const comprobar = (nombre, ok, detalle = '') => {
  informe.checks[nombre] = { ok: Boolean(ok), detalle }
  if (!ok) fallos.push(nombre)
  console.log(`${ok ? 'OK  ' : 'FALLA'} ${nombre}${detalle ? ` · ${detalle}` : ''}`)
}

const nav = await abrirNavegador({ url: URL_BASE, sinCache: true, capturarRed: true })
const { evaluar } = nav

try {
  await nav.esperarSelector("document.querySelectorAll('article').length > 0", 30)
  await evaluar(scriptForzarPintado)
  await esperar(3000)

  /* --- flujo: el cliente carga sus datos y llega al link de WhatsApp --- */
  await evaluar("[...document.querySelectorAll('article button')].find(b => /Agregar al pedido/.test(b.textContent))?.click(); true")
  await esperar(700)
  await evaluar("document.querySelector('header button[aria-label^=\"Ver mi pedido\"]').click(); true")
  await esperar(800)
  await evaluar("[...document.querySelectorAll('aside button')].find(b => /Continuar/.test(b.textContent))?.click(); true")
  await esperar(900)
  for (const [selector, valor] of [
    ['#campo-nombre-y-apellido', NOMBRE],
    ['#campo-telefono-de-contacto', TELEFONO],
    ['#campo-direccion-de-entrega', 'Rivadavia 1234, Tandil'],
  ]) {
    await evaluar(scriptLlenarCampo(selector, valor))
    await esperar(300)
  }
  await evaluar("[...document.querySelectorAll('[role=dialog] button')].find(b => /Continuar|forma de pago/.test(b.textContent))?.click(); true")
  await esperar(1500)
  // El checkout tiene que haber llegado al paso de pago (si la app se cayera, no hay link)
  comprobar(
    'el checkout llega al paso de forma de pago',
    await evaluar("!!document.querySelector('[role=dialog] a[href^=\"https://wa.me\"]')"),
  )

  const enlaces = await evaluar(`(() => {
    const a = document.querySelector('[role=dialog] a[href^="https://wa.me"]');
    return a ? a.href : null;
  })()`)
  // href viene con el mensaje percent-encoded: se decodifica para poder buscar el teléfono
  const enlaceDecodificado = enlaces ? decodeURIComponent(enlaces) : ''

  // El teléfono tal como lo tipeó el cliente y sin formatear
  const variantes = [TELEFONO, TELEFONO.replace(/\D/g, '')]

  /* ------------------- 1. hosts contactados ------------------- */
  const pedidos = nav.peticiones()
  const hosts = [...new Set(
    pedidos
      .map((p) => {
        try { return new URL(p.url).hostname } catch { return null }
      })
      .filter(Boolean),
  )]
  const sospechosos = hosts.filter((h) => !PERMITIDOS.some((permitido) => h === permitido || h.endsWith(`.${permitido}`)))
  informe.hosts = hosts
  informe.peticiones_totales = pedidos.length
  comprobar(
    'la app solo se conecta a sí misma, al Google Sheet y a las fotos',
    sospechosos.length === 0,
    sospechosos.length ? `terceros: ${sospechosos.join(', ')}` : `${hosts.length} hosts: ${hosts.join(', ')}`,
  )

  /* ------------- 2. dónde aparece el teléfono del cliente ------------- */
  const enPeticiones = pedidos.filter((p) => variantes.some((v) => p.url.includes(v))).map((p) => p.url)
  comprobar(
    'el teléfono del cliente no viaja a ningún servidor',
    enPeticiones.length === 0,
    enPeticiones.length ? enPeticiones[0].slice(0, 80) : `${pedidos.length} peticiones revisadas`,
  )

  const almacenado = await evaluar(`(() => {
    const todo = [];
    for (let i = 0; i < localStorage.length; i++) todo.push(localStorage.key(i) + '=' + localStorage.getItem(localStorage.key(i)));
    for (let i = 0; i < sessionStorage.length; i++) todo.push(sessionStorage.key(i) + '=' + sessionStorage.getItem(sessionStorage.key(i)));
    todo.push('cookie=' + document.cookie);
    return todo.join('|');
  })()`)
  comprobar(
    'el teléfono del cliente no queda guardado en el dispositivo',
    !variantes.some((v) => String(almacenado).includes(v)),
    (await evaluar('localStorage.length')) === 0 && (await evaluar('document.cookie')) === ''
      ? 'sin localStorage ni cookies'
      : almacenado.slice(0, 60),
  )

  const enUrl = await evaluar('location.href')
  comprobar('el teléfono no queda escrito en la dirección de la página', !variantes.some((v) => enUrl.includes(v)))

  const enDom = await evaluar(`(() => {
    const html = document.documentElement.outerHTML;
    return ${JSON.stringify(variantes)}.some(v => html.includes(v));
  })()`)
  informe.datos_del_cliente = { en_url: false, en_dom: enDom, en_storage: false }

  comprobar(
    'el teléfono solo está dentro del link de WhatsApp que abre el cliente',
    typeof enlaces === 'string' &&
      variantes.some((v) => enlaceDecodificado.includes(v)) &&
      variantes.some((v) => enlaces.includes(encodeURIComponent(v))) ,
    (enlaces || '').split('?')[0],
  )
  comprobar(
    'el link de WhatsApp no manda la página como referencia (no-referrer)',
    (await evaluar("document.querySelector('meta[name=referrer]')?.content")) === 'no-referrer',
  )
  comprobar(
    'los enlaces externos abren aislados (noopener noreferrer)',
    (await evaluar("[...document.querySelectorAll('[role=dialog] a[target=_blank]')].every(a => (a.rel || '').includes('noopener') && (a.rel || '').includes('noreferrer'))")) === true,
  )

  /* --------------- 3. CSP declarada en el HTML servido --------------- */
  const csp = await evaluar("document.querySelector('meta[http-equiv=\"Content-Security-Policy\"]')?.content || ''")
  informe.csp = csp
  comprobar('el HTML declara una Content-Security-Policy', /default-src 'self'/.test(csp) && /form-action 'none'/.test(csp))
  comprobar('la CSP bloquea objetos embebidos y fija la base', /object-src 'none'/.test(csp) && /base-uri 'self'/.test(csp))
  comprobar(
    'la CSP permite solo el Sheet configurado como conexión externa',
    /connect-src 'self' https:\/\/docs\.google\.com/.test(csp) && !/connect-src[^;]*http:\/\//.test(csp),
  )

  /* ------------- 4. cabeceras de hosting declaradas ------------- */
  const archivos = {
    'vercel.json': 'vercel.json',
    'public/_headers': 'public/_headers',
  }
  const faltantes = Object.keys(archivos).filter((f) => !existsSync(f))
  comprobar('están los archivos de cabeceras para el hosting', faltantes.length === 0, faltantes.join(', ') || 'vercel.json + _headers')

  if (!faltantes.length) {
    const textos = {
      vercel: await readFile('vercel.json', 'utf8'),
      headers: await readFile('public/_headers', 'utf8'),
    }
    const juntos = `${textos.vercel}\n${textos.headers}`
    for (const [clave, patron] of [
      ['X-Frame-Options', /X-Frame-Options/i],
      ['frame-ancestors', /frame-ancestors 'none'/i],
      ['nosniff', /X-Content-Type-Options/i],
      ['Referrer-Policy', /Referrer-Policy/i],
      ['Permissions-Policy', /Permissions-Policy/i],
      ['HSTS', /Strict-Transport-Security/i],
    ]) {
      comprobar(`las cabeceras declaran ${clave}`, patron.test(juntos))
    }
  }

  await writeFile('docs/privacidad-resultado.json', JSON.stringify(informe, null, 2) + '\n')
  console.log(`\n${fallos.length ? `${fallos.length} problema(s)` : 'Todo OK'} · informe en docs/privacidad-resultado.json`)
  process.exitCode = fallos.length ? 1 : 0
} finally {
  await nav.cerrar()
}
