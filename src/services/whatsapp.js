import { NEGOCIO } from '../config/negocio.js'
import { fechaLegible, formatearPrecio, limpiarTelefono } from './formato.js'

/**
 * ============================================================================
 *  GENERADOR DE MENSAJE / LINK DE WHATSAPP
 * ============================================================================
 *  La web NO cobra y NO publica datos bancarios: arma un texto estructurado y
 *  abre WhatsApp con ese texto ya escrito. Si el cliente elige transferencia,
 *  el propio mensaje le avisa al local que tiene que pasar el alias.
 *
 *  Formato: *negrita* es el marcado nativo de WhatsApp.
 */

/** Construye el mensaje completo del pedido (texto plano, listo para enviar). */
export function construirMensajePedido(pedido, negocio = NEGOCIO) {
  const L = []
  const { cliente } = pedido

  L.push(`*NUEVO PEDIDO ${pedido.numeroOrden}*`)
  L.push(`${negocio.marca.nombre} — ${fechaLegible(pedido.fecha)}`)
  L.push('')

  // ---- Detalle ----
  L.push('*Detalle*')
  pedido.items.forEach((item) => {
    const unidad = item.unidad ? ` (${item.unidad})` : ''
    L.push(`• ${item.cantidad} x ${item.titulo}${unidad} — ${formatearPrecio(item.subtotalLinea)}`)
    if (item.nota) L.push(`   ↳ ${item.nota}`)
  })
  L.push('')

  // ---- Totales ----
  L.push(`Subtotal: ${formatearPrecio(pedido.subtotal)}`)
  if (pedido.entrega === 'envio') {
    L.push(
      pedido.envio > 0
        ? `Envío: ${formatearPrecio(pedido.envio)}`
        : `Envío: sin cargo${pedido.envioGratis ? ' (promoción)' : ''}`,
    )
  }
  if (pedido.ahorro > 0) L.push(`Ahorro por ofertas: -${formatearPrecio(pedido.ahorro)}`)
  L.push(`*TOTAL: ${formatearPrecio(pedido.total)}*`)
  L.push('')

  // ---- Entrega ----
  L.push('*Entrega*')
  L.push(`${pedido.entregaTexto}`)
  if (pedido.entrega === 'retiro') {
    L.push(`Retiro en: ${negocio.entrega.retiro.direccion}`)
  } else if (cliente.direccion) {
    L.push(`Dirección: ${cliente.direccion}`)
    if (cliente.referencia) L.push(`Referencia: ${cliente.referencia}`)
  }
  if (cliente.horario) L.push(`Horario: ${cliente.horario}`)
  L.push('')

  // ---- Pago (se coordina por fuera de la web) ----
  const pago = pedido.pago === 'transferencia' ? negocio.pago.transferencia : negocio.pago.efectivo
  L.push('*Pago*')
  L.push(pago.lineaMensaje)
  L.push('')

  // ---- Cliente ----
  L.push('*Cliente*')
  L.push(`${cliente.nombre}`)
  if (cliente.telefono) L.push(`Teléfono: ${cliente.telefono}`)
  if (cliente.aclaraciones) L.push(`Aclaraciones: ${cliente.aclaraciones}`)

  return L.join('\n')
}

/** Link listo para abrir WhatsApp: https://wa.me/<numero>?text=<mensaje codificado> */
export function construirUrlWhatsapp(mensaje, numero = NEGOCIO.whatsapp.numero) {
  const destino = limpiarTelefono(numero)
  // wa.me necesita el número en formato internacional (país + área + número).
  // Si detectamos un número local argentino (10 dígitos, sin 54), avisamos para
  // que no se pierda un pedido por un link mal armado.
  if (/^\d{10}$/.test(destino) && !destino.startsWith('54')) {
    console.warn(
      `[whatsapp] El número configurado ("${numero}") parece local. Para wa.me usá el formato ` +
        `internacional: 54 9 <área> <número> sin + ni espacios -> "549${destino}".`,
    )
  }
  return `https://wa.me/${destino}?text=${encodeURIComponent(mensaje)}`
}

/** Atajo: pedido completo → URL de WhatsApp */
export function urlPedidoWhatsapp(pedido, negocio = NEGOCIO) {
  return construirUrlWhatsapp(construirMensajePedido(pedido, negocio), negocio.whatsapp.numero)
}

/** Consulta rápida (botón de WhatsApp del encabezado y del pie) */
export function urlConsulta(
  mensaje = `¡Hola ${NEGOCIO.whatsapp.nombreVendedor}! Quería hacer una consulta.`,
) {
  return construirUrlWhatsapp(mensaje)
}

/** Copia del pedido sin marcado de WhatsApp (para guardar o pegar en otro lado). */
export function pedidoComoTextoPlano(pedido, negocio = NEGOCIO) {
  return construirMensajePedido(pedido, negocio).replace(/\*/g, '').replace(/_/g, '')
}
