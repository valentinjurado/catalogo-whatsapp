import { useCallback, useEffect, useRef, useState } from 'react'
import { cacheVencido, catalogoEnCache, obtenerCatalogo } from '../services/catalogo.js'

/**
 * Hook que expone el catálogo a la UI con estado de carga, error y recarga.
 *
 * Estrategia stale-while-revalidate: el primer render ya sale pintado con la
 * caché local (inicializador perezoso de useState, sin efectos), y si esa caché
 * venció se refresca desde Google en segundo plano. Si Google falla, la web
 * sigue viva con lo último guardado.
 *
 * `traer` no toca el estado de forma sincrónica (sólo después del await), así el
 * efecto de montaje se limita a disparar la promesa. El indicador "actualizando"
 * lo prende `recargar`, que sí nace de un click del usuario.
 */
const VACIO = {
  cargando: true,
  refrescando: false,
  error: null,
  avisos: [],
  productos: [],
  categorias: [],
  actualizado: null,
  demo: false,
  desdeCache: false,
}

export function useCatalogo({ sincronizarCarrito } = {}) {
  const [estado, setEstado] = useState(() => {
    const cache = catalogoEnCache()
    return cache ? { ...VACIO, ...cache, cargando: false } : VACIO
  })
  const montado = useRef(true)

  const traer = useCallback(
    async (forzar = false) => {
      try {
        const datos = await obtenerCatalogo({ forzar })
        if (!montado.current) return
        setEstado((prev) => ({
          ...prev,
          cargando: false,
          refrescando: false,
          error: null,
          productos: datos.productos || [],
          categorias: datos.categorias || [],
          avisos: datos.avisos || [],
          actualizado: datos.actualizado || prev.actualizado,
          demo: Boolean(datos.demo),
          desdeCache: Boolean(datos.desdeCache),
        }))
        sincronizarCarrito?.(datos.productos || [])
      } catch (error) {
        // Si falla la red conservamos lo que ya había en pantalla
        if (!montado.current) return
        setEstado((prev) => ({ ...prev, cargando: false, refrescando: false, error: error.message }))
      }
    },
    [sincronizarCarrito],
  )

  const recargar = useCallback(() => {
    setEstado((prev) => ({ ...prev, refrescando: true }))
    return traer(true)
  }, [traer])

  useEffect(() => {
    montado.current = true
    // Sólo se consulta a Google si lo cacheado ya venció (o si no hay caché).
    // `traer` no llama a setState de forma sincrónica (sólo después del await):
    // el aviso de la regla es un falso positivo.
    // oxlint-disable-next-line react/set-state-in-effect
    if (cacheVencido(catalogoEnCache())) traer(false)
    return () => {
      montado.current = false
    }
  }, [traer])

  return {
    ...estado,
    vacio: !estado.cargando && estado.productos.length === 0,
    recargar,
  }
}
