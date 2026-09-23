/**
 * Botón único de la plantilla. Variantes y tamaños por clase, sin librerías.
 */
const VARIANTES = {
  primario:
    'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm shadow-brand-600/20',
  whatsapp: 'bg-[#25D366] text-white hover:bg-[#1eb355] active:bg-[#17914a] shadow-sm',
  secundario:
    'bg-white text-slate-800 border border-slate-200 hover:border-slate-300 hover:bg-slate-50',
  suave: 'bg-brand-50 text-brand-700 hover:bg-brand-100',
  fantasma: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  peligro: 'text-red-600 hover:bg-red-50',
}

const TAMANOS = {
  sm: 'h-9 px-3 text-sm gap-1.5 rounded-xl',
  md: 'h-11 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-5 text-base gap-2 rounded-2xl',
}

export default function Boton({
  children,
  variante = 'primario',
  tamano = 'md',
  className = '',
  cargando = false,
  iconoIzq = null,
  iconoDer = null,
  ...resto
}) {
  const deshabilitado = resto.disabled || cargando
  return (
    <button
      {...resto}
      disabled={deshabilitado}
      className={[
        'inline-flex items-center justify-center font-medium transition-all duration-150',
        'disabled:opacity-50 disabled:pointer-events-none select-none',
        VARIANTES[variante] || VARIANTES.primario,
        TAMANOS[tamano] || TAMANOS.md,
        className,
      ].join(' ')}
    >
      {cargando ? (
        <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : (
        iconoIzq
      )}
      {children}
      {!cargando && iconoDer}
    </button>
  )
}
