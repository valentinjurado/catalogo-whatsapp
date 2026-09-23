import { useMemo, useState } from 'react'
import { normalizarTexto } from '../../services/formato'
import Filtros from './Filtros'
import ProductCard from './ProductCard'
import { ErrorCatalogo, GrillaSkeleton, SinResultados } from '../ui/Estados'
import { IconoRefrescar } from '../ui/Iconos'

/**
 * <Catalogo> — primera sección de la página: buscador, filtros y grilla del menú.
 * Recibe los datos ya resueltos (el fetch vive en useCatalogo) para que el
 * componente sea puro y fácil de testear.
 */
export default function Catalogo({
  productos = [],
  categorias = [],
  etiquetas = [],
  cargando = false,
  refrescando = false,
  error = null,
  avisos = [],
  actualizado = null,
  onRecargar,
  cantidadEnCarrito,
  onAgregar,
  onCambiarCantidad,
  onAbrirFicha,
}) {
  const [busqueda, setBusqueda] = useState('')
  const [categoria, setCategoria] = useState('')
  const [etiqueta, setEtiqueta] = useState('')
  const [orden, setOrden] = useState('recomendado')

  const visibles = useMemo(() => {
    const q = normalizarTexto(busqueda)
    let lista = productos.filter((p) => {
      if (categoria && p.categoria !== categoria) return false
      if (etiqueta && !p.etiquetas.includes(etiqueta)) return false
      if (!q) return true
      return (
        normalizarTexto(p.titulo).includes(q) ||
        normalizarTexto(p.descripcion).includes(q) ||
        normalizarTexto(p.ingredientes).includes(q) ||
        normalizarTexto(p.categoria).includes(q) ||
        p.etiquetas.some((e) => normalizarTexto(e).includes(q))
      )
    })

    if (orden === 'precio-asc') lista = [...lista].sort((a, b) => a.precioFinal - b.precioFinal)
    if (orden === 'precio-desc') lista = [...lista].sort((a, b) => b.precioFinal - a.precioFinal)
    if (orden === 'nombre')
      lista = [...lista].sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'))

    return lista
  }, [productos, busqueda, categoria, etiqueta, orden])

  const limpiarFiltros = () => {
    setBusqueda('')
    setCategoria('')
    setEtiqueta('')
  }

  return (
    <section id="menu" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Menú</h1>

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
                : 'Actualizar'
            }
          >
            <IconoRefrescar className={`w-4 h-4 ${refrescando ? 'animate-spin' : ''}`} />
            {refrescando ? 'Actualizando…' : 'Actualizar'}
          </button>
        )}
      </div>

      <div className="mt-5">
        <Filtros
          categorias={categorias}
          categoria={categoria}
          onCategoria={setCategoria}
          etiquetas={etiquetas}
          etiqueta={etiqueta}
          onEtiqueta={setEtiqueta}
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
          <SinResultados busqueda={busqueda || categoria || etiqueta} onLimpiar={limpiarFiltros} />
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
                onAbrirFicha={onAbrirFicha}
              />
            ))}
          </div>
        )}
      </div>

      {error && productos.length > 0 && (
        <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-xs text-amber-800">
          No pudimos actualizar el menú ({error}). Seguimos mostrando la última versión de esta
          visita; tocá “Actualizar” para reintentar.
        </p>
      )}
    </section>
  )
}
