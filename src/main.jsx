import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { NEGOCIO } from './config/negocio'
import { aplicarPaleta } from './config/paletas'
import { CarritoProvider } from './state/CarritoContext'
import { ToastProvider } from './components/ui/Toast'

// Tema del negocio (variables CSS) antes de pintar.
// El título y la descripción ya vienen escritos en el HTML desde el build
// (plugin datosDelNegocioEnElHtml en vite.config.js), así los lee cualquier
// buscador o vista previa de WhatsApp sin ejecutar JavaScript.
aplicarPaleta(NEGOCIO.marca.tema, NEGOCIO.marca.radio)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CarritoProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </CarritoProvider>
  </StrictMode>,
)
