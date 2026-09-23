import { NEGOCIO } from '../../config/negocio'
import { telefonoLegible } from '../../services/formato'
import { urlConsulta } from '../../services/whatsapp'
import Boton from '../ui/Boton'
import { IconoCarrito, IconoWhatsApp } from '../ui/Iconos'

/**
 * Encabezado fijo: identidad del negocio + acceso al carrito.
 * El botón del carrito aparece siempre (también en mobile) porque es el CTA.
 */
export default function Header({ cantidadTotal = 0, onAbrirCarrito }) {
  const { marca, whatsapp } = NEGOCIO

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center gap-3">
        {/* Logo */}
        <a href="#catalogo" className="flex items-center gap-3 min-w-0 group">
          {marca.logo ? (
            <img
              src={marca.logo}
              alt={marca.nombre}
              className="h-10 w-10 rounded-xl object-cover border border-slate-200"
            />
          ) : (
            <span className="h-10 w-10 shrink-0 grid place-items-center rounded-xl bg-brand-600 text-white font-semibold text-lg">
              {marca.nombre.charAt(0)}
            </span>
          )}
          <span className="min-w-0">
            <span className="block truncate font-semibold text-slate-900 leading-tight group-hover:text-brand-700 transition">
              {marca.nombre}
            </span>
            <span className="hidden sm:block truncate text-xs text-slate-500 leading-tight">
              {marca.eslogan}
            </span>
          </span>
        </a>

        <div className="ml-auto flex items-center gap-2">
          <a
            href={urlConsulta()}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-2 h-11 px-3 rounded-xl text-sm text-slate-600 hover:bg-slate-100 transition"
            title={`WhatsApp ${telefonoLegible(whatsapp.numero)}`}
          >
            <IconoWhatsApp className="w-4 h-4 text-[#25D366]" />
            {telefonoLegible(whatsapp.numero)}
          </a>

          <Boton
            onClick={onAbrirCarrito}
            variante="primario"
            className="relative"
            aria-label={`Ver mi pedido, ${cantidadTotal} productos`}
          >
            <IconoCarrito className="w-5 h-5" />
            <span className="hidden sm:inline">Mi pedido</span>
            {cantidadTotal > 0 && (
              <span className="ml-1 min-w-6 h-6 px-1.5 grid place-items-center rounded-full bg-white text-brand-700 text-xs font-bold anim-latido">
                {cantidadTotal}
              </span>
            )}
          </Boton>
        </div>
      </div>
    </header>
  )
}
