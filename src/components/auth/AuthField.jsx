import { Eye, EyeOff } from 'lucide-react'

/**
 * Bordered, rounded text field with a leading icon, label, and an optional
 * password show/hide toggle. Presentation wrapper only — value/onChange/name/
 * type pass straight to a native <input>, so form logic is untouched.
 *
 * Props:
 *   id, name, type, value, onChange, autoComplete, inputMode, placeholder
 *   label       string
 *   icon        React element (lucide icon)
 *   required    bool
 *   error       string
 *   helper      string
 *   showToggle  bool     — render password show/hide button
 *   toggled     bool     — true = plaintext visible
 *   onToggle    () => void
 */
export default function AuthField({
  id,
  name,
  type = 'text',
  value,
  onChange,
  label,
  icon,
  required = false,
  error,
  helper,
  autoComplete,
  inputMode,
  placeholder,
  showToggle = false,
  toggled = false,
  onToggle,
}) {
  const inputId = id || name

  return (
    <div className="auth-field">
      {label && (
        <label className="auth-field__label" htmlFor={inputId}>
          {label}
          {required && <span className="auth-field__req">*</span>}
        </label>
      )}

      <div className="auth-field__box">
        {icon && <span className="auth-field__ico" aria-hidden="true">{icon}</span>}
        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          inputMode={inputMode}
          placeholder={placeholder}
          required={required}
          aria-invalid={error ? 'true' : undefined}
        />
        {showToggle && (
          <button
            type="button"
            className="auth-field__toggle"
            onClick={onToggle}
            aria-label={toggled ? 'Hide password' : 'Show password'}
          >
            {toggled ? <EyeOff /> : <Eye />}
          </button>
        )}
      </div>

      {error ? (
        <p className="auth-field__error">{error}</p>
      ) : helper ? (
        <p className="auth-field__helper">{helper}</p>
      ) : null}
    </div>
  )
}
