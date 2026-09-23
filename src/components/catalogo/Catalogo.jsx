import { useMemo, useState } from 'react'
import { normalizarTexto } from '../../services/formato'
import Filtros from './Filtros'
import ProductCard from './ProductCard'
import { ErrorCatalogo, GrillaSkeleton, SinResultados } from '../ui/Estados'
import { IconoRefrescar } from '../ui/Iconos'

/**
 * <Catalogo> — sección principal: filtros + grilla de productos.
 * Recibe los datos ya resueltos (el fetch vive en useCatalogo) para que el
 * componente sea puro y fácil de testear.
 */
export default function Catalogo({
  productos = [],
  categorias = [],
  cargando = false,
  refrescando = false,
  error = null,
  avisos = [],
  actualizado = null,
  onRecargar,
  cantidadEnCarrito,
  onAgregar,
  onCambiarCantidad,
}) {
  const [busqueda, setBusqueda] = useState('')
  const [categoria, setCategoria] = useState('')
  const [orden, setOrden] = useState('recomendado')

  const visibles = useMemo(() => {
    const q = normalizarTexto(busqueda)
    let lista = productos.filter((p) => {
      const coincideCategoria = !categoria || p.categoria === categoria
      if (!coincideCategoria) return false
      if (!q) return true
      return (
        normalizarTexto(p.titulo).includes(q) ||
        normalizarTexto(p.descripcion).includes(q) ||
        normalizarTexto(p.categoria).includes(q) ||
        p.etiquetas.some((e) => normalizarTexto(e).includes(q))
      )
    })

    if (orden === 'precio-asc') lista = [...lista].sort((a, b) => a.precioFinal - b.precioFinal)
    if (orden === 'precio-desc') lista = [...lista].sort((a, b) => b.precioFinal - a.precioFinal)
    if (orden === 'nombre')
      lista = [...lista].sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'))

    return lista
  }, [productos, busqueda, categoria, orden])

  return (
    <section id="catalogo" className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Catálogo
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Tocá “Agregar al pedido” y al final confirmás por WhatsApp.
          </p>
        </div>

        {onRecargar && (
          <button
            onClick={onRecargar}
            disabled={refrescando}
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 transition hover:text-brand-700 disabled:opacity-60"
            title={
              actualizado
                ? `Actualizado ${new Date(actualizado).toLocaleTimeString('es-AR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`
                : 'Actualizar catálogo'
            }
          >
            <IconoRefrescar className={`w-4 h-4 ${refrescando ? 'animate-spin' : ''}`} />
            {refrescando ? 'Actualizando…' : 'Actualizar precios'}
          </button>
        )}
      </div>

      <div className="mt-6">
        <Filtros
          categorias={categorias}
          categoria={categoria}
          onCategoria={setCategoria}
          busqueda={busqueda}
          onBusqueda={setBusqueda}
          orden={orden}
          onOrden={setOrden}
          cantidadResultados={visibles.length}
          cantidadTotal={productos.length}
        />
      </div>

      {avisos.length > 0 && (
        <details className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-2.5 text-xs text-amber-800">
          <summary className="cursor-pointer font-medium">
            {avisos.length} aviso(s) sobre la planilla de productos
          </summary>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            {avisos.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </details>
      )}

      <div className="mt-6">
        {cargando ? (
          <GrillaSkeleton />
        ) : error && !productos.length ? (
          <ErrorCatalogo mensaje={error} onReintentar={onRecargar} />
        ) : visibles.length === 0 ? (
          <SinResultados
            busqueda={busqueda || categoria}
            onLimpiar={() => {
              setBusqueda('')
              setCategoria('')
            }}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {visibles.map((p, i) => (
              <ProductCard
                key={p.id}
                producto={p}
                prioridad={i < 4}
                cantidad={cantidadEnCarrito?.(p.id) || 0}
                onAgregar={onAgregar}
                onCambiarCantidad={onCambiarCantidad}
              />
            ))}
          </div>
        )}
      </div>

      {error && productos.length > 0 && (
        <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-xs text-amber-800">
          Mostrando el catálogo guardado en tu teléfono: {error}
        </p>
      )}
    </section>
  )
}
