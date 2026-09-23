import { NEGOCIO } from '../../config/negocio'
import { formatearPrecio } from '../../services/formato'
import { IconoMoto, IconoTienda } from '../ui/Iconos'

/**
 * Selector de modalidad de entrega: envío a domicilio o retiro en el local.
 * Sólo se muestran las opciones habilitadas en negocio.js
 */
export default function SelectorEntrega({ entrega, onCambiar }) {
  const { envio, retiro } = NEGOCIO.entrega

  const opciones = [
    envio.habilitado && {
      clave: 'envio',
      icono: <IconoMoto className="w-5 h-5" />,
      titulo: 'Envío a domicilio',
      detalle: `${formatearPrecio(envio.costo)} · ${envio.demora}`,
      extra: envio.zonas,
    },
    retiro.habilitado && {
      clave: 'retiro',
      icono: <IconoTienda className="w-5 h-5" />,
      titulo: 'Retiro en el local',
      detalle: retiro.demora,
      extra: `${retiro.direccion} · ${retiro.horarios}`,
    },
  ].filter(Boolean)

  if (opciones.length === 1) return null

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-slate-800">¿Cómo lo querés recibir?</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {opciones.map((o) => {
          const activo = entrega === o.clave
          return (
            <label
              key={o.clave}
              className={[
                'flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition',
                activo
                  ? 'border-brand-400 bg-brand-50/60 ring-2 ring-brand-100'
                  : 'border-slate-200 bg-white hover:border-slate-300',
              ].join(' ')}
            >
              <input
                type="radio"
                name="entrega"
                value={o.clave}
                checked={activo}
                onChange={() => onCambiar(o.clave)}
                className="sr-only"
              />
              <span
                className={[
                  'shrink-0 grid h-10 w-10 place-items-center rounded-xl',
                  activo ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500',
                ].join(' ')}
              >
                {o.icono}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-900">{o.titulo}</span>
                <span className="block text-xs text-slate-500">{o.detalle}</span>
                <span className="mt-0.5 block text-[11px] text-slate-400">{o.extra}</span>
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
