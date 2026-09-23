import { formatearPrecio } from '../../services/formato'
import Boton from '../ui/Boton'
import ImagenProducto from '../ui/ImagenProducto'
import { IconoCarrito, IconoMas, IconoMenos } from '../ui/Iconos'

/**
 * Tarjeta de producto del menú.
 * - Tocar la foto o el título abre la ficha con ingredientes y detalle completo.
 * - Muestra precio de oferta tachando el original y el % de descuento.
 * - Si el producto ya está en el pedido, el botón se convierte en contador.
 * - Producto sin stock: se muestra agotado y no se puede agregar.
 */
export default function ProductCard({
  producto,
  cantidad = 0,
  prioridad = false,
  onAgregar,
  onCambiarCantidad,
  onAbrirFicha,
}) {
  const {
    titulo,
    descripcion,
    precio,
    precioOferta,
    precioFinal,
    categoria,
    urlImagen,
    unidad,
    sinStock,
    etiquetas = [],
  } = producto

  const descuento = precioOferta ? Math.round(((precio - precioOferta) / precio) * 100) : 0
  const enCarrito = cantidad > 0
  const tieneDetalle = Boolean(producto.ingredientes)

  return (
    <article
      className={[
        'tarjeta tarjeta-hover overflow-hidden flex flex-col anim-aparecer',
        sinStock ? 'opacity-70' : '',
      ].join(' ')}
    >
      <button
        type="button"
        onClick={() => onAbrirFicha?.(producto)}
        aria-label={`Ver detalle de ${titulo}`}
        className="relative block w-full text-left"
      >
        <ImagenProducto src={urlImagen} alt={titulo} prioridad={prioridad} />

        {descuento > 0 && !sinStock && (
          <span className="absolute top-3 left-3 rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
            -{descuento}%
          </span>
        )}

        {sinStock && (
          <span className="absolute inset-x-0 bottom-0 bg-slate-900/75 py-1.5 text-center text-xs font-semibold uppercase tracking-wide text-white">
            Sin stock
          </span>
        )}

        {etiquetas.length > 0 && (
          <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
            {etiquetas.slice(0, 2).map((e) => (
              <span
                key={e}
                className="rounded-full border border-white/60 bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-brand-700 backdrop-blur"
              >
                {e}
              </span>
            ))}
          </div>
        )}
      </button>

      <div className="flex flex-1 flex-col p-4">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-700/80">
          {categoria}
        </span>

        <h3 className="mt-1 font-semibold leading-snug text-slate-900">
          <button
            type="button"
            onClick={() => onAbrirFicha?.(producto)}
            className="text-left transition hover:text-brand-700"
          >
            {titulo}
          </button>
        </h3>

        {descripcion && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{descripcion}</p>}

        {tieneDetalle && (
          <button
            type="button"
            onClick={() => onAbrirFicha?.(producto)}
            className="mt-1.5 self-start text-xs font-medium text-brand-700 underline underline-offset-2 transition hover:text-brand-800"
          >
            Ver ingredientes
          </button>
        )}

        <div className="mt-auto pt-3.5 flex items-end justify-between gap-2">
          <div>
            {precioOferta && (
              <span className="block text-xs text-slate-400 line-through">
                {formatearPrecio(precio)}
              </span>
            )}
            <span className="text-lg font-bold text-slate-900">{formatearPrecio(precioFinal)}</span>
            {unidad && <span className="ml-1 text-xs text-slate-500">/ {unidad}</span>}
          </div>
        </div>

        <div className="mt-3.5">
          {sinStock ? (
            <Boton disabled variante="secundario" className="w-full">
              Agotado
            </Boton>
          ) : enCarrito ? (
            <div className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50/60 p-1">
              <button
                onClick={() => onCambiarCantidad(producto.id, cantidad - 1)}
                aria-label={`Quitar una unidad de ${titulo}`}
                className="grid h-9 w-9 place-items-center rounded-lg bg-white text-brand-700 shadow-sm transition hover:bg-brand-100"
              >
                <IconoMenos className="w-4 h-4" />
              </button>
              <span className="flex-1 text-center text-sm font-semibold text-brand-800">
                {cantidad} en el pedido
              </span>
              <button
                onClick={() => onCambiarCantidad(producto.id, cantidad + 1)}
                aria-label={`Agregar una unidad de ${titulo}`}
                className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-white shadow-sm transition hover:bg-brand-700"
              >
                <IconoMas className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Boton
              onClick={() => onAgregar(producto)}
              className="w-full"
              iconoIzq={<IconoCarrito className="w-4 h-4" />}
            >
              Agregar al pedido
            </Boton>
          )}
        </div>
      </div>
    </article>
  )
}
