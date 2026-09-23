import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { IconoAlerta, IconoCheck, IconoCerrar } from './Iconos'

/**
 * Avisos flotantes (agregado al carrito, errores, copiado, etc.)
 * Uso: const { avisar } = useToast(); avisar({ titulo: 'Agregado', tono: 'ok' })
 */
const ToastContext = createContext(null)

const TONOS = {
  ok: 'border-brand-200 bg-white text-slate-800',
  error: 'border-red-200 bg-white text-slate-800',
  info: 'border-slate-200 bg-white text-slate-800',
}

export function ToastProvider({ children }) {
  const [avisos, setAvisos] = useState([])

  const cerrar = useCallback((id) => {
    setAvisos((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const avisar = useCallback(
    ({ titulo, detalle, tono = 'ok', accion = null, duracion = 3500 }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      setAvisos((prev) => [...prev.slice(-3), { id, titulo, detalle, tono, accion }])
      if (duracion) setTimeout(() => cerrar(id), duracion)
      return id
    },
    [cerrar],
  )

  const valor = useMemo(() => ({ avisar, cerrar }), [avisar, cerrar])

  return (
    <ToastContext.Provider value={valor}>
      {children}
      {createPortal(
        <div className="fixed z-[90] bottom-[86px] sm:bottom-6 left-1/2 sm:left-auto sm:right-6 -translate-x-1/2 sm:translate-x-0 flex flex-col gap-2 w-[calc(100%-2rem)] sm:w-[360px] pointer-events-none">
          {avisos.map((a) => (
            <div
              key={a.id}
              role="status"
              className={[
                'pointer-events-auto flex items-start gap-3 rounded-2xl border shadow-lg shadow-slate-900/5 px-4 py-3 anim-aparecer',
                TONOS[a.tono] || TONOS.info,
              ].join(' ')}
            >
              <span
                className={[
                  'shrink-0 mt-0.5 w-6 h-6 grid place-items-center rounded-full',
                  a.tono === 'error'
                    ? 'bg-red-50 text-red-600'
                    : a.tono === 'info'
                      ? 'bg-slate-100 text-slate-600'
                      : 'bg-brand-50 text-brand-600',
                ].join(' ')}
              >
                {a.tono === 'error' ? (
                  <IconoAlerta className="w-4 h-4" />
                ) : (
                  <IconoCheck className="w-4 h-4" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900">{a.titulo}</p>
                {a.detalle && <p className="text-xs text-slate-500 mt-0.5">{a.detalle}</p>}
                {a.accion && (
                  <button
                    onClick={() => {
                      a.accion.onClick?.()
                      cerrar(a.id)
                    }}
                    className="mt-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800 underline underline-offset-2"
                  >
                    {a.accion.texto}
                  </button>
                )}
              </div>
              <button
                onClick={() => cerrar(a.id)}
                aria-label="Cerrar aviso"
                className="shrink-0 text-slate-300 hover:text-slate-500 transition"
              >
                <IconoCerrar className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

// El hook vive junto a su provider a propósito (patrón estándar de contexto).
// eslint-disable-next-line react/only-export-components
export function useToast() {
  const contexto = useContext(ToastContext)
  if (!contexto) throw new Error('useToast debe usarse dentro de <ToastProvider>')
  return contexto
}
