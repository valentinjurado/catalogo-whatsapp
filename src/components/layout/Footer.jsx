import { NEGOCIO } from '../../config/negocio'
import { formatearPrecio } from '../../services/formato'
import { urlConsulta } from '../../services/whatsapp'
import { IconoWhatsApp } from '../ui/Iconos'

/**
 * Pie de página con la información real del local. Sin notas técnicas ni
 * aclaraciones de funcionamiento (esto se muestra a un cliente final).
 */
export default function Footer() {
  const { marca, entrega, pago, whatsapp, textos } = NEGOCIO
  const anio = new Date().getFullYear()

  return (
    <footer className="mt-14 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-3 sm:px-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="h-10 w-10 grid place-items-center rounded-xl bg-brand-600 text-white font-semibold">
              {marca.nombre.charAt(0)}
            </span>
            <div>
              <p className="font-semibold text-slate-900">{marca.nombre}</p>
              <p className="text-xs text-slate-500">{marca.eslogan}</p>
            </div>
          </div>
          <a
            href={urlConsulta()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 h-11 rounded-xl bg-[#25D366] px-4 text-sm font-medium text-white transition hover:bg-[#1eb355]"
          >
            <IconoWhatsApp className="w-4 h-4" />
            Escribinos por WhatsApp
          </a>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-900">Envíos y retiro</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {entrega.envio.habilitado && (
              <li>
                Envío a domicilio — {formatearPrecio(entrega.envio.costo)}
                {entrega.envio.gratisDesde
                  ? ` (sin cargo desde ${formatearPrecio(entrega.envio.gratisDesde)})`
                  : ''}
                <span className="block text-xs text-slate-400">{entrega.envio.zonas}</span>
              </li>
            )}
            {entrega.retiro.habilitado && (
              <li>
                Retiro en {entrega.retiro.direccion}
                <span className="block text-xs text-slate-400">{entrega.retiro.horarios}</span>
              </li>
            )}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-900">Formas de pago</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {pago.efectivo.habilitado && <li>Efectivo</li>}
            {pago.transferencia.habilitado && <li>Transferencia bancaria</li>}
          </ul>
          {whatsapp.numero && (
            <p className="mt-4 text-xs text-slate-400">
              Pedidos al {whatsapp.numero.replace(/^54/, '+54 ').replace(/^(\+54 \d)(\d)/, '$1 $2')}
            </p>
          )}
        </div>
      </div>

      <div className="border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-4 py-5 text-xs text-slate-400 sm:px-6">
          © {anio} {marca.nombre}. {textos.pieLegal}
        </div>
      </div>
    </footer>
  )
}
