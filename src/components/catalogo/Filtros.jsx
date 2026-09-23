import { IconoBuscar, IconoCerrar } from '../ui/Iconos'

/**
 * Barra de búsqueda + filtros por categoría + orden.
 * Es "no controlada" del catálogo: recibe estado y avisa cambios.
 */
export default function Filtros({
  categorias,
  categoria,
  onCategoria,
  busqueda,
  onBusqueda,
  orden,
  onOrden,
  cantidadResultados,
  cantidadTotal,
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <IconoBuscar className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => onBusqueda(e.target.value)}
            placeholder="Buscar en el catálogo…"
            aria-label="Buscar productos"
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-10 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-50"
          />
          {busqueda && (
            <button
              onClick={() => onBusqueda('')}
              aria-label="Limpiar búsqueda"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
            >
              <IconoCerrar className="w-4 h-4" />
            </button>
          )}
        </div>

        <select
          value={orden}
          onChange={(e) => onOrden(e.target.value)}
          aria-label="Ordenar productos"
          className="h-12 rounded-2xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 transition focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-50"
        >
          <option value="recomendado">Recomendados</option>
          <option value="precio-asc">Menor precio</option>
          <option value="precio-desc">Mayor precio</option>
          <option value="nombre">Nombre (A-Z)</option>
        </select>
      </div>

      {categorias.length > 1 && (
        <div className="scroll-fino -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          <Chip activo={!categoria} onClick={() => onCategoria('')}>
            Todo ({cantidadTotal})
          </Chip>
          {categorias.map((c) => (
            <Chip key={c} activo={categoria === c} onClick={() => onCategoria(c)}>
              {c}
            </Chip>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-500">
        {cantidadResultados} {cantidadResultados === 1 ? 'producto' : 'productos'} disponibles
        {categoria && ` en ${categoria}`}
      </p>
    </div>
  )
}

function Chip({ children, activo, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={activo}
      className={[
        'shrink-0 rounded-full border px-3.5 h-9 text-sm font-medium transition',
        activo
          ? 'border-brand-600 bg-brand-600 text-white shadow-sm shadow-brand-600/20'
          : 'border-slate-200 bg-white text-slate-600 hover:border-brand-200 hover:text-brand-700',
      ].join(' ')}
    >
      {children}
    </button>
  )
}
