import { NEGOCIO } from '../../config/negocio'
import { formatearPrecio } from '../../services/formato'
import { IconoEscudo, IconoMoto, IconoReloj, IconoTienda } from '../ui/Iconos'

/** Bloque de presentación. Limpio, con aire y datos concretos del local. */
export default function Hero() {
  const { marca, textos, entrega, pago } = NEGOCIO
  const { envio, retiro } = entrega

  const datos = [
    envio.habilitado && {
      icono: <IconoMoto className="w-4 h-4" />,
      titulo: 'Envío a domicilio',
      detalle: envio.gratisDesde
        ? `Sin cargo desde ${formatearPrecio(envio.gratisDesde)}`
        : `Costo ${formatearPrecio(envio.costo)}`,
    },
    retiro.habilitado && {
      icono: <IconoTienda className="w-4 h-4" />,
      titulo: 'Retiro en el local',
      detalle: retiro.horarios,
    },
    {
      icono: <IconoReloj className="w-4 h-4" />,
      titulo: 'Demora estimada',
      detalle: envio.habilitado ? envio.demora : retiro.demora,
    },
    {
      icono: <IconoEscudo className="w-4 h-4" />,
      titulo: 'Sin pagos online',
      detalle: [pago.efectivo.habilitado && 'Efectivo', pago.transferencia.habilitado && 'Transferencia']
        .filter(Boolean)
        .join(' · '),
    },
  ].filter(Boolean)

  return (
    <section className="border-b border-slate-200/70 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
            {textos.heroBadge}
          </span>

          <h1 className="mt-5 text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-[1.1]">
            {textos.heroTitulo}
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            {textos.heroSubtitulo}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#catalogo"
              className="inline-flex items-center justify-center h-12 rounded-2xl bg-brand-600 px-6 text-sm font-semibold text-white shadow-sm shadow-brand-600/20 transition hover:bg-brand-700"
            >
              Ver el catálogo
            </a>
            <span className="inline-flex items-center gap-2 h-12 rounded-2xl border border-slate-200 px-5 text-sm text-slate-600">
              <IconoEscudo className="w-4 h-4 text-brand-600" />
              {textos.avisoSinTarjetas}
            </span>
          </div>
        </div>

        <dl className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {datos.map((d) => (
            <div key={d.titulo} className="tarjeta flex items-start gap-3 p-4">
              <span className="shrink-0 grid place-items-center w-9 h-9 rounded-xl bg-brand-50 text-brand-700">
                {d.icono}
              </span>
              <div className="min-w-0">
                <dt className="text-sm font-semibold text-slate-800">{d.titulo}</dt>
                <dd className="text-xs text-slate-500 mt-0.5">{d.detalle}</dd>
              </div>
            </div>
          ))}
        </dl>

        <p className="sr-only">{marca.descripcion}</p>
      </div>
    </section>
  )
}
