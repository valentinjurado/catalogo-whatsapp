import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { IconoCerrar } from './Iconos'

/**
 * Modal accesible y liviano (sin librerías): portal sobre <body>, cierre con
 * Escape o clic en el fondo, scroll bloqueado y foco atrapado.
 *
 * IMPORTANTE (bug corregido): el efecto depende SOLO de `abierto`. Si dependiera
 * también de `onCerrar` (que cambia de identidad en cada render del padre), el
 * efecto se re-ejecutaría en cada tecla → el cleanup devolvía el foco al elemento
 * anterior y se volvía a enfocar el primer campo: el usuario perdía el foco
 * mientras escribía. El handler se guarda en un ref, siempre fresco.
 */
export default function Modal({
  abierto,
  onCerrar,
  titulo,
  descripcion,
  children,
  pie = null,
  anchoMax = 'max-w-lg',
}) {
  const refDialogo = useRef(null)
  const refCerrar = useRef(onCerrar)
  // El handler se actualiza en un efecto: el efecto de abajo depende solo de
  // `abierto`, así no se re-ejecuta en cada render del padre (eso era lo que
  // hacía perder el foco al escribir).
  useEffect(() => {
    refCerrar.current = onCerrar
  }, [onCerrar])

  useEffect(() => {
    if (!abierto) return
    const anterior = document.activeElement
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const alTeclear = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        refCerrar.current?.()
        return
      }
      if (e.key !== 'Tab') return
      const focos = refDialogo.current?.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (!focos?.length) return
      const primero = focos[0]
      const ultimo = focos[focos.length - 1]
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault()
        ultimo.focus()
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault()
        primero.focus()
      }
    }

    document.addEventListener('keydown', alTeclear)
    const timer = setTimeout(() => {
      const auto = refDialogo.current?.querySelector('[data-foco-inicial]')
      const primerCampo = refDialogo.current?.querySelector('input, button')
      ;(auto || primerCampo)?.focus()
    }, 60)

    return () => {
      document.removeEventListener('keydown', alTeclear)
      clearTimeout(timer)
      document.body.style.overflow = overflow
      anterior?.focus?.()
    }
  }, [abierto])

  if (!abierto) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
    >
      <div
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px] anim-fundido"
        onClick={() => onCerrar?.()}
      />
      <div
        ref={refDialogo}
        className={[
          'relative w-full bg-white shadow-2xl anim-modal flex flex-col',
          'rounded-t-3xl sm:rounded-3xl max-h-[92vh] sm:max-h-[88vh]',
          anchoMax,
        ].join(' ')}
      >
        <header className="flex items-start gap-4 px-5 sm:px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="min-w-0 flex-1">
            {titulo && <h2 className="text-lg font-semibold text-slate-900">{titulo}</h2>}
            {descripcion && <p className="mt-0.5 text-sm text-slate-500">{descripcion}</p>}
          </div>
          <button
            onClick={() => onCerrar?.()}
            aria-label="Cerrar"
            className="shrink-0 w-9 h-9 grid place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <IconoCerrar className="w-5 h-5" />
          </button>
        </header>

        <div className="scroll-fino overflow-y-auto px-5 sm:px-6 py-5">{children}</div>

        {pie && (
          <footer className="px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/70 rounded-b-3xl">
            {pie}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  )
}
