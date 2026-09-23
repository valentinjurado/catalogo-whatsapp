import { useEffect, useRef, useState } from 'react'
import { IconoImagen } from './Iconos'

/**
 * Imagen del producto con estados de carga y respaldo.
 *
 * El estado se resuelve con los eventos del propio <img>; además, al montar el
 * nodo se consulta `complete` (caché del navegador) y se re-chequea a los 800 ms
 * por si el evento se disparó antes de que React enganchara el handler.
 *
 * `srcAlt` es un segundo link para la misma foto (los links de Google Drive
 * tienen dos formatos y no siempre funciona el mismo): si el primero falla, se
 * prueba el segundo y recién ahí se muestra el marcador con la inicial.
 *
 * `prioridad` = true para las primeras tarjetas de la grilla (carga inmediata y
 * mejor LCP); el resto se carga en diferido.
 */
export default function ImagenProducto({
  src,
  srcAlt,
  alt = '',
  prioridad = false,
  proporcion = 'aspect-[4/3]',
  className = 'w-full',
}) {
  const [estado, setEstado] = useState(src ? 'cargando' : 'sin-imagen')
  const [fuente, setFuente] = useState(src || '')
  const [reintentando, setReintentando] = useState(false)
  const [srcPrevio, setSrcPrevio] = useState(src)
  const ref = useRef(null)

  // Si cambia la URL de la foto, se vuelve a empezar con el link principal.
  // Se hace durante el render (patrón sugerido por React) y no en un efecto:
  // así no hay un render intermedio mostrando la foto vieja.
  if (srcPrevio !== src) {
    setSrcPrevio(src)
    setFuente(src || '')
    setReintentando(false)
    setEstado(src ? 'cargando' : 'sin-imagen')
  }

  // Si la imagen ya estaba en caché, el evento load puede no dispararse
  useEffect(() => {
    const img = ref.current
    if (!img) return
    if (img.complete && img.naturalWidth > 0) setEstado('listo')
    else if (img.complete && img.naturalWidth === 0 && !reintentando && srcAlt) {
      setFuente(srcAlt)
      setReintentando(true)
    }
    const t = setTimeout(() => {
      const actual = ref.current
      if (actual?.complete && actual.naturalWidth > 0) setEstado('listo')
    }, 800)
    return () => clearTimeout(t)
  }, [fuente, reintentando, srcAlt])

  const alFallar = () => {
    if (srcAlt && !reintentando) {
      setFuente(srcAlt) // se prueba el otro formato del link (Google Drive)
      setReintentando(true)
      return
    }
    setEstado('error')
  }

  const inicial = (alt || '?').trim().charAt(0).toUpperCase() || '?'

  return (
    // El ancho lo define quien lo usa (className): así una miniatura del carrito
    // (w-20) no hereda el w-full de la tarjeta del menú.
    <div className={`relative ${proporcion} overflow-hidden bg-slate-100 ${className}`}>
      {(estado === 'cargando' || (reintentando && estado !== 'listo')) && (
        <div className="absolute inset-0 animate-pulse bg-slate-200" aria-hidden="true" />
      )}

      {(estado === 'error' || estado === 'sin-imagen') && (
        <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-brand-50 to-slate-100">
          <div className="text-center">
            <span className="block text-3xl font-bold text-brand-600/70">{inicial}</span>
            <IconoImagen className="mx-auto mt-1 w-5 h-5 text-slate-300" />
          </div>
        </div>
      )}

      {estado !== 'error' && estado !== 'sin-imagen' && fuente && (
        <img
          ref={ref}
          key={fuente}
          src={fuente}
          alt={alt}
          loading={prioridad ? 'eager' : 'lazy'}
          fetchPriority={prioridad ? 'high' : 'auto'}
          decoding="async"
          onError={alFallar}
          onLoad={() => setEstado('listo')}
          className={[
            'absolute inset-0 w-full h-full object-cover transition-all duration-500',
            estado === 'listo' ? 'opacity-100 scale-100' : 'opacity-0 scale-105',
          ].join(' ')}
        />
      )}
    </div>
  )
}
