import { useCallback, useState } from 'react'

/**
 * Copiar al portapapeles con respaldo para contextos sin HTTPS
 * (por ejemplo, abrir el dist/index.html con doble clic: file://).
 * Devuelve [copiar, copiado, fallo]:
 *   - copiado: clave que se acaba de copiar (para el "✓ Copiado")
 *   - fallo:   clave que no se pudo copiar (para avisar al usuario)
 */
export function useCopiar(ms = 2000) {
  const [copiado, setCopiado] = useState(null)
  const [fallo, setFallo] = useState(null)

  const copiar = useCallback(
    async (texto, clave = texto) => {
      const textoPlano = String(texto)
      let ok = false

      // 1) API moderna (requiere HTTPS o localhost). Puede existir y FALLAR por
      //    permisos, así que el error se atrapa acá y no corta el flujo.
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(textoPlano)
          ok = true
        } catch {
          ok = false
        }
      }

      // 2) Respaldo clásico: funciona en http://, file:// y navegadores viejos.
      if (!ok) {
        try {
          const area = document.createElement('textarea')
          area.value = textoPlano
          area.setAttribute('readonly', '')
          area.style.position = 'fixed'
          area.style.top = '-1000px'
          area.style.opacity = '0'
          document.body.appendChild(area)
          area.select()
          area.setSelectionRange(0, textoPlano.length)
          ok = document.execCommand('copy')
          document.body.removeChild(area)
        } catch {
          ok = false
        }
      }

      if (ok) {
        setCopiado(clave)
        setTimeout(() => setCopiado(null), ms)
      } else {
        // Sin permisos de portapapeles: se avisa para que el usuario copie a mano
        setFallo(clave)
        setTimeout(() => setFallo(null), 5000)
      }
      return ok
    },
    [ms],
  )

  return [copiar, copiado, fallo]
}
