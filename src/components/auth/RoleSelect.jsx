/**
 * Role selector — two radio cards. Presentation only; the option VALUES
 * ('doctor' / 'receptionist') are unchanged from the previous UI so the
 * existing auth logic keeps working.
 *
 * Props:
 *   legend    string   — fieldset legend text
 *   name      string   — radio group name
 *   value     string   — currently selected value ('doctor' | 'receptionist' | '')
 *   onChange  (value: string) => void
 */
const OPTIONS = [
  { value: 'doctor', title: 'Doctor', descriptor: 'Charts, orders, rounds', icon: DoctorIcon },
  { value: 'receptionist', title: 'Front desk', descriptor: 'Scheduling, check-in', icon: DeskIcon },
]

export default function RoleSelect({ legend, name, value, onChange }) {
  return (
    <fieldset className="role-select">
      <legend>{legend}</legend>
      <div className="role-grid">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon
          return (
            <div className="role-card" key={opt.value}>
              <input
                className="role-card__input"
                type="radio"
                id={`${name}-${opt.value}`}
                name={name}
                value={opt.value}
                checked={value === opt.value}
                onChange={() => onChange(opt.value)}
              />
              <label className="role-card__box" htmlFor={`${name}-${opt.value}`}>
                <span className="role-card__ico">
                  <Icon />
                </span>
                <span className="role-card__txt">
                  <b>{opt.title}</b>
                  <span>{opt.descriptor}</span>
                </span>
                <svg className="role-card__check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </label>
            </div>
          )
        })}
      </div>
    </fieldset>
  )
}

function DoctorIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="7" r="3.2" />
      <path d="M5.5 21c0-4 2.9-6.5 6.5-6.5S18.5 17 18.5 21" />
      <path d="M9 15.2v1.8a3 3 0 0 0 6 0v-1.3" />
    </svg>
  )
}
function DeskIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="7" r="3.2" />
      <path d="M4 20c0-3.6 3.6-6 8-6s8 2.4 8 6" />
      <path d="M3 20h18" />
    </svg>
  )
}