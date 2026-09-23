import { formatearPrecio } from '../../services/formato'
import ImagenProducto from '../ui/ImagenProducto'
import { IconoBasura, IconoMas, IconoMenos } from '../ui/Iconos'
import { NEGOCIO } from '../../config/negocio'
import { AreaTexto } from '../ui/Campo'

/**
 * Una línea del carrito: imagen, cantidad, subtotal y nota opcional.
 */
export default function ItemCarrito({ item, onCambiarCantidad, onQuitar, onNota }) {
  const subtotal = (item.precioFinal ?? item.precio) * item.cantidad
  const enOferta = item.precioOferta && item.precio > item.precioOferta

  return (
    <li className="flex gap-3 py-4">
      <ImagenProducto
        src={item.urlImagen}
        alt={item.titulo}
        proporcion="aspect-square"
        className="w-20 shrink-0 rounded-xl border border-slate-100"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-snug text-slate-900">{item.titulo}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {formatearPrecio(item.precioFinal ?? item.precio)}
              {item.unidad ? ` / ${item.unidad}` : ''}
              {enOferta && (
                <span className="ml-1.5 rounded bg-red-50 px-1.5 py-0.5 text-[11px] font-semibold text-red-600">
                  oferta
                </span>
              )}
            </p>
          </div>

          <button
            onClick={() => onQuitar(item.id)}
            aria-label={`Quitar ${item.titulo}`}
            className="shrink-0 grid h-8 w-8 place-items-center rounded-lg text-slate-300 transition hover:bg-red-50 hover:text-red-600"
          >
            <IconoBasura className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 p-0.5">
            <button
              onClick={() => onCambiarCantidad(item.id, item.cantidad - 1)}
              aria-label="Restar una unidad"
              className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100"
            >
              <IconoMenos className="w-4 h-4" />
            </button>
            <span className="w-8 text-center text-sm font-semibold tabular-nums">
              {item.cantidad}
            </span>
            <button
              onClick={() => onCambiarCantidad(item.id, item.cantidad + 1)}
              aria-label="Sumar una unidad"
              className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100"
            >
              <IconoMas className="w-4 h-4" />
            </button>
          </div>

          <span className="text-sm font-bold text-slate-900">{formatearPrecio(subtotal)}</span>
        </div>

        {NEGOCIO.entrega.permitirNotasProducto && (
          <details className="mt-2 group">
            <summary className="cursor-pointer text-xs font-medium text-brand-700 hover:text-brand-800">
              {item.nota ? 'Editar aclaración' : 'Agregar aclaración'}
            </summary>
            <div className="mt-1.5">
              <AreaTexto
                filas={2}
                valor={item.nota}
                onChange={(v) => onNota(item.id, v)}
                placeholder="Ej: sin cebolla, cortado fino, sin sal…"
              />
            </div>
          </details>
        )}

        {item.nota && (
          <p className="mt-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600">
            “{item.nota}”
          </p>
        )}
      </div>
    </li>
  )
}
