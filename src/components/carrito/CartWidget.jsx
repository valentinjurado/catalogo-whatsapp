import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { NEGOCIO } from '../../config/negocio'
import { formatearPrecio } from '../../services/formato'
import { faltaParaEnvioGratis } from '../../services/pedido'
import Boton from '../ui/Boton'
import ItemCarrito from './ItemCarrito'
import SelectorEntrega from './SelectorEntrega'
import { IconoCerrar, IconoFlecha, IconoMoto } from '../ui/Iconos'

/**
 * <CartWidget> — carrito lateral (off-canvas).
 * Revisa productos, cantidades, entrega y totales; el pago y el envío del
 * pedido ocurren en <CheckoutModal>.
 *
 * El efecto del teclado depende solo de `abierto` (el handler va en un ref) para
 * no re-ejecutarse en cada render del padre.
 */
export default function CartWidget({
  abierto,
  items,
  totales,
  entrega,
  cantidadTotal,
  onCerrar,
  onCambiarCantidad,
  onQuitar,
  onNota,
  onCambiarEntrega,
  onContinuar,
  onVaciar,
}) {
  const refCerrar = useRef(onCerrar)
  useEffect(() => {
    refCerrar.current = onCerrar
  }, [onCerrar])

  useEffect(() => {
    if (!abierto) return
    const alTeclear = (e) => e.key === 'Escape' && refCerrar.current?.()
    document.addEventListener('keydown', alTeclear)
    return () => document.removeEventListener('keydown', alTeclear)
  }, [abierto])

  if (!abierto) return null

  const faltante = entrega === 'envio' ? faltaParaEnvioGratis(totales.subtotal) : 0
  const esEnvio = entrega === 'envio'
  const vacio = items.length === 0

  return createPortal(
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Mi pedido">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] anim-fundido" onClick={onCerrar} />

      <aside className="anim-panel absolute right-0 top-0 flex h-full w-full flex-col bg-white shadow-2xl sm:w-[440px]">
        <header className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Mi pedido</h2>
          {cantidadTotal > 0 && (
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
              {cantidadTotal} {cantidadTotal === 1 ? 'producto' : 'productos'}
            </span>
          )}
          <button
            onClick={onCerrar}
            aria-label="Cerrar el carrito"
            className="ml-auto grid h-9 w-9 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <IconoCerrar className="w-5 h-5" />
          </button>
        </header>

        {vacio ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400">
              <IconoMoto className="w-6 h-6" />
            </span>
            <h3 className="mt-4 font-semibold text-slate-800">Todavía no agregaste nada</h3>
            <Boton variante="secundario" className="mt-5" onClick={onCerrar}>
              Ver el catálogo
            </Boton>
          </div>
        ) : (
          <>
            <div className="scroll-fino flex-1 overflow-y-auto px-5">
              {faltante > 0 && (
                <div className="mt-4 rounded-2xl border border-brand-100 bg-brand-50/70 p-3.5">
                  <p className="text-xs font-medium text-brand-800">
                    Te faltan {formatearPrecio(faltante)} para tener envío sin cargo
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-brand-500 transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          (totales.subtotal / NEGOCIO.entrega.envio.gratisDesde) * 100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              <ul className="divide-y divide-slate-100">
                {items.map((item) => (
                  <ItemCarrito
                    key={item.id}
                    item={item}
                    onCambiarCantidad={onCambiarCantidad}
                    onQuitar={onQuitar}
                    onNota={onNota}
                  />
                ))}
              </ul>

              <div className="py-5">
                <SelectorEntrega entrega={entrega} onCambiar={onCambiarEntrega} />
              </div>

              <button
                onClick={onVaciar}
                className="mb-5 text-xs font-medium text-slate-400 underline underline-offset-2 transition hover:text-red-600"
              >
                Vaciar el pedido
              </button>
            </div>

            <footer className="border-t border-slate-100 bg-slate-50/70 px-5 py-4">
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between text-slate-600">
                  <dt>Subtotal</dt>
                  <dd className="tabular-nums">{formatearPrecio(totales.subtotal)}</dd>
                </div>
                {esEnvio && (
                  <div className="flex justify-between text-slate-600">
                    <dt>Envío</dt>
                    <dd className="tabular-nums">
                      {totales.envio > 0 ? (
                        formatearPrecio(totales.envio)
                      ) : (
                        <span className="font-semibold text-brand-700">Sin cargo</span>
                      )}
                    </dd>
                  </div>
                )}
                {totales.ahorro > 0 && (
                  <div className="flex justify-between text-red-600">
                    <dt>Ahorro por ofertas</dt>
                    <dd className="tabular-nums">-{formatearPrecio(totales.ahorro)}</dd>
                  </div>
                )}
                <div className="mt-2.5 flex items-baseline justify-between border-t border-slate-200 pt-2.5">
                  <dt className="font-semibold text-slate-900">Total</dt>
                  <dd className="text-xl font-bold tabular-nums text-slate-900">
                    {formatearPrecio(totales.total)}
                  </dd>
                </div>
              </dl>

              <Boton
                tamano="lg"
                className="mt-4 w-full"
                onClick={onContinuar}
                iconoDer={<IconoFlecha className="w-4 h-4" />}
              >
                Continuar
              </Boton>
            </footer>
          </>
        )}
      </aside>
    </div>,
    document.body,
  )
}
