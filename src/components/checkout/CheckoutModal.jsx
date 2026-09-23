import { useMemo, useState } from 'react'
import Modal from '../ui/Modal'
import PasoDatos from './PasoDatos'
import PasoPago from './PasoPago'
import PantallaExito from './PantallaExito'
import { useCarrito } from '../../state/CarritoContext'
import { useToast } from '../ui/Toast'
import { NEGOCIO } from '../../config/negocio'
import { construirPedido, generarNumeroOrden, validarCheckout } from '../../services/pedido'
import { urlPedidoWhatsapp } from '../../services/whatsapp'
import { formatearPrecio } from '../../services/formato'
import { IconoWhatsApp } from '../ui/Iconos'

/**
 * <CheckoutModal> — dos pantallas y a WhatsApp:
 *
 *   Paso 1  datos y entrega   → valida y avanza
 *   Paso 2  forma de pago     → elige efectivo o transferencia
 *   Éxito                     → número de orden y acceso para reabrir WhatsApp
 *
 * El botón final es un enlace real a wa.me con el pedido ya escrito, así que
 * funciona aunque el navegador bloquee ventanas emergentes. No se procesa ningún
 * pago ni se publican datos bancarios.
 *
 * Se monta únicamente mientras está abierto (ver App.jsx): cada apertura arranca
 * con un número de orden nuevo y el flujo limpio.
 */
export default function CheckoutModal({ abierto, onCerrar }) {
  const carrito = useCarrito()
  const { avisar } = useToast()
  const [paso, setPaso] = useState(1)
  const [errores, setErrores] = useState({})
  const [pedidoEnviado, setPedidoEnviado] = useState(null)
  // El pedido se identifica por nombre y apellido. El número de pedido es
  // opcional (negocio.pedido.mostrarNumeroOrden) y solo se genera si está activo.
  const [numeroOrden] = useState(() =>
    NEGOCIO.pedido.mostrarNumeroOrden ? generarNumeroOrden() : null,
  )

  const { items, entrega, pago, datos, totales } = carrito

  // El pedido se arma una sola vez al entrar al paso de pago
  const pedido = useMemo(
    () => (paso === 2 ? construirPedido({ numeroOrden, items, entrega, pago, datos }) : null),
    [paso, numeroOrden, items, entrega, pago, datos],
  )

  const url = useMemo(() => (pedido ? urlPedidoWhatsapp(pedido) : '#'), [pedido])

  const continuarAPago = () => {
    const { errores: encontrados } = validarCheckout({ items, entrega, pago, datos })
    const soloDatos = {}
    for (const clave of ['nombre', 'telefono', 'direccion', 'items']) {
      if (encontrados[clave]) soloDatos[clave] = encontrados[clave]
    }
    setErrores(soloDatos)
    if (!Object.keys(soloDatos).length) setPaso(2)
  }

  const enviarPedido = () => {
    if (!pedido) return
    setPedidoEnviado(pedido)
    setPaso(3)
    avisar({
      titulo: 'Pedido enviado por WhatsApp',
      detalle: pedido.cliente.nombre,
      tono: 'ok',
    })
  }

  const nuevoPedido = () => {
    carrito.vaciar()
    setPedidoEnviado(null)
    onCerrar?.()
  }

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={paso === 3 ? 'Pedido enviado' : 'Finalizar pedido'}
      descripcion={paso === 2 ? 'Forma de pago' : undefined}
      anchoMax="max-w-xl"
      pie={
        paso === 1 ? (
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-slate-600">
              Total{' '}
              <strong className="tabular-nums text-slate-900">{formatearPrecio(totales.total)}</strong>
            </span>
            <div className="flex gap-2">
              <button
                onClick={onCerrar}
                className="h-11 rounded-xl px-4 text-sm text-slate-600 transition hover:bg-slate-100"
              >
                Seguir eligiendo
              </button>
              <button
                onClick={continuarAPago}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
              >
                Continuar
              </button>
            </div>
          </div>
        ) : paso === 2 ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              onClick={() => setPaso(1)}
              className="h-11 rounded-xl px-4 text-sm text-slate-600 transition hover:bg-slate-100"
            >
              Volver
            </button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={enviarPedido}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-6 text-base font-semibold text-white shadow-sm transition hover:bg-[#1eb355] active:bg-[#17914a] sm:flex-none"
            >
              <IconoWhatsApp className="w-5 h-5" />
              Enviar pedido
            </a>
          </div>
        ) : null
      }
    >
      {paso === 1 && (
        <PasoDatos
          entrega={entrega}
          datos={datos}
          errores={errores}
          onEntrega={carrito.setEntrega}
          onDatos={carrito.setDatos}
        />
      )}

      {paso === 2 && pedido && (
        <PasoPago
          pago={pago}
          onPago={carrito.setPago}
          total={totales.subtotal}
          entrega={entrega}
        />
      )}

      {paso === 3 && pedidoEnviado && (
        <PantallaExito
          pedido={pedidoEnviado}
          url={urlPedidoWhatsapp(pedidoEnviado)}
          onNuevoPedido={nuevoPedido}
          onCerrar={onCerrar}
        />
      )}
    </Modal>
  )
}
