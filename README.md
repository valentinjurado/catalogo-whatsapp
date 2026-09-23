# Menú + Carrito con pedido por WhatsApp

Plantilla de menú online para locales gastronómicos (pizzerías, hamburgueserías,
rotiserías, casas de comida): el cliente arma el pedido en la web y lo confirma por
WhatsApp. **Sin base de datos, sin backend, sin pasarela de pago y sin datos
bancarios publicados.** El panel de administración es un Google Sheet y el sitio es
estático (se publica gratis en Vercel, Netlify o GitHub Pages).

**Demo:** https://valentinjurado.github.io/catalogo-whatsapp/

```
Cliente                                    Dueño del local
──────                                     ───────────────
ve el menú        ◄── CSV público ◄──      Google Sheets (carga el menú)
arma el pedido
elige entrega (envío / retiro)
elige pago (efectivo / transferencia)
"Enviar pedido"  ──► wa.me + mensaje ──►   WhatsApp del local
                     estructurado         (si es transferencia, pasa el alias)
```

## 1. Arrancar

```bash
npm install
npm run dev            # http://localhost:5173
npm run build          # genera dist/ listo para publicar
npm run lint           # oxlint sobre src/ y scripts/ (esperado: 0 avisos)
npm test               # 15 pruebas de la lógica pura (sin navegador)
npm run validar:demo   # valida el CSV del menú con el mismo parser de la web
npm run preview        # sirve dist/ en http://localhost:4173
npm run e2e            # flujo de compra completo en un navegador real (38 comprobaciones)
```

Las herramientas de verificación necesitan un navegador Chromium con el puerto de
depuración abierto (las usan `npm run e2e` y `scripts/capturar.mjs`):

```bash
msedge.exe --headless=new --remote-debugging-port=9222 --user-data-dir=C:\tmp\edge-e2e --no-sandbox
```

## 2. Configurar el local (10 minutos)

Todo se edita en **`src/config/negocio.js`**:

| Sección | Qué define |
|---|---|
| `marca` | nombre, eslogan, `tema` (naranja/verde/azul/bordo/violeta/grafito), radio, logo |
| `whatsapp.numero` | número que recibe los pedidos (`549...`, sin + ni espacios) |
| `catalogo` | URL del Google Sheet (CSV publicado) o `hojaId` + `gid` |
| `entrega` | costo de envío, envío gratis desde X, zona, demora, dirección y horarios de retiro |
| `pago` | qué formas de pago se muestran y **qué línea va al mensaje** |
| `pedido` | mínimo de compra, moneda, qué campos se le piden al cliente |
| `textos` | textos libres (pie legal) |

El tema de color se aplica con variables CSS en tiempo de ejecución: cambiar
`marca.tema` **no requiere recompilar Tailwind** ni tocar componentes.

## 3. Administración del menú: el Google Sheet

No hay panel separado: **el Sheet es el panel**. Ahí se hace todo y la web lo refleja
sola (la URL de la hoja nunca cambia, no hay que tocar código ni volver a publicar).

| Quiero… | Qué hago en la planilla |
|---|---|
| **Agregar** un producto | Escribo una fila nueva al final con `id`, `titulo` y `precio` (lo demás es opcional) |
| **Modificar** precio o texto | Edito la celda. El cliente lo ve al recargar la página (máx. 10 minutos de caché) |
| **Eliminar** un producto | Opción limpia: pongo `no` en `activo` (deja de mostrarse y es reversible). Opción final: borro la fila |
| **Cambiar el stock** | `stock` = cantidad. Con `0` el producto se muestra **Agotado** y no se puede pedir. Vacío = sin control de stock |
| **Poner una oferta** | Escribo el precio rebajado en `precio_oferta`: se muestra tachado y con el % de descuento |
| **Reordenar** el menú | Uso la columna `orden` (1, 2, 3…) y `destacado = si` para los que van primero |
| **Categorías** | Las genera la columna `categoria` (ej. Pizzas, Hamburguesas, Bebidas); se arman los filtros solos |
| **Sacar una categoría** | Se deja de usar la palabra en `categoria` y desaparece del filtro |

Se puede editar desde el celular con la app de Google Sheets. No hay usuarios,
contraseñas ni panel que mantener. El dueño necesita tener la hoja en su cuenta de
Google (es gratis) y dejarla publicada como CSV una sola vez.

### Si algún día quiere un panel web con login y formularios

Posible sin cambiar la arquitectura, pero ya no es "cero backend":

1. **Google Apps Script** como API (gratis): una Web App que lee y escribe en la
   misma hoja, protegida con una clave; la web agrega una pantalla `/admin`. Es la
   opción más barata para seguir sin servidores.
2. **Backend real** (Supabase/Firebase): panel cómodo y multiusuario, pero agrega
   costos, cuentas y mantenimiento. Recién se justifica con varios locales, stock
   real con descuento automático o pedidos guardados en base.

### Columnas de la planilla

| Columna | Oblig. | Ejemplo | Notas |
|---|---|---|---|
| `id` | no | `PZ01` | Si falta se genera desde el título. **No repetir**: el carrito agrupa por id |
| `titulo` | **sí** | `Pizza muzzarella al molde` | Fila sin título = ignorada |
| `descripcion` | no | `Masa al molde, muzzarella y aceitunas` | Se recorta a 2 líneas en la tarjeta |
| `precio` | **sí** | `9800` o `9.800,50` | Acepta `$`, puntos y comas |
| `precio_oferta` | no | `8900` | Si es menor al precio: tachado + % de descuento |
| `categoria` | no | `Pizzas` | Arma los filtros del menú |
| `url_imagen` | no | `https://…jpg` | En Drive: `drive.google.com/uc?export=view&id=ID` |
| `stock` | no | `12` | `0` = Agotado. Vacío = sin control |
| `unidad` | no | `8 porciones` | Se muestra como `/ 8 porciones` junto al precio |
| `etiquetas` | no | `Más pedida,Promo` | Hasta 2 etiquetas, separadas por coma |
| `destacado` | no | `si` | Ordena primero |
| `activo` | no | `si` / `no` | `no` = no se publica (borrado lógico) |
| `orden` | no | `1` | Orden manual dentro de la categoría |

El parser tolera alias y no distingue mayúsculas ni tildes (`Título` = `titulo`,
`Imagen` = `url_imagen`, `si/true/1/x` = verdadero). Plantilla lista para importar:
`docs/plantilla-google-sheet.csv`.

> ⚠️ Si un texto lleva **comas** (por ejemplo `Docena con membrillo, crema y dulce`),
> la celda debe ir entre comillas al exportar a CSV. El validador
> (`npm run validar`) lo detecta antes de publicar.

### Publicar la hoja como CSV

**Opción A (recomendada):** Archivo → Compartir → **Publicar en la web** → elegir la
pestaña y el formato **CSV** → Publicar → pegar la URL en `catalogo.hojaCsv`.

**Opción B:** compartir como "cualquiera con el enlace puede ver" y pegar sólo el ID
del documento en `catalogo.hojaId` + el `gid` de la pestaña.

## 4. Flujo de compra

1. **Menú**: buscador, filtros por categoría y ordenamiento. Los productos aparecen
   primero, sin pantallas de presentación.
2. **Carrito lateral**: cantidades, aclaración por producto ("sin cebolla"), modalidad
   de entrega, barra de progreso hacia el envío gratis y totales.
3. **Checkout en dos pantallas**: datos y entrega → forma de pago.
4. **Pago**: el cliente sólo elige **Efectivo** o **Transferencia**. La web no publica
   alias, CBU ni ningún dato bancario: si elige transferencia, ese mismo pedido le
   avisa al local por el chat que tiene que pasar el alias.
5. **Enviar pedido**: se abre `wa.me` con el mensaje ya escrito (número de pedido,
   detalle, totales, entrega, pago y datos del cliente) y después se muestra el
   número de pedido para tenerlo a mano.

### Ejemplo del mensaje que le llega al local

```
*NUEVO PEDIDO PED-260922-K3MA*
Pizzería Don Mateo — 22/09/2026 23:40

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
```

## 5. Estructura del proyecto

```
├─ public/
│  ├─ productos-demo.csv        menú de ejemplo (modo demo)
│  └─ favicon.svg
├─ docs/
│  ├─ plantilla-google-sheet.csv
│  ├─ ARQUITECTURA.pdf          arquitectura, código, capturas y verificación
│  ├─ e2e-resultado.json        informe de la última corrida de npm run e2e
│  └─ generar-pdf-arquitectura.py
├─ scripts/
│  ├─ validar-catalogo.mjs      valida el CSV antes de publicar
│  ├─ test-servicios.mjs        15 pruebas de la lógica pura
│  ├─ cdp.mjs                   conexión CDP reutilizable (sin dependencias)
│  ├─ e2e.mjs                   flujo de compra completo (38 comprobaciones)
│  └─ capturar.mjs              capturas para la ficha de venta
└─ src/
   ├─ config/
   │  ├─ negocio.js             ⚙️ ÚNICO archivo a editar por local
   │  └─ paletas.js             6 paletas aplicadas en runtime (CSS vars)
   ├─ services/                 lógica sin React, testeable
   │  ├─ catalogo.js            CSV de Sheets → JSON (+ caché + errores claros)
   │  ├─ pedido.js              totales, envío, nº de pedido, validaciones
   │  ├─ whatsapp.js            mensaje estructurado + link wa.me
   │  └─ formato.js             precios, fechas, normalización de texto
   ├─ state/                    carrito global (reducer + persistencia)
   ├─ hooks/                    useCatalogo, useCopiar
   ├─ components/
   │  ├─ layout/    Header · Footer
   │  ├─ catalogo/  Catalogo · Filtros · ProductCard
   │  ├─ carrito/   CartWidget (off-canvas) · ItemCarrito · SelectorEntrega · BarraPedidoMovil
   │  ├─ checkout/  CheckoutModal · PasoDatos · PasoPago · PantallaExito
   │  └─ ui/        Boton · Modal · Toast · Campo · ImagenProducto · Estados · Iconos
   ├─ App.jsx
   └─ main.jsx
```

Reglas de la arquitectura: **`services/` no importa React** y **`components/` no hace
fetch**. La lógica de negocio se testea sin navegador (15 pruebas) y el flujo real se
verifica con el E2E (38 comprobaciones).

## 6. Publicar (hosting gratis)

```bash
npm run build          # genera dist/
```

- **Vercel**: `npx vercel deploy --prod` (framework Vite, salida `dist`)
- **Netlify**: arrastrar `dist/` o `npx netlify deploy --prod --dir=dist`
- **GitHub Pages**: subir el contenido de `dist/` a la rama `gh-pages`
  (`vite.config.js` usa rutas relativas, así que funciona en subcarpetas)

El local sólo paga el dominio (por ejemplo `.com.ar`).

## 7. Qué está verificado

| Prueba | Comando | Resultado |
|---|---|---|
| Linter | `npm run lint` | 0 avisos en `src/` y `scripts/` |
| Lógica pura | `npm test` | 15/15 (precios, totales, envío gratis, validaciones, nº de pedido, mensaje, link) |
| Menú del cliente | `npm run validar <csv\|url>` | 21/21 productos del demo, 0 problemas |
| Compilación | `npm run build` | 300 kB JS (93 kB gzip) + 37 kB CSS (8 kB gzip) |
| Flujo de compra E2E | `npm run e2e` | 38/38 comprobaciones, repetible entre corridas |

El E2E incluye un test específico de usabilidad: escribe letra por letra en el
formulario y verifica que el campo **no pierda el foco** (`el campo conserva el foco
mientras se escribe`). Informe en `docs/e2e-resultado.json`.

## 8. Límites conocidos (por diseño)

- No hay stock en tiempo real ni reserva: el local confirma por WhatsApp.
- El menú se actualiza cuando el cliente recarga la página (caché de 10 minutos).
- El `id` de cada producto debe ser único y estable: identifica la línea del carrito.
- Los pedidos no quedan guardados en ningún sistema: el historial es el chat.
- Para ver el modo demo hay que servir el sitio (`npm run dev`/`preview` o subirlo):
  abrir el archivo con doble clic no permite leer el CSV por restricciones del navegador.
- Los precios son responsabilidad de la planilla: la web muestra exactamente lo que dice.

## 9. Para presentarlo a un local

1. Cambiar en `negocio.js`: nombre, eslogan, `tema`, número de WhatsApp y datos de
   envío/retiro.
2. Cargar sus productos (o directamente conectar su Google Sheet ya publicado).
3. Publicar en el hosting y mostrarle la URL en el celular: que agregue, elija
   transferencia y vea el mensaje que llega a su WhatsApp.
4. Ajustar colores y fotos con su estilo, y dejar la planilla en manos del dueño.
