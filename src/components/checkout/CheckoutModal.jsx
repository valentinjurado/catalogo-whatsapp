import { useMemo, useState } from 'react'
import Modal from '../ui/Modal'
import PasoDatos from './PasoDatos'
import PasoPago from './PasoPago'
import PasoConfirmar from './PasoConfirmar'
import PantallaExito from './PantallaExito'
import { useCarrito } from '../../state/CarritoContext'
import { useToast } from '../ui/Toast'
import {
  construirPedido,
  generarNumeroOrden,
  validarCheckout,
} from '../../services/pedido'
import { urlPedidoWhatsapp } from '../../services/whatsapp'

const PASOS = [
  { numero: 1, titulo: 'Datos y entrega' },
  { numero: 2, titulo: 'Forma de pago' },
  { numero: 3, titulo: 'Confirmar' },
]

/**
 * <CheckoutModal> — embudo de venta en 3 pasos + pantalla de éxito.
 *
 *   Paso 1  datos y entrega  → valida y avanza
 *   Paso 2  forma de pago    → efectivo o transferencia (datos para copiar)
 *   Paso 3  confirmar        → resumen + link wa.me con el mensaje codificado
 *   Éxito                    → número de orden, reabrir WhatsApp, copiar resumen
 *
 * No se procesa ningún pago: sólo se arma el pedido y se abre WhatsApp.
 * Se monta únicamente mientras está abierto (ver App.jsx), así que el flujo
 * arranca limpio en cada apertura sin efectos de reinicio.
 */
export default function CheckoutModal({ abierto, onCerrar }) {
  const carrito = useCarrito()
  const { avisar } = useToast()
  const [paso, setPaso] = useState(1)
  const [errores, setErrores] = useState({})
  const [pedidoGuardado, setPedidoGuardado] = useState(null)

  const { items, entrega, pago, datos, totales, numeroOrden } = carrito

  const validarPaso1 = () => {
    const { errores: encontrados } = validarCheckout({ items, entrega, pago, datos })
    const soloDatos = {}
    for (const clave of ['nombre', 'telefono', 'direccion', 'items']) {
      if (encontrados[clave]) soloDatos[clave] = encontrados[clave]
    }
    setErrores(soloDatos)
    return Object.keys(soloDatos).length === 0
  }

  const irAPaso2 = () => {
    if (validarPaso1()) setPaso(2)
  }

  // Borrador del pedido: se construye al entrar al paso 3 (una sola vez)
  const pedido = useMemo(() => {
    if (paso < 3) return null
    return construirPedido({
      numeroOrden: numeroOrden || generarNumeroOrden(),
      items,
      entrega,
      pago,
      datos,
    })
  }, [paso, numeroOrden, items, entrega, pago, datos])

  const url = useMemo(() => (pedido ? urlPedidoWhatsapp(pedido) : '#'), [pedido])

  const confirmarPedido = () => {
    if (!pedido) return
    // Guardamos el número de orden para que el cliente lo tenga a mano
    carrito.setNumeroOrden(pedido.numeroOrden)
    setPedidoGuardado(pedido)
    setPaso(4)
    avisar({
      titulo: 'Pedido enviado a WhatsApp',
      detalle: `${pedido.numeroOrden} · ${pedido.items.length} producto(s)`,
      tono: 'ok',
    })
  }

  const nuevoPedido = () => {
    carrito.vaciar()
    setPedidoGuardado(null)
    setPaso(1)
    onCerrar?.()
  }

  const titulo = paso === 4 ? 'Pedido enviado' : 'Finalizar pedido'

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={titulo}
      descripcion={paso < 4 ? PASOS[paso - 1]?.titulo : undefined}
      anchoMax={paso === 3 || paso === 4 ? 'max-w-xl' : 'max-w-2xl'}
      pie={
        paso === 1 ? (
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-slate-600">
              Total{' '}
              <strong className="tabular-nums text-slate-900">
                {new Intl.NumberFormat('es-AR', {
                  style: 'currency',
                  currency: 'ARS',
                }).format(totales.total)}
              </strong>
            </span>
            <div className="flex gap-2">
              <button
                onClick={onCerrar}
                className="h-11 rounded-xl px-4 text-sm text-slate-600 transition hover:bg-slate-100"
              >
                Seguir comprando
              </button>
              <BotonSiguiente onClick={irAPaso2}>Elegir forma de pago</BotonSiguiente>
            </div>
          </div>
        ) : paso === 2 ? (
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setPaso(1)}
              className="h-11 rounded-xl px-4 text-sm text-slate-600 transition hover:bg-slate-100"
            >
              Volver
            </button>
            <BotonSiguiente onClick={() => setPaso(3)}>Revisar y confirmar</BotonSiguiente>
          </div>
        ) : null
      }
    >
      {/* Indicador de pasos */}
      {paso < 4 && (
        <ol className="mb-6 flex items-center gap-2">
          {PASOS.map((p, i) => {
            const activo = paso === p.numero
            const hecho = paso > p.numero
            return (
              <li key={p.numero} className="flex flex-1 items-center gap-2">
                <span
                  className={[
                    'grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold transition',
                    hecho
                      ? 'bg-brand-600 text-white'
                      : activo
                        ? 'bg-brand-600 text-white ring-4 ring-brand-100'
                        : 'bg-slate-100 text-slate-500',
                  ].join(' ')}
                >
                  {p.numero}
                </span>
                <span
                  className={[
                    'hidden text-xs font-medium sm:block',
                    activo || hecho ? 'text-slate-800' : 'text-slate-400',
                  ].join(' ')}
                >
                  {p.titulo}
                </span>
                {i < PASOS.length - 1 && (
                  <span className="ml-auto hidden h-px flex-1 bg-slate-200 sm:block" />
                )}
              </li>
            )
          })}
        </ol>
      )}

      {paso === 1 && (
        <PasoDatos
          entrega={entrega}
          datos={datos}
          errores={errores}
          onEntrega={carrito.setEntrega}
          onDatos={carrito.setDatos}
        />
      )}

      {paso === 2 && (
        <PasoPago
          pago={pago}
          onPago={carrito.setPago}
          total={totales.total}
          entrega={entrega}
        />
      )}

      {paso === 3 && pedido && (
        <PasoConfirmar
          pedido={pedido}
          url={url}
          onConfirmar={confirmarPedido}
          onVolver={() => setPaso(2)}
        />
      )}

      {paso === 4 && pedidoGuardado && (
        <PantallaExito
          pedido={pedidoGuardado}
          url={urlPedidoWhatsapp(pedidoGuardado)}
          onNuevoPedido={nuevoPedido}
          onCerrar={onCerrar}
        />
      )}
    </Modal>
  )
}

function BotonSiguiente({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 active:bg-brand-800"
    >
      {children}
    </button>
  )
}
