import { NEGOCIO } from '../../config/negocio'
import { formatearPrecio, telefonoLegible } from '../../services/formato'
import { urlConsulta } from '../../services/whatsapp'
import { IconoWhatsApp } from '../ui/Iconos'

export default function Footer() {
  const { marca, entrega, pago, whatsapp, textos } = NEGOCIO
  const anio = new Date().getFullYear()

  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
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
          <p className="mt-4 text-sm text-slate-600 leading-relaxed">{marca.descripcion}</p>
          <a
            href={urlConsulta()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 h-11 rounded-xl bg-[#25D366] px-4 text-sm font-medium text-white transition hover:bg-[#1eb355]"
          >
            <IconoWhatsApp className="w-4 h-4" />
            Escribirnos {telefonoLegible(whatsapp.numero)}
          </a>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-900">Entrega</h3>
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
            {pago.efectivo.habilitado && <li>Efectivo — {pago.efectivo.detalle}</li>}
            {pago.transferencia.habilitado && (
              <li>
                Transferencia
                <span className="block text-xs text-slate-400">
                  Alias {pago.transferencia.alias} · Titular {pago.transferencia.titular}
                </span>
              </li>
            )}
          </ul>
          <p className="mt-4 text-xs text-slate-400">{textos.avisoSinTarjetas}</p>
        </div>
      </div>

      <div className="border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-5 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between text-xs text-slate-400">
          <p>
            © {anio} {marca.nombre}. {textos.pieLegal}
          </p>
          <p>Sitio estático · Sin base de datos · Pedidos por WhatsApp</p>
        </div>
      </div>
    </footer>
  )
}
