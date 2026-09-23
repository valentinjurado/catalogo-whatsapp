import { NEGOCIO } from '../config/negocio.js'

/**
 * ============================================================================
 *  ESTADO DEL PEDIDO (reducer puro)
 * ============================================================================
 *  Reglas de negocio encapsuladas acá:
 *   - Un producto se identifica por id: sumar el mismo producto incrementa.
 *   - Máximo por línea configurable; nunca menos de 1 (para eso está QUITAR).
 *   - Los precios guardados se refrescan si cambia la planilla (SINCRONIZAR).
 *
 *  PRIVACIDAD: todo esto vive en memoria. No se guarda nada en el dispositivo
 *  del cliente (ni localStorage, ni cookies, ni sessionStorage): si recarga la
 *  página, el pedido arranca vacío.
 */

export const MAX_POR_LINEA = 99

export const estadoInicial = {
  items: [],
  abierto: false,
  entrega: NEGOCIO.entrega.envio.habilitado ? 'envio' : 'retiro',
  pago: NEGOCIO.pago.efectivo.habilitado ? 'efectivo' : 'transferencia',
  datos: {
    nombre: '',
    telefono: '',
    direccion: '',
    referencia: '',
    horario: '',
    aclaraciones: '',
  },
  numeroOrden: null,
  ficha: null, // producto abierto en la ficha de detalle
}

/** Convierte un producto del menú en línea del pedido. */
export function lineaDesdeProducto(producto, cantidad = 1) {
  return {
    id: producto.id,
    titulo: producto.titulo,
    precio: producto.precio,
    precioOferta: producto.precioOferta ?? null,
    precioFinal: producto.precioFinal ?? producto.precio,
    urlImagen: producto.urlImagen,
    urlImagenAlt: producto.urlImagenAlt ?? null,
    unidad: producto.unidad,
    categoria: producto.categoria,
    sinStock: producto.sinStock,
    cantidad: Math.min(cantidad, MAX_POR_LINEA),
    nota: '',
  }
}

export function carritoReducer(estado, accion) {
  switch (accion.type) {
    case 'ABRIR':
      return { ...estado, abierto: true }
    case 'CERRAR':
      return { ...estado, abierto: false }

    case 'ABRIR_FICHA':
      return { ...estado, ficha: accion.producto }
    case 'CERRAR_FICHA':
      return { ...estado, ficha: null }

    case 'AGREGAR': {
      const existente = estado.items.find((i) => i.id === accion.producto.id)
      if (existente) {
        return {
          ...estado,
          items: estado.items.map((i) =>
            i.id === accion.producto.id
              ? { ...i, cantidad: Math.min(i.cantidad + (accion.cantidad || 1), MAX_POR_LINEA) }
              : i,
          ),
        }
      }
      return {
        ...estado,
        items: [...estado.items, lineaDesdeProducto(accion.producto, accion.cantidad || 1)],
      }
    }

    case 'CAMBIAR_CANTIDAD': {
      if (accion.cantidad <= 0) {
        return { ...estado, items: estado.items.filter((i) => i.id !== accion.id) }
      }
      return {
        ...estado,
        items: estado.items.map((i) =>
          i.id === accion.id
            ? { ...i, cantidad: Math.min(Math.round(accion.cantidad), MAX_POR_LINEA) }
            : i,
        ),
      }
    }

    case 'QUITAR':
      return { ...estado, items: estado.items.filter((i) => i.id !== accion.id) }

    case 'NOTA': {
      const nota = String(accion.nota || '').slice(0, 120)
      return {
        ...estado,
        items: estado.items.map((i) => (i.id === accion.id ? { ...i, nota } : i)),
      }
    }

    case 'VACIAR':
      return { ...estado, items: [], numeroOrden: null }

    case 'SET_ENTREGA':
      return { ...estado, entrega: accion.entrega }

    case 'SET_PAGO':
      return { ...estado, pago: accion.pago }

    case 'SET_DATOS':
      return { ...estado, datos: { ...estado.datos, ...accion.datos } }

    case 'SET_ORDEN':
      return { ...estado, numeroOrden: accion.numeroOrden }

    /**
     * Refresca precios/disponibilidad con la última versión del menú, conservando
     * cantidades y notas. Elimina productos que se dieron de baja.
     */
    case 'SINCRONIZAR': {
      const mapa = new Map(accion.productos.map((p) => [p.id, p]))
      const items = estado.items
        .map((item) => {
          const p = mapa.get(item.id)
          if (!p) return null
          return {
            ...item,
            titulo: p.titulo,
            precio: p.precio,
            precioOferta: p.precioOferta ?? null,
            precioFinal: p.precioFinal ?? p.precio,
            urlImagen: p.urlImagen,
            urlImagenAlt: p.urlImagenAlt ?? null,
            sinStock: p.sinStock,
          }
        })
        .filter(Boolean)
      return { ...estado, items }
    }

    default:
      return estado
  }
}
