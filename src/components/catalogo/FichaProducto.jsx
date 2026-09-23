import { useState } from 'react'
import { formatearPrecio } from '../../services/formato'
import ImagenProducto from '../ui/ImagenProducto'
import Modal from '../ui/Modal'
import Boton from '../ui/Boton'
import { IconoCarrito, IconoMas, IconoMenos } from '../ui/Iconos'

/**
 * Ficha del producto: se abre al tocar una tarjeta y muestra todo lo que no
 * entra en la grilla (descripción completa, ingredientes, composición, etc.).
 * Mantiene el mismo estado global del pedido, así que no hay dos carritos.
 */
export default function FichaProducto({ producto, cantidad = 0, onCerrar, onAgregar }) {
  const [cantidadElegida, setCantidadElegida] = useState(1)
  if (!producto) return null

  const { titulo, descripcion, ingredientes, precio, precioOferta, precioFinal, categoria, unidad, etiquetas, sinStock, urlImagen } =
    producto
  const descuento = precioOferta ? Math.round(((precio - precioOferta) / precio) * 100) : 0

  return (
    <Modal
      abierto
      onCerrar={onCerrar}
      titulo={titulo}
      descripcion={categoria}
      anchoMax="max-w-2xl"
      pie={
        sinStock ? (
          <p className="text-center text-sm font-medium text-slate-500">Por ahora no hay stock</p>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex items-center gap-1 self-start rounded-xl border border-slate-200 p-0.5">
              <button
                onClick={() => setCantidadElegida((n) => Math.max(1, n - 1))}
                aria-label="Restar una unidad"
                className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100"
              >
                <IconoMenos className="w-4 h-4" />
              </button>
              <span className="w-9 text-center text-sm font-semibold tabular-nums">
                {cantidadElegida}
              </span>
              <button
                onClick={() => setCantidadElegida((n) => Math.min(99, n + 1))}
                aria-label="Sumar una unidad"
                className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100"
              >
                <IconoMas className="w-4 h-4" />
              </button>
            </div>

            <Boton
              tamano="lg"
              className="flex-1 sm:flex-none"
              iconoIzq={<IconoCarrito className="w-5 h-5" />}
              onClick={() => onAgregar(producto, cantidadElegida)}
            >
              Agregar {formatearPrecio(precioFinal * cantidadElegida)}
            </Boton>
          </div>
        )
      }
    >
      <div className="space-y-5">
        <ImagenProducto src={urlImagen} alt={titulo} proporcion="aspect-[16/10]" prioridad className="rounded-2xl" />

        <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
          {precioOferta && (
            <span className="text-sm text-slate-400 line-through">{formatearPrecio(precio)}</span>
          )}
          <span className="text-2xl font-bold text-slate-900">{formatearPrecio(precioFinal)}</span>
          {unidad && <span className="text-sm text-slate-500">/ {unidad}</span>}
          {descuento > 0 && (
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600">
              -{descuento}% de descuento
            </span>
          )}
        </div>

        {etiquetas?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {etiquetas.map((e) => (
              <span
                key={e}
                className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700"
              >
                {e}
              </span>
            ))}
          </div>
        )}

        {descripcion && <p className="text-sm leading-relaxed text-slate-600">{descripcion}</p>}

        {ingredientes && (
          <div className="rounded-2xl bg-slate-50 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Ingredientes
            </h3>
            <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-slate-700">
              {ingredientes}
            </p>
          </div>
        )}

        {!ingredientes && !descripcion && (
          <p className="text-sm text-slate-500">Este producto no tiene detalle cargado.</p>
        )}

        {cantidad > 0 && (
          <p className="text-xs text-slate-500">
            Ya tenés {cantidad} en el pedido. Si agregás más, se suman.
          </p>
        )}
      </div>
    </Modal>
  )
}
