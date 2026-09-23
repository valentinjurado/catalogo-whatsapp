import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import { carritoReducer, estadoInicial } from './carritoReducer'
import { calcularTotales } from '../services/pedido'

/**
 * ============================================================================
 *  CARRITO GLOBAL  (Context + useReducer + persistencia)
 * ============================================================================
 *  Uso:
 *    const { items, totales, agregar, abrir } = useCarrito()
 *
 *  Persistencia: se guardan items, entrega, pago y datos en localStorage para
 *  que el cliente no pierda el pedido si cierra la pestaña o pierde señal.
 */

const CLAVE_PERSISTENCIA = 'carrito.v1'
const CarritoContext = createContext(null)

function leerPersistencia() {
  try {
    const crudo = localStorage.getItem(CLAVE_PERSISTENCIA)
    if (!crudo) return null
    const datos = JSON.parse(crudo)
    if (!datos || !Array.isArray(datos.items)) return null
    return datos
  } catch {
    return null
  }
}

export function CarritoProvider({ children }) {
  const [estado, dispatch] = useReducer(carritoReducer, estadoInicial)
  const hidratado = useRef(false)

  // Hidratar una sola vez, antes de la primera pintura útil
  useEffect(() => {
    const guardado = leerPersistencia()
    if (guardado) {
      dispatch({
        type: 'HIDRATAR',
        estado: {
          items: guardado.items || [],
          entrega: guardado.entrega || estadoInicial.entrega,
          pago: guardado.pago || estadoInicial.pago,
          datos: { ...estadoInicial.datos, ...(guardado.datos || {}) },
          numeroOrden: guardado.numeroOrden || null,
        },
      })
    }
    hidratado.current = true
  }, [])

  // Persistir ante cada cambio relevante
  useEffect(() => {
    if (!hidratado.current) return
    try {
      const { items, entrega, pago, datos, numeroOrden } = estado
      localStorage.setItem(
        CLAVE_PERSISTENCIA,
        JSON.stringify({ items, entrega, pago, datos, numeroOrden }),
      )
    } catch {
      /* incógnito o cuota llena */
    }
  }, [estado])

  // Bloquear el scroll del fondo cuando el panel o el modal están abiertos
  useEffect(() => {
    const abierto = estado.abierto
    document.body.style.overflow = abierto ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [estado.abierto])

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
