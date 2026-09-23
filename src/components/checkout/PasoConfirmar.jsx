import { formatearPrecio } from '../../services/formato'
import Boton from '../ui/Boton'
import { IconoEfectivo, IconoFlecha, IconoMoto, IconoTienda, IconoWhatsApp } from '../ui/Iconos'
import { NEGOCIO } from '../../config/negocio'

/**
 * Paso 3 — revisión final y envío a WhatsApp.
 * El botón principal es un <a href="wa.me/..."> real: si el navegador bloquea
 * ventanas emergentes, el link sigue funcionando.
 */
export default function PasoConfirmar({ pedido, url, onConfirmar, onVolver }) {
  const { cliente } = pedido
  const esEnvio = pedido.entrega === 'envio'

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <span className="font-mono text-xs font-semibold text-slate-500">{pedido.numeroOrden}</span>
          <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
            Pedido listo para enviar
          </span>
        </div>

        <ul className="divide-y divide-slate-100">
          {pedido.items.map((item) => (
            <li key={item.id} className="flex items-start gap-3 px-4 py-2.5">
              <span className="grid h-6 min-w-6 place-items-center rounded-md bg-slate-100 text-xs font-semibold text-slate-600">
                {item.cantidad}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm text-slate-800">{item.titulo}</span>
                {item.nota && <span className="block text-xs text-slate-500">Nota: {item.nota}</span>}
              </span>
              <span className="text-sm tabular-nums text-slate-700">
                {formatearPrecio(item.subtotalLinea)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="space-y-1.5 border-t border-slate-100 bg-slate-50/70 px-4 py-3 text-sm">
          <div className="flex justify-between text-slate-600">
            <dt>Subtotal</dt>
            <dd className="tabular-nums">{formatearPrecio(pedido.subtotal)}</dd>
          </div>
          {esEnvio && (
            <div className="flex justify-between text-slate-600">
              <dt>Envío</dt>
              <dd className="tabular-nums">
                {pedido.envio > 0 ? formatearPrecio(pedido.envio) : 'Sin cargo'}
              </dd>
            </div>
          )}
          <div className="flex justify-between pt-1 text-base font-bold text-slate-900">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatearPrecio(pedido.total)}</dd>
          </div>
        </dl>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Bloque
          icono={esEnvio ? <IconoMoto className="w-4 h-4" /> : <IconoTienda className="w-4 h-4" />}
          titulo={pedido.entregaTexto}
          lineas={[
            esEnvio ? cliente.direccion : NEGOCIO.entrega.retiro.direccion,
            esEnvio && cliente.referencia,
            cliente.horario,
          ].filter(Boolean)}
        />
        <Bloque
          icono={
            pedido.pago === 'efectivo' ? (
              <IconoEfectivo className="w-4 h-4" />
            ) : (
              <IconoWhatsApp className="w-4 h-4" />
            )
          }
          titulo={pedido.pagoTexto}
          lineas={[
            pedido.pago === 'transferencia'
              ? `Alias ${NEGOCIO.pago.transferencia.alias}`
              : NEGOCIO.pago.efectivo.detalle,
            pedido.pago === 'transferencia' ? 'Adjuntá el comprobante en el chat' : null,
          ].filter(Boolean)}
        />
      </div>

      <div className="rounded-2xl bg-slate-50 p-4 text-sm">
        <p className="font-medium text-slate-800">Datos de contacto</p>
        <p className="mt-1 text-slate-600">
          {cliente.nombre}
          {cliente.telefono && ` · ${cliente.telefono}`}
        </p>
        {cliente.aclaraciones && (
          <p className="mt-1 text-slate-500">Aclaraciones: {cliente.aclaraciones}</p>
        )}
      </div>

      <p className="text-xs text-slate-500">
        Al confirmar se abre WhatsApp con el pedido completo ya escrito. Revisalo y tocá enviar: el
        local te responde para coordinar {esEnvio ? 'la entrega' : 'el retiro'}.
      </p>

      <div className="flex flex-col-reverse gap-2 sm:flex-row">
        <Boton variante="secundario" onClick={onVolver} className="sm:w-auto">
          Volver
        </Boton>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onConfirmar}
          className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-6 text-base font-semibold text-white shadow-sm transition hover:bg-[#1eb355] active:bg-[#17914a]"
        >
          <IconoWhatsApp className="w-5 h-5" />
          Enviar pedido por WhatsApp
          <IconoFlecha className="w-4 h-4 opacity-80" />
        </a>
      </div>
    </div>
  )
}

function Bloque({ icono, titulo, lineas = [] }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-3.5">
      <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-50 text-brand-700">
          {icono}
        </span>
        {titulo}
      </p>
      <ul className="mt-1.5 space-y-0.5 pl-9 text-xs text-slate-500">
        {lineas.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
    </div>
  )
}
