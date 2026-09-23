/**
 * ============================================================
 *  CONFIGURACIÓN DEL NEGOCIO  (único archivo a editar)
 * ============================================================
 * Todo lo que cambia entre un local y otro vive acá.
 * Este archivo es la "instalación" de la plantilla: se edita,
 * no se toca el resto del código.
 *
 * ⚠️ NUNCA pongas datos sensibles (claves, tokens, tarjetas) acá:
 *    todo lo que está en este archivo termina visible en el navegador.
 *    Alias/CBU son datos públicos de cobro, por eso sí van.
 */
export const NEGOCIO = {
  // ---------- Identidad ----------
  marca: {
    nombre: 'Almacén Doña Rosa',
    eslogan: 'Almacén, rotisería y bebidas a domicilio',
    descripcion:
      'Hacé tu pedido desde el celular y lo confirmamos por WhatsApp. Envío a domicilio o retiro en el local.',
    // Tema visual: verde | azul | bordo | naranja | violeta | grafito
    tema: 'verde',
    // Redondeo de tarjetas en píxeles (16 = suave, 4 = recto)
    radio: 16,
    // URL opcional del logo (si está vacío se muestra la inicial del negocio)
    logo: '',
  },

  // ---------- WhatsApp del vendedor ----------
  whatsapp: {
    // Formato internacional SIN +, espacios ni guiones. Argentina: 54 9 <área> <número>
    numero: '5492494123456',
    // Se usa en el encabezado del mensaje ("Hola Rosa!")
    nombreVendedor: 'Rosa',
    // Abrir WhatsApp en la app o en la web
    soloWeb: false,
  },

  // ---------- Origen de datos (Google Sheets) ----------
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
      costo: 900,
      // Envío gratis desde este monto (0 = sin promoción)
      gratisDesde: 15000,
      zonas: 'Tandil y alrededores (hasta 8 km)',
      demora: '45 a 60 minutos',
      // true = la dirección es obligatoria para envío
      requiereDireccion: true,
    },
    retiro: {
      habilitado: true,
      direccion: 'Rivadavia 1234, Tandil',
      horarios: 'Lun a Sáb de 9 a 13 y de 17 a 21 hs',
      demora: 'Listo en 20 minutos',
    },
    // Permitir que el cliente elija hora/franja en el paso de datos
    pedirHorario: true,
    // Permitir aclaraciones por producto (sin cebolla, sin sal, etc.)
    permitirNotasProducto: true,
  },

  // ---------- Formas de pago (NO hay cobro online) ----------
  pago: {
    efectivo: {
      habilitado: true,
      detalle: 'Abonás al recibir el pedido. Avisá si necesitás vuelto.',
    },
    transferencia: {
      habilitado: true,
      titular: 'Rosa Gutiérrez',
      banco: 'Banco Provincia',
      alias: 'almacen.donarosa.mp',
      cbu: '0140011500150012345678',
      cuit: '27-12345678-4',
      // Texto que se muestra en pantalla y se incluye en el mensaje
      aviso:
        'Transferí el total desde tu home banking y dejá el comprobante a mano: lo adjuntás en el chat.',
      // Texto EXACTO que exige el flujo de pedido para el caso transferencia
      confirmacion: 'Ya realicé el pago al alias indicado, te adjunto el comprobante',
    },
  },

  // ---------- Reglas del pedido ----------
  pedido: {
    // Monto mínimo del pedido (0 = sin mínimo)
    minimo: 0,
    // Prefijo del número de orden
    prefijoOrden: 'PED',
    // Moneda y formato
    moneda: 'ARS',
    locale: 'es-AR',
    // Campos del cliente que se piden en el checkout
    campos: {
      nombre: true,
      telefono: true,
      direccion: 'auto', // 'auto' = sólo si elige envío
      email: false,
      horario: true,
    },
  },

  // ---------- Textos de la interfaz (multiidioma / tono) ----------
  textos: {
    heroBadge: 'Pedidos por WhatsApp',
    heroTitulo: 'Tu pedido, listo en 3 pasos',
    heroSubtitulo:
      'Elegí los productos, decinos cómo lo querés y confirmá por WhatsApp. Sin registros y sin pagar online.',
    ctaWhatsapp: 'Confirmar pedido por WhatsApp',
    avisoSinTarjetas:
      'No pedimos datos de tarjetas. El pago se coordina con el local por fuera de la web.',
    pieLegal:
      'Los precios pueden variar sin aviso. Las imágenes son ilustrativas.',
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
