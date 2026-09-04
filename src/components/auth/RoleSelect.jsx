import { Stethoscope, Users, Check } from 'lucide-react'

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
  { value: 'doctor', title: 'Doctor / Clinician', descriptor: 'Manage patients and provide care', icon: Stethoscope },
  { value: 'receptionist', title: 'Front Desk / Staff', descriptor: 'Manage appointments and operations', icon: Users },
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
                <span className="role-card__top">
                  <span className="role-card__ico">
                    <Icon strokeWidth={1.8} />
                  </span>
                  <span className="role-card__check" aria-hidden="true">
                    <Check strokeWidth={3} />
                  </span>
                </span>
                <span className="role-card__txt">
                  <b>{opt.title}</b>
                  <span>{opt.descriptor}</span>
                </span>
              </label>
            </div>
          )
        })}
      </div>
    </fieldset>
  )
}
