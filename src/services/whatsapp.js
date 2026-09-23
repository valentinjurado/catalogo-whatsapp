import { NEGOCIO } from '../config/negocio.js'
import { fechaLegible, formatearPrecio, limpiarTelefono } from './formato.js'

/**
 * ============================================================================
 *  GENERADOR DE MENSAJE / LINK DE WHATSAPP
 * ============================================================================
 *  La web NO cobra: arma un texto estructurado y abre WhatsApp con ese texto
 *  ya escrito. El vendedor lo recibe como un pedido listo para preparar.
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
  L.push('*Detalle del pedido*')
  pedido.items.forEach((item) => {
    const unidad = item.unidad ? ` (${item.unidad})` : ''
    L.push(`• ${item.cantidad} x ${item.titulo}${unidad} — ${formatearPrecio(item.subtotalLinea)}`)
    if (item.nota) L.push(`   ↳ Nota: ${item.nota}`)
  })
  L.push('')

  // ---- Totales ----
  L.push(`Subtotal (${pedido.unidades} ${pedido.unidades === 1 ? 'ítem' : 'ítems'}): ${formatearPrecio(pedido.subtotal)}`)
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
  L.push(`Modalidad: ${pedido.entregaTexto}`)
  if (pedido.entrega === 'retiro') {
    L.push(`Retiro en: ${negocio.entrega.retiro.direccion}`)
  } else if (cliente.direccion) {
    L.push(`Dirección: ${cliente.direccion}`)
    if (cliente.referencia) L.push(`Referencia: ${cliente.referencia}`)
  }
  if (cliente.horario) L.push(`Horario preferido: ${cliente.horario}`)
  L.push('')

  // ---- Pago (sin pasarela: se coordina por fuera) ----
  L.push('*Pago*')
  L.push(`Forma de pago: ${pedido.pagoTexto}`)
  if (pedido.pago === 'transferencia') {
    const t = negocio.pago.transferencia
    L.push(`Alias: ${t.alias}`)
    L.push(t.confirmacion + '.')
  } else {
    L.push(negocio.pago.efectivo.detalle)
  }
  L.push('')

  // ---- Cliente ----
  L.push('*Cliente*')
  L.push(`Nombre: ${cliente.nombre}`)
  if (cliente.telefono) L.push(`Teléfono: ${cliente.telefono}`)
  if (cliente.aclaraciones) L.push(`Aclaraciones: ${cliente.aclaraciones}`)
  L.push('')
  L.push('_Pedido generado automáticamente desde la web del catálogo._')

  return L.join('\n')
}

/** Link listo para abrir WhatsApp: https://wa.me/<numero>?text=<mensaje codificado> */
export function construirUrlWhatsapp(mensaje, numero = NEGOCIO.whatsapp.numero) {
  const destino = limpiarTelefono(numero)
  const codificado = encodeURIComponent(mensaje)
  // wa.me funciona en app y web; ?type=phone_number evita el cartel de "número desconocido"
  return `https://wa.me/${destino}?text=${codificado}`
}

/** Atajo: pedido completo → URL de WhatsApp */
export function urlPedidoWhatsapp(pedido, negocio = NEGOCIO) {
  return construirUrlWhatsapp(construirMensajePedido(pedido, negocio), negocio.whatsapp.numero)
}

/** Consulta rápida (botón flotante "¿Tenés dudas?") */
export function urlConsulta(mensaje = `¡Hola ${NEGOCIO.whatsapp.nombreVendedor}! Quería hacer una consulta sobre el catálogo.`) {
  return construirUrlWhatsapp(mensaje)
}

/**
 * Copia de respaldo del pedido en texto simple (para pegar en un correo o
 * guardar como comprobante del armado). Sin marcado de WhatsApp.
 */
export function pedidoComoTextoPlano(pedido, negocio = NEGOCIO) {
  return construirMensajePedido(pedido, negocio).replace(/\*/g, '').replace(/_/g, '')
}
