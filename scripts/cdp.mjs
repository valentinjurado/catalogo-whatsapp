/**
 * Conexión CDP reutilizable (Node >= 22, sin dependencias).
 * La usan scripts/capturar.mjs y scripts/e2e.mjs.
 *
 * Habla el protocolo directo contra un navegador Chromium con puerto de
 * depuración abierto — no depende del daemon de browser-use, que en este
 * entorno falla capturas y evaluaciones por timeouts de IPC.
 *
 *   msedge.exe --headless=new --remote-debugging-port=9222 --user-data-dir=<dir>
 */

export const CDP_HTTP = process.env.CDP_HTTP || 'http://127.0.0.1:9222'

export const esperar = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * Abre una pestaña, la deja navegada y devuelve helpers para manejarla.
 * @returns {Promise<{evaluar, navegar, esperarSelector, captura, cerrar, cerrarPestania}>}
 */
export async function abrirNavegador({ url, ancho = 1440, alto = 900, movil = false, sinCache = false } = {}) {
  const version = await (await fetch(`${CDP_HTTP}/json/version`)).json()
  console.log('Navegador:', version.Browser)

  const nueva = await fetch(`${CDP_HTTP}/json/new?about:blank`, { method: 'PUT' })
  if (!nueva.ok) {
    throw new Error(
      `No se pudo abrir la pestaña (${nueva.status}). ¿Está el navegador con --remote-debugging-port?`,
    )
  }
  const target = await nueva.json()

  const ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolver, rechazar) => {
    ws.addEventListener('open', resolver, { once: true })
    ws.addEventListener('error', rechazar, { once: true })
  })

  let idSeq = 0
  const pendientes = new Map()
  ws.addEventListener('message', (evento) => {
    const msg = JSON.parse(evento.data)
    const pendiente = pendientes.get(msg.id)
    if (!pendiente) return
    pendientes.delete(msg.id)
    if (msg.error) pendiente.rechazar(new Error(JSON.stringify(msg.error)))
    else pendiente.resolver(msg.result)
  })

  const enviar = (metodo, params = {}, timeoutMs = 45000) => {
    const id = ++idSeq
    ws.send(JSON.stringify({ id, method: metodo, params }))
    return new Promise((resolver, rechazar) => {
      pendientes.set(id, { resolver, rechazar })
      setTimeout(() => {
        if (pendientes.delete(id)) rechazar(new Error(`${metodo} sin respuesta en ${timeoutMs} ms`))
      }, timeoutMs)
    })
  }

  const evaluar = async (expresion) => {
    const r = await enviar('Runtime.evaluate', {
      expression: expresion,
      returnByValue: true,
      awaitPromise: true,
    })
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text)
    return r.result?.value
  }

  const esperarSelector = async (expresion, intentos = 40, pausa = 500) => {
    for (let i = 0; i < intentos; i++) {
      await esperar(pausa)
      if (await evaluar(expresion).catch(() => false)) return true
    }
    return false
  }

  // Datos frescos: el perfil del navegador conserva el CSV en su caché de disco,
  // así que en las pruebas que dependen del contenido se apaga la caché HTTP.
  if (sinCache) {
    await enviar('Network.enable').catch(() => {})
    await enviar('Network.setCacheDisabled', { cacheDisabled: true }).catch(() => {})
    await enviar('Network.clearBrowserCache').catch(() => {})
  }

  const captura = async (ruta) => {
    const r = await enviar('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }, 60000)
    const { writeFile, stat } = await import('node:fs/promises')
    await writeFile(ruta, Buffer.from(r.data, 'base64'))
    const { size } = await stat(ruta)
    console.log(`Captura guardada: ${ruta} (${(size / 1024).toFixed(0)} KB)`)
  }

  const cerrarPestania = () => fetch(`${CDP_HTTP}/json/close/${target.id}`).catch(() => {})
  const cerrar = async () => {
    try { ws.close() } catch {}
    await cerrarPestania()
  }

  await enviar('Page.enable')
  await enviar('Runtime.enable')
  await enviar('Emulation.setDeviceMetricsOverride', {
    width: ancho,
    height: alto,
    deviceScaleFactor: movil ? 2 : 1,
    mobile: movil,
  })
  if (url) await enviar('Page.navigate', { url })

  return { enviar, evaluar, esperarSelector, captura, cerrar, cerrarPestania, target }
}

/**
 * Tipea en un input/textarea controlado por React (el setter nativo + input event).
 * Devuelve el código JS listo para pasar a `evaluar`.
 */
export function scriptLlenarCampo(selector, valor) {
  return `(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return false;
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(valor)});
    el.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  })()`
}

/** Clic en el primer button/a/label que contenga el texto dado. */
export function scriptClickTexto(texto, raiz = 'document') {
  return `(() => {
    const nodos = Array.from(${raiz}.querySelectorAll('button, a, label'));
    const b = nodos.find((x) => x.textContent.includes(${JSON.stringify(texto)}));
    if (!b) return false;
    b.click();
    return true;
  })()`
}

/** Texto visible de un elemento, con los saltos de línea normalizados. */
export function scriptTexto(selector) {
  return `document.querySelector(${JSON.stringify(selector)})?.innerText.replace(/\\n+/g, ' | ')`
}

/**
 * En headless la página queda "hidden": las imágenes con loading="lazy" no se
 * descargan y las transiciones CSS con easing no progresan. Esto fuerza ambas
 * cosas SOLO para poder medir o capturar (no es un problema del sitio).
 */
export const scriptForzarPintado = `(() => {
  document.querySelectorAll('article img').forEach((i) => {
    i.loading = 'eager';
    i.style.transition = 'none';
    if (!i.complete) { const s = i.src; i.src = ''; i.src = s; }
  });
  return true;
})()`
