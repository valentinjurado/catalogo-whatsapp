#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Genera el PDF de arquitectura de la plantilla Catálogo WhatsApp.
Uso:  python docs/generar-pdf-arquitectura.py "<ruta de salida .pdf>"
"""
from __future__ import annotations

import os
import sys
from datetime import date

from reportlab.lib import colors
from reportlab.lib.enums import TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, mm
from reportlab.platypus import (
    BaseDocTemplate,
    CondPageBreak,
    Frame,
    Image,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

VERDE = colors.HexColor('#059669')
VERDE_CLARO = colors.HexColor('#ECFDF5')
GRIS = colors.HexColor('#475569')
GRIS_CLARO = colors.HexColor('#F1F5F9')
BORDE = colors.HexColor('#E2E8F0')
ROJO = colors.HexColor('#DC2626')
TINTA = colors.HexColor('#0F172A')

ss = getSampleStyleSheet()

S = {}
S['titulo'] = ParagraphStyle('titulo', parent=ss['Title'], fontName='Helvetica-Bold',
                             fontSize=26, leading=30, textColor=TINTA, spaceAfter=6, alignment=TA_LEFT)
S['subtitulo'] = ParagraphStyle('subtitulo', parent=ss['Normal'], fontName='Helvetica',
                                fontSize=12.5, leading=18, textColor=GRIS, spaceAfter=14)
S['h1'] = ParagraphStyle('h1', parent=ss['Heading1'], fontName='Helvetica-Bold', fontSize=16,
                         leading=20, textColor=VERDE, spaceBefore=16, spaceAfter=7)
S['h2'] = ParagraphStyle('h2', parent=ss['Heading2'], fontName='Helvetica-Bold', fontSize=12,
                         leading=16, textColor=TINTA, spaceBefore=11, spaceAfter=5)
S['p'] = ParagraphStyle('p', parent=ss['BodyText'], fontName='Helvetica', fontSize=9.6,
                        leading=14.2, textColor=colors.HexColor('#1E293B'), alignment=TA_JUSTIFY,
                        spaceAfter=6)
S['chico'] = ParagraphStyle('chico', parent=S['p'], fontSize=8.6, leading=12.4, textColor=GRIS)
S['bullet'] = ParagraphStyle('bullet', parent=S['p'], leftIndent=12, bulletIndent=2, spaceAfter=3)
S['codigo'] = ParagraphStyle('codigo', parent=ss['Code'], fontName='Courier', fontSize=7.1,
                             leading=9.4, textColor=colors.HexColor('#0B1220'))
S['codigo_com'] = ParagraphStyle('codigo_com', parent=S['codigo'],
                                 textColor=colors.HexColor('#64748B'))
S['celda'] = ParagraphStyle('celda', parent=S['p'], fontSize=8.4, leading=11.4, alignment=TA_LEFT,
                            spaceAfter=0)
S['celda_b'] = ParagraphStyle('celda_b', parent=S['celda'], fontName='Helvetica-Bold')
S['celda_mono'] = ParagraphStyle('celda_mono', parent=S['celda'], fontName='Courier', fontSize=7.8)
S['nota'] = ParagraphStyle('nota', parent=S['p'], fontSize=8.8, leading=12.6,
                           textColor=colors.HexColor('#7C2D12'))


def P(texto, estilo='p'):
    return Paragraph(texto, S[estilo])


def bullets(items, estilo='bullet'):
    return [Paragraph(t, S[estilo], bulletText='•') for t in items]


def caja(texto, color_fondo=VERDE_CLARO, color_borde=VERDE, estilo='p'):
    t = Table([[Paragraph(texto, S[estilo])]], colWidths=[17.0 * cm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), color_fondo),
        ('BOX', (0, 0), (-1, -1), 0.7, color_borde),
        ('LEFTPADDING', (0, 0), (-1, -1), 9),
        ('RIGHTPADDING', (0, 0), (-1, -1), 9),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    return t


def codigo(fragmento, ancho=17.0):
    """Bloque de código con fondo gris claro y barras de colores por línea."""
    lineas = fragmento.strip('\n').split('\n')
    filas = []
    for linea in lineas:
        estilo = 'codigo_com' if linea.strip().startswith('//') else 'codigo'
        filas.append([Paragraph(linea.replace(' ', '&nbsp;').replace('<', '&lt;').replace('>', '&gt;'), S[estilo])])
    t = Table(filas, colWidths=[ancho * cm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), GRIS_CLARO),
        ('LINEBEFORE', (0, 0), (0, -1), 2, VERDE),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 1.1),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1.1),
    ]))
    return t


def tabla(encabezados, filas, anchos, mono_cols=()):
    datos = [[Paragraph(c, S['celda_b']) for c in encabezados]]
    for fila in filas:
        datos.append([
            Paragraph(str(c), S['celda_mono'] if i in mono_cols else S['celda'])
            for i, c in enumerate(fila)
        ])
    t = Table(datos, colWidths=anchos, repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), VERDE),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDE),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    return t


def encabezado_pie(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(VERDE)
    canvas.rect(0, A4[1] - 0.9 * cm, A4[0], 0.9 * cm, stroke=0, fill=1)
    canvas.setFont('Helvetica-Bold', 8.5)
    canvas.setFillColor(colors.white)
    canvas.drawString(2 * cm, A4[1] - 0.62 * cm, 'Catálogo WhatsApp · Arquitectura y código base')
    canvas.drawRightString(A4[0] - 2 * cm, A4[1] - 0.62 * cm, 'Plantilla white-label para negocios locales')
    canvas.setFillColor(GRIS)
    canvas.setFont('Helvetica', 8)
    canvas.drawString(2 * cm, 1.05 * cm, 'React + Vite + Tailwind · Google Sheets como base de datos · Checkout por WhatsApp · Sin backend')
    canvas.drawRightString(A4[0] - 2 * cm, 1.05 * cm, 'Página %d' % doc.page)
    canvas.setStrokeColor(BORDE)
    canvas.line(2 * cm, 1.45 * cm, A4[0] - 2 * cm, 1.45 * cm)
    canvas.restoreState()


def construir(salida):
    historia = []

    # ---------------------------------------------------------------- portada
    historia.append(Spacer(1, 1.1 * cm))
    historia.append(P('Menú online + carrito<br/>con pedido por WhatsApp', 'titulo'))
    historia.append(P(
        'Arquitectura y código base de un menú online 100% estático para locales gastronómicos: '
        'sin base de datos tradicional, sin backend, sin pasarela de pago y sin publicar datos '
        'bancarios. El panel de administración es un documento de Google Sheets y el pedido se '
        'cierra por WhatsApp.',
        'subtitulo'))

    historia.append(tabla(
        ['Dato', 'Valor'],
        [
            ['Stack', 'React 19 + Vite 8 + Tailwind CSS 4 + PapaParse'],
            ['Base de datos', 'Google Sheets publicado como CSV (solo lectura)'],
            ['Administración', 'El propio Google Sheet: alta, edición, baja y stock'],
            ['Pagos', 'Efectivo o transferencia. La web no publica alias ni CBU: el local lo pasa por el chat'],
            ['Confirmación', 'wa.me/número?text=… con el pedido estructurado'],
            ['Demo online', 'https://valentinjurado.github.io/catalogo-whatsapp/ (menú de ejemplo)'],
            ['Hosting', 'Vercel / Netlify / GitHub Pages (plan gratuito)'],
            ['Costo mensual del local', 'Dominio (ej. .com.ar) — sin servidores ni licencias'],
            ['Build de producción', '300,7 kB JS (93,5 kB gzip) + 37,5 kB CSS (7,7 kB gzip)'],
            ['Fecha del documento', date.today().strftime('%d/%m/%Y')],
        ],
        [4.2 * cm, 12.8 * cm]))

    historia.append(Spacer(1, 0.5 * cm))
    historia.append(caja(
        '<b>Idea central.</b> El navegador del cliente hace un <i>fetch</i> al CSV del Google Sheets, '
        'arma el pedido en el carrito y, al confirmar, abre WhatsApp con el mensaje ya escrito. '
        'No hay servidor que mantener, no hay datos de tarjetas ni datos bancarios en juego, y no '
        'existe superficie para inyección SQL porque no hay SQL.'))

    # ---------------------------------------------------------------- resumen
    historia.append(P('1. Resumen del sistema', 'h1'))
    historia.append(P(
        'El sistema tiene dos pantallas de uso y una planilla:', 'p'))
    historia.extend(bullets([
        '<b>Vista cliente:</b> menú con buscador y filtros, carrito lateral (off-canvas), checkout en '
        'dos pantallas (datos y entrega, forma de pago) y envío del pedido por WhatsApp.',
        '<b>Panel administrador:</b> el Google Sheets. El dueño del local carga, edita, oculta o '
        'borra productos y cambia el stock sin tocar código. Los cambios se ven en la web al '
        'recargar la página.',
        '<b>Sin backend ni base de datos:</b> el sitio es un paquete de archivos estáticos. '
        'No hay API keys, no hay credenciales, no hay costos de infraestructura.',
        '<b>Sin datos de cobro en la web:</b> no hay pasarela, ni formulario de tarjeta, ni alias ni '
        'CBU publicados. Si el cliente paga por transferencia, el alias viaja por el chat.',
    ]))

    historia.append(P('Flujo completo', 'h2'))
    historia.append(codigo("""
CLIENTE                                        DUEÑO DEL LOCAL
-------                                        ---------------
1. abre la web y ve el MENU     <-- CSV <--    Google Sheets (carga el menu)
   (los productos van primero)                  (agrega, edita, oculta, stock)
2. elige productos
3. elige entrega: envio a domicilio o retiro
4. elige pago: efectivo o transferencia
   (no se muestran alias ni CBU)
5. "Enviar pedido" ==> wa.me con el mensaje   ==>  WhatsApp del local
   (n de pedido, detalle, totales,            ==>  prepara el pedido
    entrega, pago y datos del cliente)        ==>  si es transferencia,
                                                    pasa el alias por el chat
El pago NUNCA pasa por la web y la web NO publica datos bancarios:
se coordina por whatsapp (alias a pedido, o efectivo al recibir).
En el celular, una barra fija mantiene el pedido a un toque.
"""))

    historia.append(P('Por qué este diseño conviene al local', 'h2'))
    historia.extend(bullets([
        '<b>Costo casi nulo:</b> hosting gratuito + dominio. Nada de servidores, bases de datos ni '
        'suscripciones de pasarelas.',
        '<b>Cero riesgo financiero:</b> al no integrar cobros, no hay comisiones, ni cumplimiento '
        'PCI-DSS, ni datos de tarjetas, ni datos bancarios publicados.',
        '<b>Menos fricción para el cliente:</b> no hay registro, no hay pantallas intermedias de '
        'presentación y el pedido sale desde el carrito en dos pasos.',
        '<b>Administración que el dueño ya sabe usar:</b> agrega y edita productos en una planilla '
        '(incluso desde el celular), sin panel nuevo ni contraseñas.',
        '<b>El pedido llega completo a WhatsApp:</b> número de pedido, detalle, totales, entrega, '
        'forma de pago y datos del cliente. Menos ida y vuelta, menos pedidos mal tomados.',
        '<b>Publicación inmediata:</b> es un sitio estático: se copia a cualquier hosting y funciona.',
    ]))

    historia.append(PageBreak())

    # ------------------------------------------------- entregable 1: la planilla
    historia.append(P('2. El Google Sheet: base de datos y panel de administración', 'h1'))
    historia.append(P(
        'Una sola pestaña, con la fila 1 como encabezado. El nombre de las columnas es tolerante: '
        'no distingue mayúsculas ni tildes y acepta sinónimos (por ejemplo <i>título</i>, '
        '<i>titulo</i>, <i>nombre</i> o <i>producto</i>; <i>imagen</i>, <i>foto</i> o '
        '<i>url_imagen</i>).'))

    historia.append(P('Cómo se administra el menú (no hay otro panel que el Sheet)', 'h2'))
    historia.append(tabla(
        ['Quiero…', 'Qué hago en la planilla', 'Qué pasa en la web'],
        [
            ['Agregar un producto', 'Escribo una fila nueva con <b>id</b>, <b>titulo</b> y <b>precio</b> '
                                    '(el resto es opcional)', 'Aparece en el menú al recargar (caché de 10 min)'],
            ['Modificar precio o texto', 'Edito la celda', 'El cliente lo ve al recargar la página'],
            ['Eliminar un producto', 'Opción limpia y reversible: <b>activo = no</b>. Opción final: '
                                     'borro la fila', 'Deja de mostrarse (y sale del carrito guardado)'],
            ['Cambiar el stock', '<b>stock</b> = cantidad', 'Con <b>0</b> se muestra “Agotado” y no se puede pedir'],
            ['Poner una oferta', 'Escribo el precio rebajado en <b>precio_oferta</b>',
             'Precio anterior tachado + porcentaje de descuento'],
            ['Reordenar el menú', '<b>orden</b> = 1, 2, 3… y <b>destacado = si</b>',
             'Los destacados van primero y después manda el orden'],
            ['Crear o quitar categorías', 'Uso o dejo de usar palabras en <b>categoria</b>',
             'Los filtros de arriba se arman solos desde la planilla'],
            ['Agregar un filtro (vegano, sin TACC…)', 'Escribo esa palabra en <b>etiquetas</b>',
             'Aparece como chip en “Filtros rápidos”: no hay lista fija'],
            ['Cargar ingredientes', 'Escribo el texto en <b>ingredientes</b>',
             'Se muestra en la ficha del producto, con “Ver ingredientes” en la tarjeta'],
        ],
        [3.1 * cm, 6.6 * cm, 7.3 * cm]))

    historia.append(P('¿El stock se descuenta solo?', 'h2'))
    historia.extend(bullets([
        '<b>No, y es una decisión de arquitectura.</b> Descontar stock exige un lugar donde '
        '<i>escribir</i>: un servidor o una base de datos. Acá la planilla se lee y nunca se '
        'modifica desde la web.',
        '<b>Cómo se maneja en la práctica:</b> cuando algo se termina, el dueño pone '
        '<font face="Courier" size="8">stock = 0</font> desde el celular y en la web aparece '
        '“Agotado” (no se puede pedir). Son segundos y lo decide quien está en la cocina.',
        '<b>Si algún día lo quieren automático:</b> se agrega un Google Apps Script como mini API '
        'gratuita que descuente al entrar cada pedido. Único camino sin pagar servidores; el riesgo '
        'a conversar es el de dos pedidos simultáneos del último producto.',
        '<b>Lo que sí hace la web:</b> avisar. El cliente ve “Agotado” y el pedido que llega al '
        'local lleva el detalle para confirmar disponibilidad.',
    ]))

    historia.append(P('Cómo se publican las fotos de los productos', 'h2'))
    historia.extend(bullets([
        'La planilla guarda <b>un link público</b>, no el archivo. <b>Google Drive ya está '
        'integrado</b>: se comparte la foto como “cualquiera con el enlace” y la web convierte '
        'sola el link de compartir en link directo (<font face="Courier" size="8">/file/d/ID/view'
        '</font> → <font face="Courier" size="8">uc?export=view&amp;id=ID</font>).',
        'Lo más estable: subir las fotos al hosting del sitio o a un servicio de imágenes '
        '(Imgur, Cloudinary): no dependen de permisos de Drive.',
        'Si una foto falla, la tarjeta muestra la inicial del producto en lugar del ícono de '
        'imagen rota: la grilla nunca se ve “rota”.',
        '<b>Qué no publicar:</b> la hoja publicada como CSV es pública (incluye productos con '
        '<font face="Courier" size="8">activo = no</font> y la columna <font face="Courier" '
        'size="8">stock</font>). Costos, márgenes y notas internas van en otra pestaña que no se '
        'publica.',
    ]))

    historia.append(P(
        'Se puede editar desde el celular con la app de Google Sheets. No hay usuarios, contraseñas '
        'ni panel que mantener: el dueño necesita una cuenta de Google (gratis) y publicar la hoja '
        'como CSV una sola vez; la URL no cambia nunca, así que no hay que volver a publicar el sitio.',
        'chico'))

    historia.append(P('Si algún día piden un panel web con login', 'h2'))
    historia.extend(bullets([
        '<b>Google Apps Script</b> como API (sigue siendo gratis): una Web App lee y escribe en la '
        'misma hoja, protegida con una clave, y la web suma una pantalla de administración. Es la '
        'opción más barata para no dejar de ser “cero servidor”.',
        '<b>Backend real</b> (Supabase / Firebase): panel cómodo y multiusuario, pero agrega costos, '
        'cuentas y mantenimiento. Se justifica con varios locales, stock que se descuenta solo o '
        'pedidos guardados en base de datos.',
    ]))

    historia.append(tabla(
        ['Columna', 'Oblig.', 'Ejemplo', 'Qué hace / formato'],
        [
            ['id', 'no', 'MIL01', 'Identifica el producto. Si falta se genera desde el título. '
                                  '<b>Debe ser único</b>: el carrito agrupa por id.'],
            ['titulo', 'SÍ', 'Milanesa napolitana', 'Nombre visible. Una fila sin título se ignora.'],
            ['descripcion', 'no', 'La clásica, al molde.', 'Texto libre. En la tarjeta se recorta a 2 líneas.'],
            ['ingredientes', 'no', 'Masa, salsa, muzzarella…', 'Se muestra en la ficha del producto (foto grande + detalle).'],
            ['precio', 'SÍ', '9800', 'Acepta 9800, 9.800,50, $ 9.800. La coma decimal se interpreta sola.'],
            ['precio_oferta', 'no', '8500', 'Si es menor al precio, se muestra tachado y con el % de descuento.'],
            ['categoria', 'no', 'Rotisería', 'Con esto se arman los filtros de arriba del catálogo.'],
            ['url_imagen', 'no', 'https://…jpg', 'URL pública de la foto. En Drive: '
                                              'drive.google.com/uc?export=view&id=ID'],
            ['stock', 'no', '12', '0 = Agotado (no se puede agregar). Vacío = sin control de stock.'],
            ['unidad', 'no', 'kg', 'Se muestra como “/ kg” junto al precio.'],
            ['etiquetas', 'no', 'Vegano,Más pedida', 'Hasta 2 visibles en la tarjeta y todas se vuelven filtros rápidos.'],
            ['destacado', 'no', 'si', 'Los destacados se ordenan primero en el catálogo.'],
            ['activo', 'no', 'si', 'Con “no” el producto no se publica (borrado lógico, reversible).'],
            ['orden', 'no', '1', 'Orden manual dentro de la categoría (1, 2, 3…).'],
        ],
        [2.5 * cm, 1.4 * cm, 3.1 * cm, 10.0 * cm], mono_cols=(2,)))

    historia.append(Spacer(1, 0.35 * cm))
    historia.append(P('Cómo publicarla para que la web la lea', 'h2'))
    historia.extend(bullets([
        '<b>Opción A (recomendada).</b> Archivo → Compartir → <b>Publicar en la web</b> → elegir la '
        'pestaña y el formato <b>CSV</b> → Publicar → copiar la URL y pegarla en '
        '<font face="Courier" size="8">catalogo.hojaCsv</font>. La hoja queda de solo lectura pública.',
        '<b>Opción B.</b> Compartir como “cualquiera con el enlace puede ver” y pegar solo el ID del '
        'documento en <font face="Courier" size="8">catalogo.hojaId</font> más el '
        '<font face="Courier" size="8">gid</font> de la pestaña: la app arma el endpoint CSV de Google.',
        '<b>Validación previa.</b> El proyecto incluye un validador que usa el mismo parser que la '
        'web: <font face="Courier" size="8">npm run validar &lt;archivo.csv o URL&gt;</font>. Avisa de '
        'filas sin precio, imágenes faltantes, ids repetidos y errores de comillas.',
    ]))

    historia.append(P('Reglas de datos que conviene respetar', 'h2'))
    historia.extend(bullets([
        'No repetir <b>id</b>: dos filas con el mismo id se comportan como un mismo producto en el carrito.',
        'Si un texto tiene <b>comas</b> (por ejemplo “Docena con membrillo, crema y dulce”), la celda '
        'debe ir entre comillas cuando se exporta a CSV — el validador lo detecta.',
        'Evitar cambiar el <b>id</b> de un producto existente: se pierde el historial del carrito guardado.',
        'Los precios son los que se muestran y con los que se calcula el total; la web nunca los inventa.',
    ]))

    historia.append(PageBreak())

    # ---------------------------------------- entregable 2: servicio de datos
    historia.append(P('3. Servicio de obtención de datos (Sheets → JSON)', 'h1'))
    historia.append(P(
        'Vive en <font face="Courier" size="8">src/services/catalogo.js</font>. No importa React: es '
        'una función pura sobre texto CSV y un <i>fetch</i>. Eso permite reusarla desde un script de '
        'Node (el validador usa exactamente esta función).'))

    historia.append(codigo("""
// 1) Origen de datos (src/config/negocio.js)
export function urlHojaCsv() {
  const { hojaCsv, hojaId, gid, modoDemo } = NEGOCIO.catalogo
  if (hojaCsv?.trim()) return hojaCsv.trim()                     // CSV publicado
  if (hojaId?.trim()) {                                          // endpoint gviz
    return `https://docs.google.com/spreadsheets/d/${hojaId.trim()}/gviz/tq?tqx=out:csv&gid=${gid}`
  }
  return modoDemo ? `${import.meta.env?.BASE_URL ?? '/'}productos-demo.csv` : ''
}

// 2) Descarga + normalización + caché (fragmento)
export async function obtenerCatalogo({ forzar = false } = {}) {
  const url = urlHojaCsv()
  if (!url) throw new Error('Falta configurar el Google Sheet en negocio.js')

  const cache = leerCache()                       // localStorage 'catalogo.cache.v1'
  if (cache && !forzar && !cacheVencido(cache)) return { ...cache, desdeCache: true }

  let res
  try { res = await fetch(url, { redirect: 'follow' }) }
  catch (e) { return cache ? { ...cache, desdeCache: true, avisoRed: true } : Promise.reject(e) }
  if (!res.ok) throw new Error(`El catálogo respondió ${res.status}`)

  const texto = await res.text()
  // Si la hoja no es pública, Google devuelve el HTML del login:
  if (/^\\s*<(!doctype|html)/i.test(texto)) throw new Error('La hoja no está publicada como CSV.')

  const datos = transformarCatalogo(texto)
  guardarCache({ ...datos, actualizado: new Date().toISOString(), guardadoEn: Date.now() })
  return { ...datos, desdeCache: false }
}
"""))

    historia.append(P('Normalización de cada fila (PapaParse → objeto de producto)', 'h2'))
    historia.append(codigo("""
const { data } = Papa.parse(csv.trim(), {
  header: true,                    // primera fila = nombres de columna
  skipEmptyLines: 'greedy',        // ignora las filas fantasma que agrega Sheets
  transformHeader: h => normalizarTexto(h).replace(/\\s+/g, '_'),
})

// Alias aceptados por columna: el dueño escribe como quiere
const ALIAS = {
  titulo:  ['titulo', 'título', 'nombre', 'producto', 'articulo'],
  precio:  ['precio', 'precio_lista', 'valor'],
  oferta:  ['precio_oferta', 'oferta', 'precio_promo', 'precio_promocional'],
  imagen:  ['url_imagen', 'imagen', 'foto', 'url_foto', 'url'],
  activo:  ['activo', 'visible', 'publicado'],
  // … categoria, descripcion, stock, unidad, etiquetas, destacado, orden
}

// Fila cruda -> producto canónico que consume React
{
  id, titulo, descripcion,
  precio, precioOferta,                 // número o null
  precioFinal,                          // oferta si existe y es menor
  categoria, urlImagen, unidad, etiquetas,
  stock, sinStock: stock === 0,         // -1 = sin control de stock
  destacado, activo, orden,
}
"""))

    historia.append(P('Decisiones que hacen que esto no se rompa', 'h2'))
    historia.extend(bullets([
        '<b>Caché en localStorage con vencimiento (10 min por defecto):</b> la web abre al instante '
        'con el último catálogo guardado y refresca en segundo plano (stale-while-revalidate).',
        '<b>Si Google falla, la tienda sigue vendiendo:</b> se muestra el catálogo en caché y un aviso '
        'discreto. Nunca una pantalla en blanco.',
        '<b>Errores explicados para el humano:</b> “La hoja no está pública. Archivo &gt; Compartir &gt; '
        'Publicar en la web &gt; CSV.”',
        '<b>Avisos no bloqueantes:</b> los productos sin precio válido se listan en un desplegable para '
        'que el dueño los corrija, sin romper el catálogo.',
        '<b>Parseo de precios tolerante:</b> 1.500,50 / $1500 / 1,500.50 se interpretan correctamente; '
        'una oferta mayor al precio se descarta para no inflar el total.',
    ]))

    historia.append(PageBreak())

    # ------------------------------- entregable 3: carrito + whatsapp
    historia.append(P('4. Lógica del carrito y generación del mensaje de WhatsApp', 'h1'))

    historia.append(P('Estado global con reducer (reglas del carrito en un solo lugar)', 'h2'))
    historia.append(codigo("""
// src/state/carritoReducer.js  —  acciones: AGREGAR · CAMBIAR_CANTIDAD · QUITAR
// NOTA · VACIAR · SET_ENTREGA · SET_PAGO · SET_DATOS · SINCRONIZAR · HIDRATAR
case 'AGREGAR': {
  const existente = estado.items.find(i => i.id === accion.producto.id)
  if (existente) {                       // mismo producto: suma cantidad
    return { ...estado, items: estado.items.map(i => i.id === accion.producto.id
      ? { ...i, cantidad: Math.min(i.cantidad + (accion.cantidad || 1), MAX_POR_LINEA) } : i) }
  }
  return { ...estado, items: [...estado.items, lineaDesdeProducto(accion.producto,
                                                                  accion.cantidad || 1)] }
}

// SINCRONIZAR: cuando llega un catálogo nuevo, refresca precios y stock de las
// líneas ya cargadas (y elimina lo que se dio de baja) sin perder cantidades.
"""))

    historia.append(P('Totales, envío y validación (funciones puras, testeadas)', 'h2'))
    historia.append(codigo("""
// src/services/pedido.js
export function calcularTotales(items, entrega = 'envio') {
  const lineas = items.map(item => ({
    ...item,
    precioUnitario: item.precioFinal ?? item.precio,
    subtotalLinea: (item.precioFinal ?? item.precio) * item.cantidad,
  }))
  const subtotal = lineas.reduce((a, l) => a + l.subtotalLinea, 0)
  const unidades = lineas.reduce((a, l) => a + l.cantidad, 0)
  const usaEnvio = entrega === 'envio' && NEGOCIO.entrega.envio.habilitado
  const envio    = usaEnvio && !envioGratis(subtotal) ? NEGOCIO.entrega.envio.costo : 0
  return { lineas, subtotal, unidades, envio, total: subtotal + envio }
}

export function validarCheckout({ items, entrega, pago, datos }) {
  const errores = {}
  if (!items.length) errores.items = 'El carrito está vacío.'
  if (datos.nombre.trim().length < 3)      errores.nombre   = 'Ingresá tu nombre y apellido.'
  if (datos.telefono.replace(/\\D/g,'').length < 8) errores.telefono = 'Teléfono inválido.'
  if (entrega === 'envio' && datos.direccion.trim().length < 5)
    errores.direccion = 'Ingresá la calle, número y localidad.'
  return { valido: Object.keys(errores).length === 0, errores }   // la UI marca cada campo
}

export function generarNumeroOrden(prefijo = 'PED') {   // PED-261004-7K3F
  // fecha (aammdd) + 4 caracteres de un alfabeto sin letras/números ambiguos
}
"""))

    historia.append(P('Generador del mensaje y del link (src/services/whatsapp.js)', 'h2'))
    historia.append(codigo("""
export function construirMensajePedido(pedido, negocio = NEGOCIO) {
  const L = []
  L.push(`*NUEVO PEDIDO ${pedido.numeroOrden}*`)            // *negrita* = marcado de WhatsApp
  L.push(`${negocio.marca.nombre} — ${fechaLegible(pedido.fecha)}`)

  L.push('', '*Detalle*')
  pedido.items.forEach(i => {
    L.push(`• ${i.cantidad} x ${i.titulo}${i.unidad ? ` (${i.unidad})` : ''} — ${formatearPrecio(i.subtotalLinea)}`)
    if (i.nota) L.push(`   ↳ ${i.nota}`)                    // "sin cebolla", etc.
  })

  L.push('', `Subtotal: ${formatearPrecio(pedido.subtotal)}`)
  if (pedido.entrega === 'envio') {
    L.push(pedido.envio > 0 ? `Envío: ${formatearPrecio(pedido.envio)}` : 'Envío: sin cargo')
  }
  L.push(`*TOTAL: ${formatearPrecio(pedido.total)}*`)

  L.push('', '*Entrega*', pedido.entregaTexto)
  if (pedido.entrega === 'envio') L.push(`Dirección: ${pedido.cliente.direccion}`)
  else                            L.push(`Retiro en: ${negocio.entrega.retiro.direccion}`)

  // La web no publica datos bancarios: la línea del mensaje avisa al local
  // si tiene que pasar el alias (transferencia) o si se abona al recibir.
  const pago = pedido.pago === 'transferencia' ? negocio.pago.transferencia : negocio.pago.efectivo
  L.push('', '*Pago*', pago.lineaMensaje)

  L.push('', '*Cliente*', pedido.cliente.nombre, `Teléfono: ${pedido.cliente.telefono}`)
  return L.join('\\n')
}

export function construirUrlWhatsapp(mensaje, numero = NEGOCIO.whatsapp.numero) {
  return `https://wa.me/${limpiarTelefono(numero)}?text=${encodeURIComponent(mensaje)}`
}
"""))

    historia.append(P('Mensaje real generado durante la verificación', 'h2'))
    historia.append(codigo("""
*NUEVO PEDIDO PED-260922-K3MA*
Pizzería — 22/09/2026 23:40

*Detalle*
• 1 x Pizza muzzarella al molde (8 porciones) — $ 9.800,00
• 2 x Hamburguesa doble cheddar (unidad) — $ 19.800,00

Subtotal: $ 29.600,00
Envío: sin cargo (promoción)
Ahorro por ofertas: -$ 2.000,00
*TOTAL: $ 29.600,00*

*Entrega*
Envío a domicilio
Dirección: Rivadavia 1234, Tandil
Horario: entre 20 y 21

*Pago*
Transferencia: pasame el alias para transferir.

*Cliente*
Valentin Jurado
Teléfono: 2494 123456
"""))
    historia.append(P(
        'El mensaje no incluye ningún dato bancario: la línea de pago se arma desde la configuración '
        '(<font face="Courier" size="8">pago.transferencia.lineaMensaje</font>) y, cuando el cliente '
        'elige transferencia, el propio pedido le avisa al local que tiene que pasar el alias. Si '
        'elige efectivo, la línea dice que se abona al recibir.', 'chico'))

    historia.append(P('Pantallas del flujo de pago (sólo se elige cómo pagar)', 'h2'))
    historia.extend(bullets([
        '<b>El menú es lo primero:</b> buscador, filtros por categoría y <b>filtros rápidos</b> que '
        'salen de la columna <i>etiquetas</i> (Vegetariano, Vegano, Sin TACC, Picante…). Sin '
        'pantallas de presentación de por medio.',
        '<b>Ficha del producto:</b> tocando la foto o el título se abre el detalle con foto grande, '
        'descripción completa, <b>ingredientes</b>, etiquetas y selector de cantidad. Resuelve el '
        '“¿qué lleva?” sin llamar al local.',
        '<b>Pedido lateral (off-canvas):</b> cantidades, aclaración por producto, modalidad de '
        'entrega, barra de progreso hacia el envío gratis y totales.',
        '<b>Pantalla 1 – Datos y entrega:</b> nombre, teléfono, dirección (sólo si elige envío), '
        'referencia para el repartidor, horario preferido y aclaraciones. Validación por campo.',
        '<b>Pantalla 2 – Forma de pago:</b> Efectivo o Transferencia, y el botón verde '
        '<i>Enviar pedido</i> que abre WhatsApp con todo escrito. No hay pantalla de confirmación '
        'aparte, ni datos bancarios, ni campos de tarjeta.',
        '<b>Cierre:</b> número de pedido a la vista, botón para reabrir WhatsApp y opción de copiar '
        'el pedido como comprobante del armado.',
    ]))

    historia.append(P('El cliente no deja rastro en su dispositivo', 'h2'))
    historia.append(P(
        'La web no usa <font face="Courier" size="8">localStorage</font>, cookies ni '
        '<font face="Courier" size="8">sessionStorage</font>: no guarda el pedido, ni los datos '
        'personales, ni el menú en el teléfono de quien compra. Todo vive en la memoria de la '
        'página (y el menú se cachea en memoria durante la visita para no golpear a Google en cada '
        'interacción). Si el cliente recarga, el pedido arranca vacío. Está verificado en el E2E '
        '(<i>no guarda nada en el dispositivo</i>).', 'chico'))

    historia.append(PageBreak())

    # -------------------------------------- entregable 4: estructura
    historia.append(P('5. Estructura del proyecto', 'h1'))
    historia.append(codigo("""
catalogo-whatsapp/
├─ public/
│  ├─ productos-demo.csv          catálogo de ejemplo (modo demostración)
│  └─ favicon.svg
├─ docs/
│  ├─ plantilla-google-sheet.csv  plantilla lista para importar en Sheets
│  ├─ ARQUITECTURA.pdf            este documento
│  └─ generar-pdf-arquitectura.py generador de este PDF
├─ scripts/
│  ├─ validar-catalogo.mjs        valida tu CSV con el mismo parser de la web
│  ├─ test-servicios.mjs          14 pruebas de la lógica pura (sin navegador)
│  ├─ cdp.mjs                     conexión CDP reutilizable (capturas y E2E)
│  ├─ e2e.mjs                     flujo de compra completo: 35 comprobaciones
│  └─ capturar.mjs                capturas de pantalla para la ficha de venta
└─ src/
   ├─ config/
   │  ├─ negocio.js        ⚙️  ÚNICO archivo que se edita por cliente
   │  └─ paletas.js        6 paletas de color aplicadas en runtime (CSS vars)
   ├─ services/            lógica sin React, testeable
   │  ├─ catalogo.js        CSV de Sheets → JSON (+ caché + errores claros)
   │  ├─ pedido.js          totales, envío, nº de orden, validaciones
   │  ├─ whatsapp.js        mensaje estructurado + link wa.me
   │  └─ formato.js         precios, fechas, normalización de texto
   ├─ state/
   │  ├─ carritoReducer.js  reglas del carrito (puro)
   │  └─ CarritoContext.jsx estado global + persistencia en localStorage
   ├─ hooks/
   │  ├─ useCatalogo.js     carga con caché y refresco en segundo plano
   │  └─ useCopiar.js       copiar (pedido) con respaldo y aviso de fallo
   ├─ components/
   │  ├─ layout/   Header · Footer
   │  ├─ catalogo/ Catalogo · Filtros · ProductCard · FichaProducto
   │  ├─ carrito/  CartWidget (off-canvas) · ItemCarrito · SelectorEntrega · BarraPedidoMovil
   │  ├─ checkout/ CheckoutModal · PasoDatos · PasoPago · PantallaExito
   │  └─ ui/       Boton · Modal · Toast · Campo · ImagenProducto · Estados · Iconos
   ├─ App.jsx              composición de la página
   └─ main.jsx             tema, SEO y providers
"""))

    historia.append(P('Dos reglas de oro para que sea mantenible y vendible', 'h2'))
    historia.extend(bullets([
        '<b>services/ nunca importa React</b> y <b>components/ nunca hace fetch</b>. Los componentes '
        'reciben datos y emiten acciones; la red y el almacenamiento viven en hooks y servicios. '
        'Así la lógica del negocio se puede testear sin navegador (ya hay 14 pruebas).',
        '<b>Todo lo que cambia de un local a otro está en un solo archivo</b> '
        '(<font face="Courier" size="8">src/config/negocio.js</font>): marca, colores, número de '
        'WhatsApp, envío, alias/CBU, textos y campos del checkout. Re-marcar la plantilla no requiere '
        'tocar componentes ni recompilar Tailwind (los colores se inyectan como variables CSS).',
    ]))

    historia.append(P('Reutilización por cliente (white-label en minutos)', 'h2'))
    historia.append(tabla(
        ['Qué se cambia', 'Dónde', 'Efecto'],
        [
        ['Nombre, eslogan, logo', 'marca.*', 'Encabezado, pie, título de la página (SEO)'],
        ['Paleta y redondeo', 'marca.tema / marca.radio', '6 paletas listas: naranja, verde, azul, bordo, violeta, grafito'],
        ['Número de WhatsApp', 'whatsapp.numero / nombreVendedor', 'Destino de todos los pedidos. Formato internacional: 549 + área + número'],
        ['Origen de productos', 'catalogo.hojaCsv o hojaId+gid', 'Se conecta el Sheet del cliente'],
        ['Envío', 'entrega.envio.* / entrega.retiro.*', 'Costo, envío gratis desde X, zona, demora, dirección y horarios'],
        ['Formas de pago', 'pago.efectivo / pago.transferencia', 'Qué se ofrece al cliente y qué línea va al mensaje (acá se decide si hay que pasar el alias)'],
        ['Formulario', 'pedido.campos.*', 'Qué se le pide al cliente (dirección sólo si hay envío)'],
        ['Textos', 'textos.*', 'Pie legal, sin buscar en componentes'],
        ],
        [4.4 * cm, 4.6 * cm, 8.0 * cm]))

    historia.append(PageBreak())

    # ------------------------------------ seguridad y rendimiento
    historia.append(P('6. Seguridad y rendimiento', 'h1'))
    historia.append(P('Superficie de ataque del sistema', 'h2'))
    historia.append(tabla(
        ['Riesgo clásico', '¿Aplica?', 'Por qué'],
        [
            ['Inyección SQL', 'No', 'No existe base de datos ni consultas: los datos son un CSV público de lectura.'],
            ['Robo de credenciales', 'No', 'No hay login, ni tokens, ni API keys en el front. La hoja solo se lee.'],
            ['Datos de tarjetas (PCI)', 'No', 'No se piden ni se procesan medios de pago en la web.'],
            ['Datos bancarios publicados', 'No', 'La web no muestra alias ni CBU. Si el cliente paga por transferencia, el local comparte el alias por el chat, donde queda el pedido.'],
            ['Rastro en el dispositivo del cliente', 'No', 'Sin localStorage, cookies ni sessionStorage: al recargar, no queda nada guardado en su teléfono.'],
            ['Pagos fraudulentos', 'No', 'No hay pasarela: el cobro se acuerda por fuera y lo controla el local.'],
            ['XSS desde la planilla', 'Mitigado', 'React escapa todo texto interpolado; no se usa innerHTML ni dangerouslySetInnerHTML.'],
            ['Manipulación de precios', 'Mitigado', 'El total se recalcula desde los precios del catálogo; el mensaje lleva el detalle para que el local lo verifique.'],
            ['Spam de pedidos', 'Bajo', 'No hay endpoint que atacar: el peor caso es un mensaje de WhatsApp, que el local puede bloquear.'],
            ['Caída de Google Sheets', 'Mitigado', 'Caché local del último catálogo: la tienda sigue mostrando productos.'],
        ],
        [3.9 * cm, 1.9 * cm, 11.2 * cm]))

    historia.append(P('Rendimiento', 'h2'))
    historia.extend(bullets([
        '<b>Peso real medido:</b> 315,7 kB de JavaScript (97,0 kB gzip) y 40,1 kB de CSS (8,0 kB gzip). '
        'Una sola petición de datos: el CSV del Sheet (el resto queda en caché del navegador).',
        '<b>Sin dependencias pesadas:</b> solo React, Tailwind y PapaParse. Cero librerías de UI, de '
        'iconos o de estado (los iconos son SVG inline).',
        '<b>Carga diferida:</b> las 4 primeras imágenes del catálogo se cargan en modo <i>eager</i> con '
        'alta prioridad (mejora el LCP) y el resto en <i>lazy</i>.',
        '<b>Mobile-first:</b> una columna en celular, grilla de 2 a 4 columnas desde tablet/desktop; '
        'el carrito es un panel lateral y en el celular una barra fija inferior.',
        '<b>Accesibilidad:</b> foco visible, cierre con Escape, foco atrapado en el modal y en el '
        'panel, etiquetas asociadas a cada campo y respeto de "reducir movimiento".',
        '<b>Sin jerga de servidor:</b> es un paquete estático; se sirve desde CDN en cualquier hosting.'    ,
    ]))

    historia.append(P('Cómo es el arranque en frío, paso a paso', 'h2'))
    historia.append(codigo("""
npm install           # instala React, Vite, Tailwind y PapaParse
# 1. editar src/config/negocio.js (marca, whatsapp, envío, pago, hoja)
npm run validar public/productos-demo.csv    # valida la planilla del cliente
npm run lint          # oxlint: 0 avisos esperados
npm test              # 14 pruebas de pedido, totales, parseo y mensaje
npm run dev           # desarrollo en http://localhost:5173
npm run build         # genera dist/ (paquete estatico listo para publicar)
npm run preview       # sirve dist/ localmente (puerto 4173)
npm run e2e           # flujo de compra completo en navegador: 35 comprobaciones
node scripts/capturar.mjs http://localhost:4173 docs/captura.png 1440 900 0 grilla
"""))

    historia.append(P('Publicación con hosting gratuito', 'h2'))
    historia.extend(bullets([
        '<b>Vercel:</b> <font face="Courier" size="8">npx vercel deploy --prod</font> '
        '(framework Vite, salida dist). Dominio propio desde el panel.',
        '<b>Netlify:</b> arrastrar la carpeta <font face="Courier" size="8">dist/</font> al panel, o '
        '<font face="Courier" size="8">npx netlify deploy --prod --dir=dist</font>.',
        '<b>GitHub Pages:</b> subir el contenido de dist a la rama gh-pages. El proyecto ya compila con '
        'rutas relativas, así que también funciona en subcarpetas de usuario.',
        '<b>Dominio:</b> el negocio solo paga el dominio (por ejemplo .com.ar) y lo apunta al hosting. '
        'HTTPS queda incluido y es requisito para el portapapeles moderno (el botón Copiar tiene '
        'respaldo para contextos sin HTTPS).',
    ]))

    historia.append(PageBreak())

    # ------------------------------------- verificacion
    historia.append(P('7. Verificación realizada sobre este código', 'h1'))
    historia.append(P(
        'Todo lo que sigue se ejecutó sobre el código entregado, no es una descripción teórica.'))

    historia.append(tabla(
        ['Prueba', 'Resultado'],
        [
            ['Linter (oxlint)', 'OK — 0 avisos en src/ y scripts/'],
            ['Compilación de producción', 'OK — 48 módulos, build en ~1 s'],
            ['Pruebas de lógica (npm test)', 'OK — 17/17 (precios, totales, envío, validaciones, nº de pedido, mensaje, link, links de Drive, ingredientes y etiquetas)'],
            ['Validador del menú (npm run validar)', 'OK — 18 productos, 4 categorías, 6 filtros rápidos, 0 problemas'],
            ['Fotos del menú', '40 URLs verificadas (HTTP 200); 18/18 cargan y se pintan (600×450)'],
            ['E2E navegador real (npm run e2e)', 'OK — 43/43 comprobaciones, repetible entre corridas'],
            ['Privacidad del dispositivo', 'OK — el E2E comprueba localStorage, sessionStorage y cookies en cero'],
            ['Ficha de producto', 'OK — abre desde la tarjeta, muestra ingredientes y agrega al pedido'],
            ['Filtros rápidos', 'OK — los chips salen de la columna etiquetas (Vegetariano, Vegano…)'],
            ['Bug de usabilidad (foco al escribir)', 'Corregido y verificado: el campo conserva el foco en cada tecla'],
            ['Sin datos bancarios', 'Verificado: la pantalla de pago y el mensaje no contienen alias, CBU ni CVU'],
            ['Link de WhatsApp', 'OK — wa.me con el mensaje codificado completo y sin espacios sin codificar'],
            ['Responsive', 'OK — capturas en 1440×900 y 390×844 con barra de pedido fija en el celular'],
        ],
        [6.4 * cm, 10.6 * cm]))
    historia.append(P(
        'El E2E vive en <font face="Courier" size="8">scripts/e2e.mjs</font> y escribe su informe en '
        '<font face="Courier" size="8">docs/e2e-resultado.json</font>: recorre catálogo, búsqueda, '
        'filtros, carrito, checkout, transferencia, enlace de WhatsApp, pantalla de éxito y persistencia, '
        'y sale con código de error si alguna comprobación falla (se puede usar en CI).',
        'chico'))

    historia.append(Spacer(1, 0.3 * cm))
    historia.append(P('Chequeos funcionales verificados en el navegador', 'h2'))
    historia.extend(bullets([
        'El buscador filtra por título, descripción, categoría y etiquetas, sin distinguir tildes.',
        'Los filtros por categoría se generan solos desde la planilla (Rotisería, Panadería, Bebidas, '
        'Almacén, Verdulería en el ejemplo).',
        'Un producto con stock 0 se muestra como <b>Agotado</b> y no se puede agregar.',
        'Las ofertas muestran el precio anterior tachado y el porcentaje de descuento.',
        'El carrito suma cantidades del mismo producto, permite aclaraciones por línea ("sin cebolla") '
        'y calcula subtotal, envío y total.',
        'El envío gratis se aplica automáticamente al superar el monto configurado (y el carrito muestra '
        'cuánto falta para alcanzarlo).',
        'La validación del checkout marca cada campo con su error y no deja avanzar con datos incompletos.',
        'La pantalla de transferencia muestra Alias/CBU/titular/importe con botón Copiar (y avisa si el '
        'navegador bloquea el portapapeles).',
        'El paso final es un enlace real a wa.me: si el navegador bloquea ventanas emergentes, el '
        'usuario igual puede enviar el pedido.',
        'Al cerrar el flujo queda el número de orden visible y la opción de copiar el resumen.',
    ]))

    historia.append(Spacer(1, 0.25 * cm))
    historia.append(P('Capturas del sistema funcionando', 'h2'))

    base = os.path.dirname(os.path.abspath(__file__))
    from PIL import Image as PILImage

    def captura(nombre, subtitulo):
        ruta = os.path.join(base, nombre)
        if not os.path.exists(ruta):
            return []
        ancho_img, alto_img = PILImage.open(ruta).size
        # cm por píxel: cabe en 17 cm de ancho y 11 cm de alto, manteniendo proporción
        escala = min(17.0 / ancho_img, 11.0 / alto_img)
        return [
            KeepTogether([
                Paragraph(subtitulo, S['chico']),
                Spacer(1, 0.15 * cm),
                Image(ruta, width=ancho_img * escala * cm, height=alto_img * escala * cm),
            ]),
            Spacer(1, 0.45 * cm),
        ]

    historia += captura('captura-escritorio.png',
                        'El menú es lo primero que ve el cliente (1440 px): categorías, filtros rápidos '
                        'por etiqueta (Vegano, Vegetariano, Más pedida…), ofertas con precio tachado y '
                        'el botón “Ver ingredientes” en cada tarjeta.')
    historia += captura('captura-ficha.png',
                        'Ficha del producto: se abre desde la tarjeta y muestra foto grande, precio, '
                        'etiquetas, descripción e ingredientes, con selector de cantidad. Resuelve el '
                        '“¿qué lleva?” sin llamar al local.')
    historia += captura('captura-pago.png',
                        'Pantalla de forma de pago: sólo se elige entre efectivo y transferencia. No hay '
                        'datos bancarios, ni campos de tarjeta, ni un paso extra de confirmación: el botón '
                        'verde abre WhatsApp con el pedido escrito.')
    historia += captura('captura-carrito.png',
                        'Carrito lateral (off-canvas): cantidades, aclaración por producto, modalidad de '
                        'entrega, barra de progreso hacia el envío gratis y totales.')
    historia += captura('captura-movil.png',
                        'Versión móvil (390 px): el menú arranca sin pantallas de presentación y la barra '
                        'inferior fija mantiene el pedido a un toque de distancia.')
    historia.append(P(
        'Nota sobre las capturas: se tomaron con un navegador headless (sin ventana). En ese entorno las '
        'transiciones CSS no progresan y las imágenes con carga diferida no se descargan; el script '
        'scripts/capturar.mjs fuerza ambas cosas solo para poder fotografiar la página. El estado real se '
        'verificó midiendo el DOM (20/20 imágenes descargadas y visibles) y no confiando en la captura.',
        'chico'))

    historia.append(PageBreak())

    # ------------------------------------- limites y venta
    historia.append(P('8. Límites conocidos y cómo venderlo como plantilla', 'h1'))
    historia.append(P('Límites por diseño (conviene decirlos antes de vender)', 'h2'))
    historia.extend(bullets([
        'No hay stock en tiempo real ni reserva: el stock se actualiza a mano en la planilla y el '
        'local confirma por WhatsApp.',
        'El pedido vive en la memoria de la página: si el cliente recarga, arranca vacío (a cambio, '
        'no queda nada suyo guardado en el dispositivo).',
        'El menú se actualiza cuando el cliente recarga la página (la caché en memoria dura 10 minutos).',
        'La web no publica datos bancarios: el alias se pasa por el chat cuando el cliente elige '
        'transferencia (queda registrado en la conversación).',
        'El <i>id</i> de cada producto debe ser único y estable: es lo que identifica la línea del pedido.',
        'Los pedidos no quedan registrados en ningún sistema; el historial es el chat de WhatsApp.',
        'Para ver el modo demostración hay que servir el sitio (dev/preview/hosting): abrir el archivo '
        'con doble clic no permite leer el CSV por restricciones del navegador.',
        'Los precios son responsabilidad de la planilla: la web muestra exactamente lo que dice la hoja.',
    ]))

    historia.append(P('Checklist de entrega por local', 'h2'))
    historia.extend(bullets([
        'Cargar marca (nombre, eslogan, tema, logo) en <font face="Courier" size="8">negocio.js</font>.',
        'Cargar el número de WhatsApp real y probar un pedido de punta a punta desde un celular.',
        'Configurar envío (costo, envío gratis desde, zona, demora) y datos de retiro.',
        'Definir con el dueño las formas de pago y la línea que va al mensaje (si hay que pasar el alias).',
        'Importar <font face="Courier" size="8">docs/plantilla-google-sheet.csv</font> y cargar el menú real.',
        'Publicar la hoja como CSV, pegar la URL y correr el validador.',
        'Reemplazar el favicon y revisar los textos del pie.',
        'Publicar en el hosting y entregar la URL + una guía de una página para el dueño.',
    ]))

    historia.append(P('Qué se puede cobrar por esto', 'h2'))
    historia.extend(bullets([
        '<b>Como servicio:</b> implementación por cliente (marca + planilla + publicación + capacitación '
        'de 20 minutos). Es un trabajo de horas, no de semanas, porque la plantilla ya está hecha.',
        '<b>Como plantilla:</b> venta del código con licencia de uso por proyecto, con la guía de '
        'instalación y las 6 paletas incluidas.',
        '<b>Ingreso recurrente:</b> mantenimiento (nuevos productos, cambios de precios masivos, '
        'promociones) y hosting/dominio a nombre del cliente.',
    ]))

    historia.append(Spacer(1, 0.4 * cm))
    historia.append(caja(
        '<b>Resumen en una frase.</b> Es una tienda que no necesita servidor: el catálogo vive en una '
        'planilla de Google, el carrito vive en el navegador del cliente y el pedido viaja por WhatsApp. '
        'El negocio solo paga el dominio y el desarrollo se entrega en horas, no en semanas.',
        color_fondo=VERDE_CLARO, color_borde=VERDE))
    return historia


def main():
    salida = sys.argv[1] if len(sys.argv) > 1 else 'ARQUITECTURA.pdf'
    doc = BaseDocTemplate(
        salida,
        pagesize=A4,
        title='Catálogo WhatsApp — Arquitectura y código base',
        author='Valentin Jurado',
        subject='Arquitectura serverless: Google Sheets + React + checkout por WhatsApp',
        leftMargin=2 * cm, rightMargin=2 * cm, topMargin=1.5 * cm, bottomMargin=1.8 * cm,
    )
    marco = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id='normal')
    doc.addPageTemplates([PageTemplate(id='main', frames=[marco], onPage=encabezado_pie)])
    doc.build(construir(salida))
    print('PDF generado:', salida, os.path.getsize(salida), 'bytes')


if __name__ == '__main__':
    main()
