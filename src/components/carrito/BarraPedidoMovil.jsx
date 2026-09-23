import { formatearPrecio } from '../../services/formato'
import { IconoCarrito, IconoFlecha } from '../ui/Iconos'

/**
 * Barra fija inferior (sólo mobile) con el resumen del pedido.
 * Es el acceso permanente al carrito cuando el panel está cerrado.
 */
export default function BarraPedidoMovil({ visible, cantidadTotal, total, onAbrir }) {
  if (!visible || cantidadTotal === 0) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 backdrop-blur-md sm:hidden">
      <button
        onClick={onAbrir}
        className="flex w-full items-center gap-3 rounded-2xl bg-brand-600 px-4 py-3 text-left text-white shadow-lg shadow-brand-900/10 transition active:bg-brand-700"
      >
        <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/15">
          <IconoCarrito className="w-5 h-5" />
          <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-white px-1 text-[11px] font-bold text-brand-700">
            {cantidadTotal}
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">Ver mi pedido</span>
          <span className="block text-xs text-white/80 tabular-nums">{formatearPrecio(total)}</span>
        </span>
        <IconoFlecha className="w-5 h-5 opacity-80" />
      </button>
    </div>
  )
}
