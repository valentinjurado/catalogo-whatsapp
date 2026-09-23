import { NEGOCIO } from '../../config/negocio'
import { telefonoLegible } from '../../services/formato'
import { urlConsulta } from '../../services/whatsapp'
import Boton from '../ui/Boton'
import { IconoCarrito, IconoWhatsApp } from '../ui/Iconos'

/** Encabezado fijo: identidad del local + acceso al carrito. */
export default function Header({ cantidadTotal = 0, onAbrirCarrito }) {
  const { marca, whatsapp } = NEGOCIO

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <a href="#menu" className="flex min-w-0 items-center gap-3 group">
          {marca.logo ? (
            <img
              src={marca.logo}
              alt={marca.nombre}
              className="h-10 w-10 rounded-xl border border-slate-200 object-cover"
            />
          ) : (
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-600 text-lg font-semibold text-white">
              {marca.nombre.charAt(0)}
            </span>
          )}
          <span className="min-w-0">
            <span className="block truncate font-semibold leading-tight text-slate-900 transition group-hover:text-brand-700">
              {marca.nombre}
            </span>
            <span className="hidden truncate text-xs leading-tight text-slate-500 sm:block">
              {marca.eslogan}
            </span>
          </span>
        </a>

        <div className="ml-auto flex items-center gap-2">
          <a
            href={urlConsulta()}
            target="_blank"
            rel="noopener noreferrer"
            title={`WhatsApp ${telefonoLegible(whatsapp.numero)}`}
            className="hidden h-11 items-center gap-2 rounded-xl px-3 text-sm text-slate-600 transition hover:bg-slate-100 md:flex"
          >
            <IconoWhatsApp className="h-4 w-4 text-[#25D366]" />
            WhatsApp
          </a>

          <Boton
            onClick={onAbrirCarrito}
            variante="primario"
            className="relative"
            aria-label={`Ver mi pedido, ${cantidadTotal} productos`}
          >
            <IconoCarrito className="h-5 w-5" />
            <span className="hidden sm:inline">Mi pedido</span>
            {cantidadTotal > 0 && (
              <span className="ml-1 grid h-6 min-w-6 place-items-center rounded-full bg-white px-1.5 text-xs font-bold text-brand-700 anim-latido">
                {cantidadTotal}
              </span>
            )}
          </Boton>
        </div>
      </div>
    </header>
  )
}
