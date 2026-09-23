/**
 * Iconos SVG inline (sin dependencias ni peticiones extra).
 * Todos heredan el color con "currentColor" y aceptan className.
 */
const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  viewBox: '0 0 24 24',
  'aria-hidden': 'true',
}

const Svg = ({ children, className = 'w-5 h-5', ...resto }) => (
  <svg {...base} {...resto} className={className}>
    {children}
  </svg>
)

export const IconoCarrito = (p) => (
  <Svg {...p}>
    <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6" />
    <circle cx="9.5" cy="20" r="1.4" />
    <circle cx="17.5" cy="20" r="1.4" />
  </Svg>
)

export const IconoMas = (p) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
)

export const IconoMenos = (p) => (
  <Svg {...p}>
    <path d="M5 12h14" />
  </Svg>
)

export const IconoBasura = (p) => (
  <Svg {...p}>
    <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13M10 11v6M14 11v6" />
  </Svg>
)

export const IconoBuscar = (p) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Svg>
)

export const IconoCerrar = (p) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
)

export const IconoWhatsApp = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M12.04 2C6.6 2 2.2 6.4 2.2 11.84c0 1.94.55 3.75 1.5 5.28L2 22l5-1.62a9.8 9.8 0 0 0 5.04 1.38h.01c5.43 0 9.84-4.4 9.84-9.84C21.89 6.4 17.48 2 12.04 2Zm5.76 14.02c-.24.68-1.4 1.3-1.93 1.34-.53.05-1.02.24-3.44-.72-2.92-1.16-4.75-4.2-4.9-4.4-.14-.2-1.15-1.55-1.15-2.95 0-1.4.73-2.08 1-2.37.24-.26.53-.33.72-.33l.5.01c.16 0 .38-.06.6.46.23.55.78 1.9.85 2.04.07.14.11.3.02.49-.1.19-.15.3-.29.47l-.43.5c-.14.14-.29.3-.12.58.16.29.72 1.19 1.55 1.93 1.06.95 1.96 1.24 2.24 1.38.28.14.44.12.6-.07.17-.19.7-.82.89-1.1.19-.29.38-.24.63-.15.26.1 1.62.77 1.9.91.28.14.46.21.53.33.07.12.07.7-.17 1.38Z" />
  </svg>
)

export const IconoCheck = (p) => (
  <Svg {...p}>
    <path d="m5 13 4 4L19 7" />
  </Svg>
)

export const IconoCopiar = (p) => (
  <Svg {...p}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M15 5.5A1.5 1.5 0 0 0 13.5 4H6a2 2 0 0 0-2 2v7.5A1.5 1.5 0 0 0 5.5 15" />
  </Svg>
)

export const IconoMoto = (p) => (
  <Svg {...p}>
    <circle cx="6" cy="17" r="3" />
    <circle cx="18" cy="17" r="3" />
    <path d="M9 17h6M4.5 12.5 8 6h4l1.5 6.5M14 9h3.5l1 4" />
  </Svg>
)

export const IconoTienda = (p) => (
  <Svg {...p}>
    <path d="M4 9.5V20h16V9.5M3 9.5 5 4h14l2 5.5M3 9.5h18M9.5 20v-5h5v5" />
  </Svg>
)

export const IconoEfectivo = (p) => (
  <Svg {...p}>
    <rect x="2.5" y="6" width="19" height="12" rx="2" />
    <circle cx="12" cy="12" r="2.6" />
    <path d="M6 10v4M18 10v4" />
  </Svg>
)

export const IconoTransferencia = (p) => (
  <Svg {...p}>
    <path d="M4 8h13l-3-3M20 16H7l3 3" />
  </Svg>
)

export const IconoReloj = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Svg>
)

export const IconoRefrescar = (p) => (
  <Svg {...p}>
    <path d="M20 11a8 8 0 0 0-14-4.5L4 9M4 5v4h4M4 13a8 8 0 0 0 14 4.5L20 15M20 19v-4h-4" />
  </Svg>
)

export const IconoAlerta = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 8v4.5M12 16h.01" />
  </Svg>
)

export const IconoEscudo = (p) => (
  <Svg {...p}>
    <path d="M12 3l7 3v6c0 4.2-2.9 7.5-7 9-4.1-1.5-7-4.8-7-9V6l7-3Z" />
    <path d="m9.5 12 2 2 3.5-4" />
  </Svg>
)

export const IconoFlecha = (p) => (
  <Svg {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
)

export const IconoChevron = (p) => (
  <Svg {...p}>
    <path d="m6 9 6 6 6-6" />
  </Svg>
)
