import { NEGOCIO } from '../config/negocio.js'

/**
 * ============================================================================
 *  LÓGICA DEL PEDIDO  —  totales, número de orden, validaciones
 * ============================================================================
 *  Funciones puras: no tocan React, no tocan la red. Fáciles de testear.
 */

/** Número de orden legible: PED-261004-7K3F (fecha + 4 caracteres aleatorios). */
export function generarNumeroOrden(prefijo = NEGOCIO.pedido.prefijoOrden) {
  const d = new Date()
  const fecha = [d.getFullYear(), d.getMonth() + 1, d.getDate()]
    .map((n) => String(n).padStart(2, '0'))
    .join('')
    .slice(2)
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sin caracteres ambiguos
  let sufijo = ''
  const azar = crypto.getRandomValues(new Uint8Array(4))
  for (const n of azar) sufijo += alfabeto[n % alfabeto.length]
  return `${prefijo}-${fecha}-${sufijo}`
}

/** ¿Corresponde envío gratis? */
export function envioGratis(subtotal) {
  const { gratisDesde } = NEGOCIO.entrega.envio
  return Number(gratisDesde) > 0 && subtotal >= Number(gratisDesde)
}

/**
 * Totales del pedido. El precio unitario SIEMPRE sale del catálogo
 * (nunca del navegador del cliente) para que nadie pueda alterar el total
 * editando el estado del carrito... salvo por el precio de la propia hoja.
 */
export function calcularTotales(items, entrega = 'envio') {
  const lineas = items.map((item) => ({
    ...item,
    precioUnitario: Number(item.precioFinal ?? item.precio ?? 0),
    subtotalLinea: Number(item.precioFinal ?? item.precio ?? 0) * item.cantidad,
    ahorroLinea:
      item.precioOferta && item.precio > item.precioOferta
        ? (item.precio - item.precioOferta) * item.cantidad
        : 0,
  }))

  const subtotal = lineas.reduce((acc, l) => acc + l.subtotalLinea, 0)
  const ahorro = lineas.reduce((acc, l) => acc + l.ahorroLinea, 0)
  const unidades = lineas.reduce((acc, l) => acc + l.cantidad, 0)

  const configEnvio = NEGOCIO.entrega.envio
  const usaEnvio = entrega === 'envio' && configEnvio.habilitado
  const costoEnvio = usaEnvio && !envioGratis(subtotal) ? Number(configEnvio.costo) || 0 : 0

  return {
    lineas,
    subtotal,
    ahorro,
    unidades,
    envio: costoEnvio,
    total: subtotal + costoEnvio,
  }
}

/** Cuánto falta para el envío gratis (0 = ya aplica o no hay promoción). */
export function faltaParaEnvioGratis(subtotal) {
  const { gratisDesde } = NEGOCIO.entrega.envio
  if (!Number(gratisDesde)) return 0
  return Math.max(0, Number(gratisDesde) - subtotal)
}

/**
 * Valida los datos del checkout.
 * @returns {{valido: boolean, errores: Record<string,string>}}
 */
export function validarCheckout({ items, entrega, pago, datos }) {
  const errores = {}
  const campos = NEGOCIO.pedido.campos
  const esEnvio = entrega === 'envio'

  if (!items.length) errores.items = 'El carrito está vacío.'

  if (NEGOCIO.pedido.minimo > 0) {
    const { subtotal } = calcularTotales(items, entrega)
    if (subtotal < NEGOCIO.pedido.minimo) {
      errores.items = `El mínimo de compra es de $ ${NEGOCIO.pedido.minimo}.`
    }
  }

  if (campos.nombre && String(datos.nombre || '').trim().length < 3) {
    errores.nombre = 'Ingresá tu nombre y apellido.'
  }

  if (campos.telefono) {
    const digitos = String(datos.telefono || '').replace(/\D/g, '')
    if (digitos.length < 8) errores.telefono = 'Ingresá un teléfono de contacto válido.'
  }

  const pideDireccion =
    esEnvio && NEGOCIO.entrega.envio.requiereDireccion && campos.direccion !== false
  if (pideDireccion && String(datos.direccion || '').trim().length < 5) {
    errores.direccion = 'Ingresá la calle, número y localidad.'
  }

  if (pago === 'transferencia' && !NEGOCIO.pago.transferencia.habilitado) {
    errores.pago = 'La transferencia no está disponible en este momento.'
  }
  if (pago === 'efectivo' && !NEGOCIO.pago.efectivo.habilitado) {
    errores.pago = 'El pago en efectivo no está disponible en este momento.'
  }

  return { valido: Object.keys(errores).length === 0, errores }
}

/** Descripción legible de la entrega (usada en la UI y en el mensaje). */
export function descripcionEntrega(entrega) {
  return entrega === 'envio' ? 'Envío a domicilio' : 'Retiro en el local'
}

/** Descripción legible del pago. */
export function descripcionPago(pago) {
  return pago === 'efectivo' ? 'Efectivo' : 'Transferencia bancaria'
}

/**
 * Arma el objeto Pedido final (una sola forma de pedido para toda la app).
 */
export function construirPedido({ numeroOrden, items, entrega, pago, datos }) {
  const totales = calcularTotales(items, entrega)
  return {
    numeroOrden,
    fecha: new Date(),
    items: totales.lineas,
    subtotal: totales.subtotal,
    ahorro: totales.ahorro,
    unidades: totales.unidades,
    envio: totales.envio,
    total: totales.total,
    envioGratis: entrega === 'envio' && envioGratis(totales.subtotal) && totales.envio === 0,
    entrega,
    entregaTexto: descripcionEntrega(entrega),
    pago,
    pagoTexto: descripcionPago(pago),
    cliente: {
      nombre: String(datos.nombre || '').trim(),
      telefono: String(datos.telefono || '').trim(),
      direccion: String(datos.direccion || '').trim(),
      referencia: String(datos.referencia || '').trim(),
      horario: String(datos.horario || '').trim(),
      aclaraciones: String(datos.aclaraciones || '').trim(),
    },
  }
}
