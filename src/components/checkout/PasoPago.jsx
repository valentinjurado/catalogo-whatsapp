import { NEGOCIO } from '../../config/negocio'
import { formatearPrecio } from '../../services/formato'
import DatosTransferencia from './DatosTransferencia'
import { IconoCheck, IconoEfectivo, IconoTransferencia } from '../ui/Iconos'

/**
 * Paso 2 — forma de pago.
 * IMPORTANTE: no existe cobro online. Esta pantalla sólo informa cómo pagar
 * por fuera de la web (efectivo al recibir o transferencia bancaria).
 */
export default function PasoPago({ pago, onPago, total }) {
  const opciones = [
    NEGOCIO.pago.efectivo.habilitado && {
      clave: 'efectivo',
      icono: <IconoEfectivo className="w-5 h-5" />,
      titulo: 'Efectivo',
      detalle: NEGOCIO.pago.efectivo.detalle,
      nota: 'Se abona cuando recibís el pedido.',
    },
    NEGOCIO.pago.transferencia.habilitado && {
      clave: 'transferencia',
      icono: <IconoTransferencia className="w-5 h-5" />,
      titulo: 'Transferencia bancaria',
      detalle: `Alias ${NEGOCIO.pago.transferencia.alias}`,
      nota: 'Transferís desde tu banco y adjuntás el comprobante por WhatsApp.',
    },
  ].filter(Boolean)

  if (opciones.length === 1) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-500">
          Este local trabaja únicamente con <strong>{opciones[0].titulo}</strong>.
        </p>
        {opciones[0].clave === 'transferencia' && <DatosTransferencia total={total} />}
      </div>
    )
  }

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
                  <span className="mt-0.5 block text-xs text-slate-400">{o.nota}</span>
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      {pago === 'efectivo' ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600">
          <p className="font-medium text-slate-800">Pago en efectivo al recibir</p>
          <p className="mt-1">
            Total a abonar: <strong className="text-slate-900">{formatearPrecio(total)}</strong>. Si
            necesitás vuelto, avisanos en las aclaraciones del pedido.
          </p>
        </div>
      ) : (
        <DatosTransferencia total={total} />
      )}
    </div>
  )
}
