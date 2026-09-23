import { NEGOCIO } from '../../config/negocio'
import { formatearPrecio } from '../../services/formato'
import { IconoCheck, IconoEfectivo, IconoTransferencia } from '../ui/Iconos'

/**
 * Paso 2 — forma de pago.
 * No hay cobro online ni datos bancarios en la web: el cliente sólo elige cómo
 * va a pagar y el local se entera por el mensaje de WhatsApp (si es
 * transferencia, desde el chat le pasa el alias).
 */
export default function PasoPago({ pago, onPago, total, entrega }) {
  const opciones = [
    NEGOCIO.pago.efectivo.habilitado && {
      clave: 'efectivo',
      icono: <IconoEfectivo className="w-5 h-5" />,
      titulo: 'Efectivo',
      detalle: NEGOCIO.pago.efectivo.detalle,
    },
    NEGOCIO.pago.transferencia.habilitado && {
      clave: 'transferencia',
      icono: <IconoTransferencia className="w-5 h-5" />,
      titulo: 'Transferencia',
      detalle: NEGOCIO.pago.transferencia.detalle,
    },
  ].filter(Boolean)

  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="sr-only">Forma de pago</legend>
        <div className="grid gap-2.5">
          {opciones.map((o) => {
            const activo = pago === o.clave
            return (
              <label
                key={o.clave}
                className={[
                  'flex cursor-pointer items-start gap-3.5 rounded-2xl border p-4 transition',
                  activo
                    ? 'border-brand-400 bg-brand-50/60 ring-2 ring-brand-100'
                    : 'border-slate-200 bg-white hover:border-slate-300',
                ].join(' ')}
              >
                <input
                  type="radio"
                  name="pago"
                  value={o.clave}
                  className="sr-only"
                  checked={activo}
                  onChange={() => onPago(o.clave)}
                />
                <span
                  className={[
                    'grid h-11 w-11 shrink-0 place-items-center rounded-xl',
                    activo ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500',
                  ].join(' ')}
                >
                  {o.icono}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">{o.titulo}</span>
                    {activo && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                        <IconoCheck className="w-3 h-3" /> Elegido
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-sm text-slate-600">{o.detalle}</span>
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <dl className="space-y-1.5 rounded-2xl bg-slate-50 p-4 text-sm">
        <div className="flex justify-between text-slate-600">
          <dt>Productos</dt>
          <dd className="tabular-nums">{formatearPrecio(total)}</dd>
        </div>
        <div className="flex justify-between text-slate-600">
          <dt>{entrega === 'envio' ? 'Envío' : 'Retiro en el local'}</dt>
          <dd>{entrega === 'envio' ? 'Según la dirección indicada' : NEGOCIO.entrega.retiro.direccion}</dd>
        </div>
      </dl>
    </div>
  )
}
