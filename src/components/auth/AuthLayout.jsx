import { Link } from 'react-router-dom'
import HeroScene from './HeroScene'
import '../../pages/auth/auth-theme.css'

/**
 * Two-column auth shell: animated hero panel (left) + form panel (right).
 * Presentation only.
 *
 * Props:
 *   heroHeadline / heroAccent / heroSubhead  strings for the hero copy
 *   children                                 the form content for the right panel
 */
export default function AuthLayout({ heroHeadline, heroAccent, heroSubhead, children }) {
  return (
    <div className="auth-shell">
      <HeroScene headline={heroHeadline} accent={heroAccent} subhead={heroSubhead} />

      <div className="auth-form-panel">
        <div className="auth-topbar">
          <span className="auth-topbar__brand">
            <MiniGlyph />
            Fieldstone
          </span>
          <Link to="/forgot-password" className="auth-link" style={{ fontWeight: 400, color: 'var(--ink-soft)' }}>
            Need help?
          </Link>
        </div>

        <div className="auth-form">{children}</div>
      </div>
    </div>
  )
}

function MiniGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18M5 21V9l7-5 7 5v12" />
      <circle cx="10" cy="12" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="14" cy="12" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}