import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react'
import { carritoReducer, estadoInicial } from './carritoReducer'
import { calcularTotales } from '../services/pedido'

/**
 * ============================================================================
 *  PEDIDO GLOBAL  (Context + useReducer)
 * ============================================================================
 *  Uso:
 *    const { items, totales, agregar, abrir } = useCarrito()
 *
 *  PRIVACIDAD: el estado vive SOLO en memoria. No se escribe nada en el
 *  dispositivo del cliente (localStorage, cookies ni sessionStorage); si
 *  recarga la página, el pedido arranca vacío. El número de pedido y los datos
 *  cargados tampoco se guardan: viajan únicamente en el mensaje de WhatsApp.
 */

const CarritoContext = createContext(null)

export function CarritoProvider({ children }) {
  const [estado, dispatch] = useReducer(carritoReducer, estadoInicial)

  // Bloquear el scroll del fondo cuando el panel, el modal o la ficha están abiertos
  const hayCapa = estado.abierto || Boolean(estado.ficha)
  useEffect(() => {
    document.body.style.overflow = hayCapa ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [hayCapa])

  const totales = useMemo(
    () => calcularTotales(estado.items, estado.entrega),
    [estado.items, estado.entrega],
  )

  const cantidadEnCarrito = useCallback(
    (id) => estado.items.find((i) => i.id === id)?.cantidad || 0,
    [estado.items],
  )

  const acciones = useMemo(
    () => ({
      agregar: (producto, cantidad = 1) => dispatch({ type: 'AGREGAR', producto, cantidad }),
      cambiarCantidad: (id, cantidad) => dispatch({ type: 'CAMBIAR_CANTIDAD', id, cantidad }),
      quitar: (id) => dispatch({ type: 'QUITAR', id }),
      ponerNota: (id, nota) => dispatch({ type: 'NOTA', id, nota }),
      vaciar: () => dispatch({ type: 'VACIAR' }),
      abrir: () => dispatch({ type: 'ABRIR' }),
      cerrar: () => dispatch({ type: 'CERRAR' }),
      abrirFicha: (producto) => dispatch({ type: 'ABRIR_FICHA', producto }),
      cerrarFicha: () => dispatch({ type: 'CERRAR_FICHA' }),
      setEntrega: (entrega) => dispatch({ type: 'SET_ENTREGA', entrega }),
      setPago: (pago) => dispatch({ type: 'SET_PAGO', pago }),
      setDatos: (datos) => dispatch({ type: 'SET_DATOS', datos }),
      setNumeroOrden: (numeroOrden) => dispatch({ type: 'SET_ORDEN', numeroOrden }),
      sincronizar: (productos) => dispatch({ type: 'SINCRONIZAR', productos }),
    }),
    [],
  )

  const valor = useMemo(
    () => ({
      ...estado,
      totales,
      cantidadEnCarrito,
      cantidadTotal: estado.items.reduce((acc, i) => acc + i.cantidad, 0),
      vacio: estado.items.length === 0,
      ...acciones,
    }),
    [estado, totales, cantidadEnCarrito, acciones],
  )

  return <CarritoContext.Provider value={valor}>{children}</CarritoContext.Provider>
}

// El hook vive junto a su provider a propósito (patrón estándar de contexto).
// eslint-disable-next-line react/only-export-components
export function useCarrito() {
  const contexto = useContext(CarritoContext)
  if (!contexto) throw new Error('useCarrito debe usarse dentro de <CarritoProvider>')
  return contexto
}
