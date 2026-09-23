/**
 * Campo de formulario con etiqueta, ayuda y error.
 * El id se deriva de la etiqueta normalizada (sin tildes) para que el <label>
 * quede correctamente asociado al input (accesibilidad + tests).
 */
import { normalizarTexto } from '../../services/formato.js'

export default function Campo({
  label,
  valor,
  onChange,
  error,
  ayuda,
  placeholder,
  tipo = 'text',
  obligatorio = false,
  autoComplete,
  inputMode,
  maxLength,
  children, // para <textarea>, <select> o render prop ({ id, clases })
}) {
  const id = `campo-${normalizarTexto(label).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`
  const clases = [
    'w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400',
    'transition focus:outline-none focus:ring-4',
    error
      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
      : 'border-slate-200 focus:border-brand-400 focus:ring-brand-50',
  ].join(' ')

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
        {obligatorio && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      {children ? (
        <div className={error ? '[&_input]:border-red-300 [&_textarea]:border-red-300' : ''}>
          {typeof children === 'function' ? children({ id, clases }) : children}
        </div>
      ) : (
        <input
          id={id}
          type={tipo}
          value={valor ?? ''}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          maxLength={maxLength}
          aria-invalid={Boolean(error)}
          className={clases}
        />
      )}

      {error ? (
        <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>
      ) : ayuda ? (
        <p className="mt-1.5 text-xs text-slate-500">{ayuda}</p>
      ) : null}
    </div>
  )
}

/** Área de texto reutilizable con el mismo estilo. */
export function AreaTexto({ id, valor, onChange, placeholder, filas = 3, clases = '' }) {
  return (
    <textarea
      id={id}
      rows={filas}
      value={valor ?? ''}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      className={`w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:outline-none focus:ring-4 focus:border-brand-400 focus:ring-brand-50 ${clases}`}
    />
  )
}
