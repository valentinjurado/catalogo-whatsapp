import { NEGOCIO } from '../../config/negocio'
import Campo from '../ui/Campo'
import SelectorEntrega from '../carrito/SelectorEntrega'
import { IconoEscudo } from '../ui/Iconos'

/**
 * Paso 1 — datos de contacto y entrega.
 * Sólo se piden los campos habilitados en negocio.js (pedido.campos).
 */
export default function PasoDatos({ entrega, datos, errores, onEntrega, onDatos }) {
  const campos = NEGOCIO.pedido.campos
  const pideDireccion = entrega === 'envio' && campos.direccion !== false
  const pideHorario = campos.horario && NEGOCIO.entrega.pedirHorario

  return (
    <div className="space-y-6">
      <SelectorEntrega entrega={entrega} onCambiar={onEntrega} />

      <div className="grid gap-4 sm:grid-cols-2">
        {campos.nombre && (
          <div className="sm:col-span-2">
            <Campo
              label="Nombre y apellido"
              obligatorio
              valor={datos.nombre}
              onChange={(v) => onDatos({ nombre: v })}
              error={errores.nombre}
              placeholder="Ej: Juan Pérez"
              autoComplete="name"
            />
          </div>
        )}

        {campos.telefono && (
          <Campo
            label="Teléfono de contacto"
            obligatorio
            valor={datos.telefono}
            onChange={(v) => onDatos({ telefono: v })}
            error={errores.telefono}
            placeholder="Ej: 2494 12 3456"
            tipo="tel"
            inputMode="tel"
            autoComplete="tel"
          />
        )}

        {campos.email && (
          <Campo
            label="Email"
            valor={datos.email}
            onChange={(v) => onDatos({ email: v })}
            placeholder="tu@email.com"
            tipo="email"
            autoComplete="email"
          />
        )}

        {pideDireccion && (
          <>
            <div className="sm:col-span-2">
              <Campo
                label="Dirección de entrega"
                obligatorio
                valor={datos.direccion}
                onChange={(v) => onDatos({ direccion: v })}
                error={errores.direccion}
                placeholder="Calle, número, piso/depto y localidad"
                ayuda={`Zona de reparto: ${NEGOCIO.entrega.envio.zonas}`}
                autoComplete="street-address"
              />
            </div>
            <div className="sm:col-span-2">
              <Campo
                label="Referencia para el repartidor"
                valor={datos.referencia}
                onChange={(v) => onDatos({ referencia: v })}
                placeholder="Ej: portón negro, tocar timbre 2"
              />
            </div>
          </>
        )}

        {pideHorario && (
          <Campo
            label={entrega === 'envio' ? 'Horario preferido de entrega' : 'Hora en que pasás a retirar'}
            valor={datos.horario}
            onChange={(v) => onDatos({ horario: v })}
            placeholder="Ej: entre 20 y 21 hs"
            ayuda={entrega === 'retiro' ? NEGOCIO.entrega.retiro.horarios : undefined}
          />
        )}

        <div className="sm:col-span-2">
          <Campo
            label="Aclaraciones del pedido"
            valor={datos.aclaraciones}
            onChange={(v) => onDatos({ aclaraciones: v })}
            placeholder="Ej: si no estoy, dejar con el portero"
          >
            {({ id, clases }) => (
              <textarea
                id={id}
                rows={2}
                value={datos.aclaraciones || ''}
                onChange={(e) => onDatos({ aclaraciones: e.target.value })}
                placeholder="Ej: si no estoy, dejar con el portero"
                className={clases}
              />
            )}
          </Campo>
        </div>
      </div>

      <p className="flex items-start gap-2.5 rounded-2xl bg-slate-50 p-3.5 text-xs text-slate-500">
        <IconoEscudo className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
        Usamos tus datos sólo para coordinar la entrega por WhatsApp. No hay cobros ni datos de
        tarjetas en este sitio.
      </p>
    </div>
  )
}
