import { useCallback, useState } from 'react'
import { NEGOCIO } from './config/negocio'
import { useCatalogo } from './hooks/useCatalogo'
import { useCarrito } from './state/CarritoContext'
import { useToast } from './components/ui/Toast'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import Catalogo from './components/catalogo/Catalogo'
import CartWidget from './components/carrito/CartWidget'
import BarraPedidoMovil from './components/carrito/BarraPedidoMovil'
import CheckoutModal from './components/checkout/CheckoutModal'

/**
 * Raíz de la aplicación: catálogo (fetch al Google Sheet) + carrito + checkout.
 * No hay rutas ni backend: todo vive en este árbol de componentes.
 *
 * Los handlers van con useCallback: si cambiaran de identidad en cada render,
 * los efectos de los hijos (modal, carrito) se re-ejecutarían al escribir y el
 * usuario perdería el foco en los campos.
 */
function Tienda() {
  const carrito = useCarrito()
  const { avisar } = useToast()
  const [checkoutAbierto, setCheckoutAbierto] = useState(false)

  const catalogo = useCatalogo({ sincronizarCarrito: carrito.sincronizar })

  const abrirCarrito = useCallback(() => carrito.abrir(), [carrito])
  const cerrarCarrito = useCallback(() => carrito.cerrar(), [carrito])
  const abrirCheckout = useCallback(() => {
    carrito.cerrar()
    setCheckoutAbierto(true)
  }, [carrito])
  const cerrarCheckout = useCallback(() => setCheckoutAbierto(false), [])

  const agregar = useCallback(
    (producto) => {
      carrito.agregar(producto)
      avisar({
        titulo: 'Agregado',
        detalle: producto.titulo,
        accion: { texto: 'Ver mi pedido', onClick: () => carrito.abrir() },
      })
    },
    [carrito, avisar],
  )

  return (
    <div className="min-h-screen bg-[#f7f8fa] pb-24 sm:pb-0">
      <Header cantidadTotal={carrito.cantidadTotal} onAbrirCarrito={abrirCarrito} />

      <main>
        <Catalogo
          productos={catalogo.productos}
          categorias={catalogo.categorias}
          cargando={catalogo.cargando}
          refrescando={catalogo.refrescando}
          error={catalogo.error}
          avisos={catalogo.avisos}
          actualizado={catalogo.actualizado}
          onRecargar={catalogo.recargar}
          cantidadEnCarrito={carrito.cantidadEnCarrito}
          onAgregar={agregar}
          onCambiarCantidad={carrito.cambiarCantidad}
        />
      </main>

      <Footer />

      <BarraPedidoMovil
        visible={!carrito.abierto && !checkoutAbierto}
        cantidadTotal={carrito.cantidadTotal}
        total={carrito.totales.total}
        onAbrir={abrirCarrito}
      />

      <CartWidget
        abierto={carrito.abierto}
        items={carrito.items}
        totales={carrito.totales}
        entrega={carrito.entrega}
        cantidadTotal={carrito.cantidadTotal}
        onCerrar={cerrarCarrito}
        onCambiarCantidad={carrito.cambiarCantidad}
        onQuitar={carrito.quitar}
        onNota={carrito.ponerNota}
        onCambiarEntrega={carrito.setEntrega}
        onVaciar={carrito.vaciar}
        onContinuar={abrirCheckout}
      />

      {/* Se monta sólo cuando está abierto: el flujo arranca limpio cada vez */}
      {checkoutAbierto && <CheckoutModal abierto onCerrar={cerrarCheckout} />}
    </div>
  )
}

export default function App() {
  return (
    <div data-negocio={NEGOCIO.marca.nombre}>
      <Tienda />
    </div>
  )
}
