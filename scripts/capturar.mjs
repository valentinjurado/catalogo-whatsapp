#!/usr/bin/env node
/**
 * Capturas de pantalla para la ficha de venta / documentación (CDP directo).
 *
 *   node scripts/capturar.mjs <url> <salida.png> [ancho] [alto] [movil:0|1] [guion]
 *   node scripts/capturar.mjs http://localhost:4173 docs/captura-escritorio.png 1440 900 0 grilla
 *   node scripts/capturar.mjs http://localhost:4173 docs/captura-pago.png 1440 900 0 pago
 *   node scripts/capturar.mjs http://localhost:4173 docs/captura-movil.png 390 844 1 hero
 *
 * Guiones: hero | grilla | carrito | pago
 * Requiere un navegador con puerto de depuración (ver scripts/cdp.mjs).
 */
import {
  abrirNavegador,
  esperar,
  scriptClickTexto,
  scriptForzarPintado,
  scriptLlenarCampo,
} from './cdp.mjs'

const [, , url, salida, anchoArg, altoArg, movilArg, guion = 'grilla'] = process.argv
if (!url || !salida) {
  console.error('Uso: node scripts/capturar.mjs <url> <salida.png> [ancho] [alto] [movil:0|1] [hero|grilla|carrito|pago]')
  process.exit(2)
}

const nav = await abrirNavegador({
  url,
  ancho: Number(anchoArg || 1440),
  alto: Number(altoArg || 900),
  movil: movilArg === '1' || movilArg === 'true',
})

try {
  const { evaluar } = nav
  await nav.esperarSelector("document.querySelectorAll('article').length > 0")
  console.log('Productos en pantalla:', await evaluar("document.querySelectorAll('article').length"))

  await evaluar(scriptForzarPintado)
  await esperar(6000)
  console.log('Imágenes visibles:', await evaluar("(() => { const im=[...document.querySelectorAll('article img')]; return im.filter(i=>i.naturalWidth>0 && getComputedStyle(i).opacity==='1').length + '/' + im.length; })()"))

  if (guion === 'hero') {
    await evaluar('window.scrollTo(0, 0); true')
  } else if (guion === 'grilla') {
    await evaluar("document.querySelector('#menu').scrollIntoView({ block: 'start' }); true")
    await esperar(1000)
    await evaluar('window.scrollBy(0, 130); true')
  } else if (guion === 'ficha') {
    // abre la ficha del primer producto (detalle + ingredientes)
    await evaluar("[...document.querySelectorAll('article h3 button')][0].click(); true")
    await esperar(1400)
  } else if (guion === 'carrito' || guion === 'pago') {
    for (let i = 0; i < 3; i++) {
      await evaluar(scriptClickTexto('Agregar al pedido'))
      await esperar(500)
    }
    await evaluar("document.querySelector('header button[aria-label^=\"Ver mi pedido\"]').click(); true")
    await esperar(1200)

    if (guion === 'pago') {
      await evaluar(`(() => { const b = [...document.querySelectorAll('aside button')].find((x) => x.textContent.includes('Continuar')); if (b) b.click(); return true; })()`)
      await esperar(1200)
      await evaluar(scriptLlenarCampo('#campo-nombre-y-apellido', 'Valentin Jurado'))
      await evaluar(scriptLlenarCampo('#campo-telefono-de-contacto', '2494 123456'))
      await evaluar(scriptLlenarCampo('#campo-direccion-de-entrega', 'Rivadavia 1234, Tandil'))
      await esperar(400)
      await evaluar(`(() => { const b = [...document.querySelectorAll('[role=dialog] button')].find((x) => x.textContent.trim() === 'Continuar'); if (b) b.click(); return true; })()`)
      await esperar(1200)
      await evaluar(`[...document.querySelectorAll('[role=dialog] label')].find((l) => l.textContent.includes('Transferencia')).click()`)
      await esperar(1500)
    }
  }

  await esperar(900)
  // Esperar a que se vayan los avisos (toasts) para que la captura salga limpia
  for (let i = 0; i < 20; i++) {
    const hayAviso = await evaluar("!!document.querySelector('[role=status]')").catch(() => false)
    if (!hayAviso) break
    await esperar(500)
  }
  await nav.captura(salida)
} finally {
  await nav.cerrar()
}
