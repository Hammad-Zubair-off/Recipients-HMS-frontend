/**
 * Underline floating-label input. Presentation wrapper only — it forwards
 * value/onChange/name/type straight through to a native <input>, so existing
 * form logic (field names, handlers, validation) is untouched.
 *
 * Props:
 *   id, name, type, value, onChange, autoComplete, inputMode
 *   label      string
 *   required   bool      — shows the red asterisk
 *   helper     string    — small helper line under the field
 *   error      string    — error line under the field
 *   showToggle bool      — render the password show/hide button
 *   toggled    bool      — current toggle state (true = text visible)
 *   onToggle   () => void
 */
export default function FloatingInput({
  id,
  name,
  type = 'text',
  value,
  onChange,
  label,
  required = false,
  helper,
  error,
  autoComplete,
  inputMode,
  showToggle = false,
  toggled = false,
  onToggle,
}) {
  const inputId = id || name

  return (
    <div>
      <div className={`float-field${showToggle ? ' has-toggle' : ''}`}>
        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder=" "
          autoComplete={autoComplete}
          inputMode={inputMode}
          required={required}
        />
        <label htmlFor={inputId}>
          {label}
          {required && <span className="field-req">*</span>}
        </label>

        {showToggle && (
          <button
            type="button"
            className="field-toggle"
            onClick={onToggle}
            aria-label={toggled ? 'Hide password' : 'Show password'}
          >
            {toggled ? <EyeOff /> : <Eye />}
          </button>
        )}
      </div>

      {helper && !error && <p className="field-helper">{helper}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  )
}

function Eye() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
function EyeOff() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.9 4.2A10.9 10.9 0 0 1 12 4c6 0 10 7 10 7a17 17 0 0 1-3.4 4M6.6 6.6A17 17 0 0 0 2 11s4 7 10 7a10.9 10.9 0 0 0 4.2-.8" />
      <path d="m3 3 18 18M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  )
}