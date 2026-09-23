import { useState } from 'react'

/**
 * Imagen del producto con estados de carga y respaldo.
 *
 * El estado se resuelve con los eventos del propio <img>; además, al montar el
 * nodo se consulta `complete`, que es la foto instantánea de la caché del
 * navegador (si la imagen ya estaba descargada, `load` no vuelve a dispararse).
 * `key={src}` fuerza un nodo nuevo cuando cambia la URL, así el estado arranca
 * limpio sin necesidad de efectos.
 *
 * Si la URL está vacía o rota, se muestra un marcador con la inicial del
 * producto (nunca el ícono de imagen rota del navegador).
 *
 * `prioridad` = true en las primeras tarjetas de la grilla: carga inmediata y
 * alta prioridad de red (mejora el LCP). El resto se carga en diferido.
 */
export default function ImagenProducto({
  src,
  alt,
  className = '',
  proporcion = 'aspect-[4/3]',
  prioridad = false,
}) {
  const [estado, setEstado] = useState(src ? 'cargando' : 'sin-imagen')

  const inicial = (alt || '?').trim().charAt(0).toUpperCase()

  return (
    <div className={`relative overflow-hidden bg-slate-100 ${proporcion} ${className}`}>
      {estado === 'cargando' && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-100 to-slate-200" />
      )}

      {estado === 'error' || estado === 'sin-imagen' ? (
        <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-brand-50 to-slate-100">
          <span className="text-4xl font-semibold text-brand-600/40 select-none">{inicial}</span>
        </div>
      ) : (
        <img
          key={src}
          src={src}
          alt={alt}
          loading={prioridad ? 'eager' : 'lazy'}
          fetchPriority={prioridad ? 'high' : 'auto'}
          decoding="async"
          ref={(nodo) => {
            // Imagen ya en caché: el evento load no se repite, hay que leerla acá.
            if (nodo?.complete) setEstado(nodo.naturalWidth > 0 ? 'listo' : 'error')
          }}
          onLoad={() => setEstado('listo')}
          onError={() => setEstado('error')}
          className={[
            'absolute inset-0 w-full h-full object-cover transition-all duration-500',
            estado === 'listo' ? 'opacity-100 scale-100' : 'opacity-0 scale-105',
          ].join(' ')}
        />
      )}
    </div>
  )
}
