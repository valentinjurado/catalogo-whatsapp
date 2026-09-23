/**
 * ============================================================
 *  CONFIGURACIÓN DEL NEGOCIO  (único archivo a editar)
 * ============================================================
 * Todo lo que cambia entre un local y otro vive acá: marca, colores, número de
 * WhatsApp, envío, formas de pago y textos. No hace falta tocar componentes.
 *
 * ⚠️ NUNCA pongas datos sensibles (claves, tokens, tarjetas) en este archivo:
 *    todo lo que está acá termina visible en el navegador.
 */
export const NEGOCIO = {
  // ---------- Identidad ----------
  marca: {
    nombre: 'Pizzería',
    eslogan: 'Pizzas, hamburguesas y empanadas',
    descripcion:
      'Pizzas, hamburguesas, empanadas y bebidas, con opciones vegetarianas y veganas. Pedí online y confirmá por WhatsApp: envío a domicilio o retiro en el local.',
    // Tema visual: verde | azul | bordo | naranja | violeta | grafito
    tema: 'naranja',
    // Redondeo de tarjetas en píxeles (16 = suave, 4 = recto)
    radio: 16,
    // URL opcional del logo (si está vacío se muestra la inicial del negocio)
    logo: '',
  },

  // ---------- WhatsApp del vendedor ----------
  whatsapp: {
    // ⚠️ TU NÚMERO, en formato INTERNACIONAL para wa.me: 54 9 <área> <número>,
    //    sin +, sin espacios y sin el 0 inicial del área.
    //    Ejemplo Tandil: 249 468-4061  ->  '5492494684061'
    //    (con '2494684061' WhatsApp no sabe a qué país llamar)
    numero: '5492494684061',
    // Se usa en el saludo del mensaje de consulta
    nombreVendedor: 'Mateo',
  },

  // ---------- Origen de datos (Google Sheets = panel de administración) ----------
  catalogo: {
    // OPCIÓN A (recomendada): Archivo > Compartir > Publicar en la web > CSV
    hojaCsv: '',
    // OPCIÓN B: pegar el ID de la hoja y el gid de la pestaña (se arma la URL gviz)
    hojaId: '',
    gid: '0',
    // Minutos de caché local antes de volver a pedir la hoja
    refrescoMinutos: 10,
    // Si no hay hoja configurada, se usa public/productos-demo.csv
    modoDemo: true,
  },

  // ---------- Entrega ----------
  entrega: {
    envio: {
      habilitado: true,
      costo: 1200,
      // Envío gratis desde este monto (0 = sin promoción)
      gratisDesde: 20000,
      zonas: 'Tandil centro y alrededores (hasta 6 km)',
      demora: '35 a 50 minutos',
      requiereDireccion: true,
    },
    retiro: {
      habilitado: true,
      direccion: 'Av. Colón 1234, Tandil',
      horarios: 'Martes a domingo de 19 a 24 hs',
      demora: 'Listo en 20 minutos',
    },
    pedirHorario: true,
    permitirNotasProducto: true,
  },

  // ---------- Formas de pago (NO hay cobro online) ----------
  // El local no publica datos bancarios: si el cliente paga por transferencia,
  // el alias se comparte por el chat de WhatsApp.
  pago: {
    efectivo: {
      habilitado: true,
      detalle: 'Abonás al recibir el pedido.',
      // Cómo aparece en el mensaje que recibe el local
      lineaMensaje: 'Efectivo al recibir el pedido.',
    },
    transferencia: {
      habilitado: true,
      detalle: 'Te compartimos el alias por WhatsApp para que puedas transferir.',
      // Línea que se agrega al mensaje: le avisa al local que debe pasar el alias
      lineaMensaje: 'Transferencia: pasame el alias para transferir.',
    },
  },

  // ---------- Reglas del pedido ----------
  pedido: {
    minimo: 0,
    prefijoOrden: 'PED',
    moneda: 'ARS',
    locale: 'es-AR',
    campos: {
      nombre: true,
      telefono: true,
      direccion: 'auto', // 'auto' = sólo si elige envío
      email: false,
      horario: true,
    },
  },

  // ---------- Textos ----------
  textos: {
    pieLegal: 'Los precios pueden variar sin aviso. Las imágenes son ilustrativas.',
  },
}

/**
 * Devuelve la URL pública del CSV del Google Sheet.
 * Prioridad: hojaCsv publicada > hojaId + gid (gviz) > demo local.
 */
export function urlHojaCsv() {
  const { hojaCsv, hojaId, gid, modoDemo } = NEGOCIO.catalogo
  if (hojaCsv && hojaCsv.trim()) return hojaCsv.trim()
  if (hojaId && hojaId.trim()) {
    return `https://docs.google.com/spreadsheets/d/${hojaId.trim()}/gviz/tq?tqx=out:csv&gid=${gid || '0'}`
  }
  // import.meta.env sólo existe bajo Vite: con el "??" el archivo también se
  // puede importar desde scripts de Node (tests, validador del CSV, etc.)
  const base = import.meta.env?.BASE_URL ?? '/'
  return modoDemo ? `${base}productos-demo.csv` : ''
}

/** true cuando la app corre con el CSV de ejemplo incluido en la plantilla. */
export function usandoDemo() {
  const { hojaCsv, hojaId } = NEGOCIO.catalogo
  return !(hojaCsv?.trim() || hojaId?.trim())
}
