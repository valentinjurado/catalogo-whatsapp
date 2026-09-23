import { IconoBuscar, IconoRefrescar } from './Iconos'
import Boton from './Boton'

/** Tarjeta fantasma mientras se carga el catálogo (evita saltos de layout). */
export function SkeletonTarjeta() {
  return (
    <div className="tarjeta overflow-hidden">
      <div className="aspect-[4/3] animate-pulse bg-slate-100" />
      <div className="p-4 space-y-2.5">
        <div className="h-4 w-3/4 rounded bg-slate-100 animate-pulse" />
        <div className="h-3 w-full rounded bg-slate-100 animate-pulse" />
        <div className="h-3 w-2/3 rounded bg-slate-100 animate-pulse" />
        <div className="h-9 w-full rounded-xl bg-slate-100 animate-pulse mt-3" />
      </div>
    </div>
  )
}

export function GrillaSkeleton({ cantidad = 8 }) {
  return (
    <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: cantidad }).map((_, i) => (
        <SkeletonTarjeta key={i} />
      ))}
    </div>
  )
}

/** Sin resultados de búsqueda / categoría vacía. */
export function SinResultados({ busqueda, onLimpiar }) {
  return (
    <div className="tarjeta py-16 px-6 text-center">
      <span className="mx-auto grid place-items-center w-12 h-12 rounded-2xl bg-slate-100 text-slate-400">
        <IconoBuscar className="w-6 h-6" />
      </span>
      <h3 className="mt-4 text-base font-semibold text-slate-800">Sin resultados</h3>
      <p className="mt-1 text-sm text-slate-500">
        No encontramos productos para “{busqueda}”. Probá con otra palabra o mirá todo el catálogo.
      </p>
      <Boton variante="secundario" tamano="sm" className="mt-5" onClick={onLimpiar}>
        Ver todo el catálogo
      </Boton>
    </div>
  )
}

/** Error de conexión con la planilla. */
export function ErrorCatalogo({ mensaje, onReintentar }) {
  return (
    <div className="tarjeta border-red-100 bg-red-50/40 py-12 px-6 text-center">
      <h3 className="text-base font-semibold text-slate-800">No pudimos cargar el catálogo</h3>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-600">{mensaje}</p>
      <Boton
        variante="secundario"
        tamano="sm"
        className="mt-5"
        onClick={onReintentar}
        iconoIzq={<IconoRefrescar className="w-4 h-4" />}
      >
        Reintentar
      </Boton>
    </div>
  )
}
