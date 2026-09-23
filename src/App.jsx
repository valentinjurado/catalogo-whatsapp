import { useState } from 'react'
import { NEGOCIO, usandoDemo } from './config/negocio'
import { useCatalogo } from './hooks/useCatalogo'
import { useCarrito } from './state/CarritoContext'
import { useToast } from './components/ui/Toast'
import Header from './components/layout/Header'
import Hero from './components/layout/Hero'
import Footer from './components/layout/Footer'
import Catalogo from './components/catalogo/Catalogo'
import CartWidget from './components/carrito/CartWidget'
import BarraPedidoMovil from './components/carrito/BarraPedidoMovil'
import CheckoutModal from './components/checkout/CheckoutModal'
import { IconoAlerta } from './components/ui/Iconos'

/**
 * Raíz de la aplicación: catálogo (fetch al Google Sheet) + carrito + checkout.
 * No hay rutas ni backend: todo vive en este árbol de componentes.
 */
function Tienda() {
  const carrito = useCarrito()
  const { avisar } = useToast()
  const [checkoutAbierto, setCheckoutAbierto] = useState(false)

  const catalogo = useCatalogo({ sincronizarCarrito: carrito.sincronizar })

  const agregar = (producto) => {
    carrito.agregar(producto)
    avisar({
      titulo: 'Agregado al pedido',
      detalle: producto.titulo,
      accion: { texto: 'Ver mi pedido', onClick: () => carrito.abrir() },
    })
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa] pb-24 sm:pb-0">
      <Header cantidadTotal={carrito.cantidadTotal} onAbrirCarrito={carrito.abrir} />
      <Hero />

      {usandoDemo() && catalogo.demo && (
        <div className="border-b border-amber-200 bg-amber-50">
          <div className="mx-auto flex max-w-7xl items-start gap-3 px-4 py-3 sm:px-6">
            <IconoAlerta className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-xs text-amber-900">
              <strong>Modo demostración:</strong> este catálogo usa el archivo de ejemplo
              (public/productos-demo.csv). Configurá tu Google Sheet en{' '}
              <code className="rounded bg-amber-100 px-1 py-0.5">src/config/negocio.js</code> para
              mostrar tus productos reales.
            </p>
          </div>
        </div>
      )}

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
        onAbrir={carrito.abrir}
      />

      <CartWidget
        abierto={carrito.abierto}
        items={carrito.items}
        totales={carrito.totales}
        entrega={carrito.entrega}
        cantidadTotal={carrito.cantidadTotal}
        onCerrar={carrito.cerrar}
        onCambiarCantidad={carrito.cambiarCantidad}
        onQuitar={carrito.quitar}
        onNota={carrito.ponerNota}
        onCambiarEntrega={carrito.setEntrega}
        onVaciar={carrito.vaciar}
        onContinuar={() => {
          carrito.cerrar()
          setCheckoutAbierto(true)
        }}
      />

      {/* Se monta sólo cuando está abierto: el flujo arranca limpio cada vez */}
      {checkoutAbierto && (
        <CheckoutModal abierto onCerrar={() => setCheckoutAbierto(false)} />
      )}
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
