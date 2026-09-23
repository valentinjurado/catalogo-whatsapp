import { formatearPrecio } from '../../services/formato'
import { pedidoComoTextoPlano } from '../../services/whatsapp'
import { useCopiar } from '../../hooks/useCopiar'
import Boton from '../ui/Boton'
import { IconoCheck, IconoCopiar, IconoWhatsApp } from '../ui/Iconos'

/** Cierre: número de orden y accesos por si el mensaje no se envió. */
export default function PantallaExito({ pedido, url, onNuevoPedido, onCerrar }) {
  const [copiar, copiado] = useCopiar()

  return (
    <div className="space-y-5 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
        <IconoCheck className="h-7 w-7" />
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-900">¡Listo!</h3>
        <p className="mt-1 text-sm text-slate-600">Se abrió WhatsApp con tu pedido.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">Número de pedido</p>
        <p className="mt-1 font-mono text-xl font-bold text-slate-900">{pedido.numeroOrden}</p>
        <p className="mt-1 text-xs text-slate-500">
          Total {formatearPrecio(pedido.total)} · {pedido.pagoTexto}
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-5 text-sm font-semibold text-white transition hover:bg-[#1eb355]"
        >
          <IconoWhatsApp className="w-4 h-4" />
          Abrir WhatsApp
        </a>
        <Boton
          variante="secundario"
          tamano="lg"
          onClick={() => copiar(pedidoComoTextoPlano(pedido), 'pedido')}
          iconoIzq={
            copiado === 'pedido' ? <IconoCheck className="w-4 h-4" /> : <IconoCopiar className="w-4 h-4" />
          }
        >
          {copiado === 'pedido' ? 'Copiado' : 'Copiar pedido'}
        </Boton>
      </div>

      <div className="flex flex-col items-center gap-2 pt-1">
        <button
          onClick={onNuevoPedido}
          className="text-sm font-medium text-brand-700 underline underline-offset-2 hover:text-brand-800"
        >
          Hacer otro pedido
        </button>
        <button onClick={onCerrar} className="text-xs text-slate-400 hover:text-slate-600">
          Seguir mirando el menú
        </button>
      </div>
    </div>
  )
}
