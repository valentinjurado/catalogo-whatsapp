import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { NEGOCIO } from './config/negocio'
import { aplicarPaleta } from './config/paletas'
import { CarritoProvider } from './state/CarritoContext'
import { ToastProvider } from './components/ui/Toast'

// 1) Tema del negocio (variables CSS) antes de pintar
aplicarPaleta(NEGOCIO.marca.tema, NEGOCIO.marca.radio)

// 2) SEO básico desde la configuración: una sola fuente de verdad
document.title = `${NEGOCIO.marca.nombre} | Pedidos por WhatsApp`
const descripcion = document.querySelector('meta[name="description"]')
if (descripcion) descripcion.setAttribute('content', NEGOCIO.marca.descripcion)
document.querySelector('meta[property="og:title"]')?.setAttribute('content', document.title)
document
  .querySelector('meta[property="og:description"]')
  ?.setAttribute('content', NEGOCIO.marca.descripcion)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CarritoProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </CarritoProvider>
  </StrictMode>,
)
