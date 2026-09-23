import { useState } from 'react'
import { NEGOCIO } from '../../config/negocio'
import { formatearPrecio } from '../../services/formato'
import { useCopiar } from '../../hooks/useCopiar'
import { IconoCheck, IconoCopiar, IconoEscudo } from '../ui/Iconos'

/**
 * Panel estático con los datos de transferencia + botones para copiar.
 * No hay pasarela ni formulario de tarjeta: el cliente transfiere desde su
 * home banking y adjunta el comprobante en el chat de WhatsApp.
 */
export default function DatosTransferencia({ total }) {
  const t = NEGOCIO.pago.transferencia
  const [copiar, copiado, fallo] = useCopiar()
  const [confirmo, setConfirmo] = useState(false)

  const filas = [
    { clave: 'alias', label: 'Alias', valor: t.alias, copiable: true, destacado: true },
    { clave: 'cbu', label: 'CBU / CVU', valor: t.cbu, copiable: true },
    { clave: 'titular', label: 'Titular', valor: t.titular },
    ...(t.banco ? [{ clave: 'banco', label: 'Banco', valor: t.banco }] : []),
    ...(t.cuit ? [{ clave: 'cuit', label: 'CUIT', valor: t.cuit }] : []),
    { clave: 'monto', label: 'Importe a transferir', valor: formatearPrecio(total), copiable: true, destacado: true },
  ]

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-brand-800">
          <IconoEscudo className="w-4 h-4" />
          Transferencia bancaria
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-brand-900/80">{t.aviso}</p>
      </div>

      <dl className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {filas.map((fila, i) => (
          <div
            key={fila.clave}
            className={[
              'flex flex-wrap items-center gap-3 px-4 py-3',
              i > 0 ? 'border-t border-slate-100' : '',
              fila.destacado ? 'bg-slate-50/70' : '',
            ].join(' ')}
          >
            <dt className="w-32 shrink-0 text-xs uppercase tracking-wide text-slate-500">
              {fila.label}
            </dt>
            <dd
              className={[
                'min-w-0 flex-1 truncate font-mono',
                fila.destacado ? 'text-sm font-bold text-slate-900' : 'text-sm text-slate-700',
              ].join(' ')}
            >
              {fila.valor}
            </dd>
            {fila.copiable && (
              <button
                type="button"
                onClick={() => copiar(String(fila.valor), fila.clave)}
                className={[
                  'inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition',
                  copiado === fila.clave
                    ? 'border-brand-200 bg-brand-50 text-brand-700'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50',
                ].join(' ')}
                aria-label={`Copiar ${fila.label}`}
              >
                {copiado === fila.clave ? (
                  <>
                    <IconoCheck className="w-3.5 h-3.5" /> Copiado
                  </>
                ) : (
                  <>
                    <IconoCopiar className="w-3.5 h-3.5" /> Copiar
                  </>
                )}
              </button>
            )}
            {fallo === fila.clave && (
              <p className="w-full pt-1 text-[11px] text-amber-700">
                Tu navegador bloqueó el copiado automático: seleccioná el texto con el dedo (o
                Ctrl+C) para copiarlo.
              </p>
            )}
          </div>
        ))}
      </dl>

      <ol className="space-y-2 text-sm text-slate-600">
        <li className="flex gap-2.5">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
            1
          </span>
          Abrí la app de tu banco y transferí el importe exacto al alias de arriba.
        </li>
        <li className="flex gap-2.5">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
            2
          </span>
          Guardá o sacá una foto del comprobante.
        </li>
        <li className="flex gap-2.5">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
            3
          </span>
          Al confirmar, WhatsApp se abre con el pedido escrito: adjuntá ahí el comprobante.
        </li>
      </ol>

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-3.5 transition hover:border-brand-200">
        <input
          type="checkbox"
          checked={confirmo}
          onChange={(e) => setConfirmo(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[var(--brand-600)]"
        />
        <span className="text-sm text-slate-700">
          Entiendo que debo transferir el importe y adjuntar el comprobante en el chat.
        </span>
      </label>
    </div>
  )
}
