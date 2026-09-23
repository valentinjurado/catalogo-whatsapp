# Catálogo WhatsApp — plantilla white-label para negocios locales

**Demo online:** https://valentinjurado.github.io/catalogo-whatsapp/ (catálogo de ejemplo, 20 productos)

Web de catálogo + carrito que termina en un pedido por WhatsApp.
**Sin base de datos, sin backend, sin pasarela de pago.** El "panel de administración"
es un Google Sheet y el sitio es estático (se publica gratis en Vercel, Netlify o
GitHub Pages).

```
Cliente                                 Dueño del local
──────                                  ───────────────
navega catálogo  ◄── CSV público ──     Google Sheets (carga productos)
arma carrito
elige entrega (envío / retiro)
elige pago (efectivo / transferencia)
confirma  ──────► wa.me + mensaje estructurado ──────►  WhatsApp del local
```

## 1. Arrancar

```bash
npm install
npm run dev            # http://localhost:5173
npm run build          # genera dist/ listo para publicar
npm run lint           # oxlint sobre src/ y scripts/ (esperado: 0 avisos)
npm test               # 14 pruebas de la lógica pura (sin navegador)
npm run validar:demo   # valida el CSV de ejemplo con el mismo parser de la web
npm run preview        # sirve dist/ en http://localhost:4173
npm run e2e            # flujo de compra completo en un navegador real (35 comprobaciones)
```

Las herramientas de verificación necesitan un navegador Chromium con el puerto de
depuración abierto (lo usan `npm run e2e` y `scripts/capturar.mjs`):

```bash
# ejemplo en Windows (perfil temporal, no toca tu navegador personal)
msedge.exe --headless=new --remote-debugging-port=9222 --user-data-dir=C:\tmp\edge-e2e --no-sandbox
```

## 2. Configurar el negocio (10 minutos)

Todo se edita en **`src/config/negocio.js`**. Nada más:

| Sección | Qué define |
|---|---|
| `marca` | nombre, eslogan, `tema` (verde/azul/bordo/naranja/violeta/grafito), `radio`, logo |
| `whatsapp` | número que recibe los pedidos (formato `549...`) y nombre del vendedor |
| `catalogo` | URL del Google Sheet (CSV publicado) o `hojaId` + `gid` |
| `entrega` | costo de envío, envío gratis desde X, zona, demora, dirección de retiro, horarios |
| `pago` | efectivo sí/no, alias, CBU, titular, banco, textos del aviso |
| `pedido` | mínimo de compra, moneda, qué campos se le piden al cliente |
| `textos` | todos los textos de portada y avisos |

El tema de color se aplica por variables CSS en tiempo de ejecución: **cambiar
`marca.tema` no requiere recompilar Tailwind** ni tocar componentes.

## 3. Google Sheet como base de datos

### Columnas (la fila 1 debe tener exactamente estos encabezados)

| Columna | Obligatoria | Ejemplo | Notas |
|---|---|---|---|
| `id` | no | `MIL01` | Si falta, se genera desde el título. **No repetir**: el carrito los mezcla |
| `titulo` | **sí** | `Milanesa napolitana` | Fila sin título = ignorada |
| `descripcion` | no | `Con muzzarella y guarnición` | Se recorta a 2 líneas en la tarjeta |
| `precio` | **sí** | `8500` o `8.500,50` | Acepta `$`, puntos y comas |
| `precio_oferta` | no | `7500` | Si es menor al precio, se muestra tachado + `%` de descuento |
| `categoria` | no | `Rotisería` | Genera los filtros de arriba del catálogo |
| `url_imagen` | no | `https://...jpg` | Google Drive: usar `https://drive.google.com/uc?export=view&id=ID` |
| `stock` | no | `12` | `0` = Agotado (no se puede agregar). Vacío = sin control de stock |
| `unidad` | no | `kg`, `docena` | Se muestra como `/ kg` al lado del precio |
| `etiquetas` | no | `Popular,Oferta` | Máx. 2 por producto, separadas por coma |
| `destacado` | no | `si` | Los destacados aparecen primero |
| `activo` | no | `si` o `no` | `no` = no se publica (borrado lógico) |
| `orden` | no | `1`, `2`, `3` | Orden manual dentro de la categoría |

El parser acepta alias y no distingue mayúsculas ni tildes: `Título`=`titulo`,
`Imagen`=`url_imagen`, `Precio Oferta`=`precio_oferta`, y `si/true/1/x` valen
como verdadero.

Plantilla lista para importar: `docs/plantilla-google-sheet.csv`
(Google Sheets → Archivo → Importar → Subir → *Reemplazar hoja de cálculo*).

### Publicar como CSV

**Opción A (recomendada):** Archivo → Compartir → **Publicar en la web** →
pestaña de productos → formato **CSV** → Publicar → copiar la URL → pegarla en
`catalogo.hojaCsv`.

**Opción B:** dejar la hoja como "cualquiera con el enlace puede ver" y pegar
sólo el ID en `catalogo.hojaId` (+ `gid` de la pestaña; el `gid` está al final
de la URL, después de `#gid=`).

> Editar la hoja nunca rompe la web: si Google falla, el sitio sigue mostrando
> el último catálogo guardado en el navegador del cliente.

## 4. Estructura del proyecto

```
catalogo-whatsapp/
├─ public/
│  ├─ productos-demo.csv        # catálogo de ejemplo (modo demo)
│  └─ favicon.svg
├─ docs/
│  ├─ plantilla-google-sheet.csv
│  ├─ ARQUITECTURA.pdf          arquitectura + código + capturas + verificación
│  ├─ e2e-resultado.json        informe de la última corrida de npm run e2e
│  └─ generar-pdf-arquitectura.py
├─ scripts/
│  ├─ validar-catalogo.mjs      valida tu CSV antes de publicar
│  ├─ test-servicios.mjs        14 pruebas de la lógica pura
│  ├─ cdp.mjs                   conexión CDP reutilizable (sin dependencias)
│  ├─ e2e.mjs                   flujo de compra completo (35 comprobaciones)
│  └─ capturar.mjs              capturas para la ficha de venta
└─ src/
   ├─ config/
   │  ├─ negocio.js             # ⚙️ ÚNICO archivo a editar por negocio
   │  └─ paletas.js             # colores y tema en runtime
   ├─ services/                 # lógica sin React (testeable)
   │  ├─ catalogo.js            # CSV de Sheets → JSON (+ caché + reintentos)
   │  ├─ pedido.js              # totales, número de orden, validaciones
   │  ├─ whatsapp.js            # mensaje estructurado + link wa.me
   │  └─ formato.js             # precios, fechas, normalización de texto
   ├─ state/
   │  ├─ carritoReducer.js      # reglas del carrito (puro)
   │  └─ CarritoContext.jsx     # estado global + persistencia
   ├─ hooks/
   │  ├─ useCatalogo.js         # fetch + caché + estado de carga
   │  └─ useCopiar.js           # copiar alias/CBU con respaldo
   ├─ components/
   │  ├─ layout/    Header · Hero · Footer
   │  ├─ catalogo/  Catalogo · Filtros · ProductCard
   │  ├─ carrito/   CartWidget (off-canvas) · ItemCarrito · SelectorEntrega · BarraPedidoMovil
   │  ├─ checkout/  CheckoutModal · PasoDatos · PasoPago · DatosTransferencia · PasoConfirmar · PantallaExito
   │  └─ ui/        Boton · Modal · Toast · Campo · ImagenProducto · Estados · Iconos
   ├─ App.jsx
   └─ main.jsx
```

Regla de oro de la arquitectura: **`services/` no importa React** y
**`components/` no hace fetch**. Los componentes reciben datos y emiten
acciones; los efectos (red, almacenamiento) viven en hooks y servicios.

## 5. Flujo del pedido

1. **Carrito lateral** (`CartWidget`): cantidades, notas por producto, modalidad
   de entrega, barra de progreso hacia el envío gratis y totales.
2. **CheckoutModal en 3 pasos**: datos y entrega → forma de pago → confirmar.
3. **Pago**: si elige *transferencia*, se muestran alias/CBU/titular con botón
   *Copiar* y el recordatorio de adjuntar el comprobante. Si elige *efectivo*,
   se aclara que se abona al recibir. **Nunca se piden datos de tarjeta.**
4. **Confirmación**: se genera un número de orden (`PED-261004-7K3F`), se arma el
   mensaje y se abre `https://wa.me/<numero>?text=<mensaje codificado>`.
5. **Pantalla de éxito**: número de orden, botón para reabrir WhatsApp y
   "copiar resumen".

### Ejemplo real de mensaje generado

```
*NUEVO PEDIDO PED-261004-7K3F*
Almacén Doña Rosa — 04/10/2026 20:14

*Detalle del pedido*
• 2 x Milanesa napolitana (porción) — $17.000,00
   ↳ Nota: sin cebolla
• 1 x Coca-Cola 1,5 L — $2.900,00

Subtotal (3 ítems): $19.900,00
Envío: sin cargo (promoción)
Ahorro por ofertas: -$1.800,00
*TOTAL: $19.900,00*

*Entrega*
Modalidad: Envío a domicilio
Dirección: Rivadavia 1234, Tandil
Horario preferido: entre 20 y 21 hs

*Pago*
Forma de pago: Transferencia bancaria
Alias: almacen.donarosa.mp
Ya realicé el pago al alias indicado, te adjunto el comprobante.

*Cliente*
Nombre: Juan Pérez
Teléfono: 2494 123456
```

## 6. Publicar (hosting gratis)

```bash
npm run build          # genera dist/
```

- **Vercel**: `npx vercel deploy --prod` (framework: Vite, output `dist`).
- **Netlify**: arrastrar `dist/` o `npx netlify deploy --prod --dir=dist`.
- **GitHub Pages**: subir el contenido de `dist/` a la rama `gh-pages`.
  `vite.config.js` ya usa `base: './'`, así que funciona en subcarpetas.

El negocio sólo paga el dominio (ej. `.com.ar`).

## 7. Modo demo

Sin `hojaCsv`/`hojaId` configurados, la web carga `public/productos-demo.csv`
y muestra un cartel de "Modo demostración". Es la forma de mostrarle la
plantilla a un cliente antes de tener sus productos.

## 8. Checklist antes de entregar a un cliente

- [ ] `marca.nombre`, `eslogan`, `tema`, `radio` y logo definidos.
- [ ] `whatsapp.numero` con el número real (probarlo desde un celular).
- [ ] `entrega.envio.costo`, `gratisDesde`, `zonas`, `demora` y datos de retiro.
- [ ] `pago.transferencia.alias`/`cbu`/`titular` verificados con el dueño.
- [ ] Google Sheet publicado como CSV y `npm run validar <url>` sin errores.
- [ ] Prueba completa desde el celular: agregar → confirmar → revisar el
      mensaje que llega al WhatsApp del local.
- [ ] Reemplazar `public/favicon.svg` por el logo del negocio.

## 9. Qué está verificado

| Prueba | Comando | Resultado |
|---|---|---|
| Linter | `npm run lint` | 0 avisos en `src/` y `scripts/` |
| Lógica pura | `npm test` | 14/14 (precios, totales, envío gratis, validaciones, nº de orden, mensaje, link) |
| Planilla del cliente | `npm run validar <csv\|url>` | 20/20 productos del demo, 0 problemas |
| Compilación | `npm run build` | 315 kB JS (97 kB gzip) + 40 kB CSS (8 kB gzip) |
| Flujo de compra E2E | `npm run e2e` | 35/35 comprobaciones, repetible entre corridas |

El E2E recorre catálogo → búsqueda → filtros → carrito → checkout → transferencia →
enlace de WhatsApp (mensaje decodificado y validado) → pantalla de éxito → persistencia,
y sale con código de error si algo falla (sirve para CI). Informe en `docs/e2e-resultado.json`.

## 10. Límites conocidos (por diseño)

- No hay stock real en tiempo real ni reserva: el local confirma por WhatsApp.
- El `id` de cada producto debe ser único y estable (identifica la línea del carrito).
- Los precios se muestran tal como están en la hoja; el "pago" es siempre offline.
- Formato de WhatsApp: `*negrita*` es su sintaxis nativa (no se escapan asteriscos).
