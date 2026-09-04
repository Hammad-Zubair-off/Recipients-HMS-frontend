import { useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import HeroScene from './HeroScene'
import '../../pages/auth/auth-theme.css'

/**
 * Two-column auth shell: brand panel (left, desktop only) + form panel
 * (right), centered as a card on a soft page background. Presentation only.
 *
 * Props:
 *   heroHeadline / heroAccent / heroSubhead  strings for the hero copy
 *   children                                 the form content for the right panel
 */
export default function AuthLayout({ heroHeadline, heroAccent, heroSubhead, children }) {
  const [isLight, setIsLight] = useState(() => {
    try {
      return localStorage.getItem('fieldstone-auth-theme') === 'light'
    } catch {
      return false
    }
  })

  const toggleTheme = () => {
    setIsLight((current) => {
      const next = !current
      try {
        localStorage.setItem('fieldstone-auth-theme', next ? 'light' : 'dark')
      } catch {
        // Theme still works when storage is unavailable.
      }
      return next
    })
  }

  return (
    <div className={`auth-shell${isLight ? ' auth-shell--light' : ''}`}>
      <button
        type="button"
        className="auth-theme-toggle"
        onClick={toggleTheme}
        aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
        title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      >
        {isLight ? <Moon strokeWidth={1.8} /> : <Sun strokeWidth={1.8} />}
      </button>
      <div className="auth-card">
        <HeroScene headline={heroHeadline} accent={heroAccent} subhead={heroSubhead} />

        <div className="auth-form-panel">
          <div className="auth-mobile-brand">
            <span className="auth-mobile-brand__mark" aria-hidden="true">
              <MiniGlyph />
            </span>
            <span>Fieldstone Clinic</span>
          </div>

          <div className="auth-form">{children}</div>
        </div>
      </div>
    </div>
  )
}

function MiniGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20S4 15.2 4 9.3C4 6.4 6.1 4.5 8.6 4.5c1.5 0 2.7.7 3.4 1.8.7-1.1 1.9-1.8 3.4-1.8C17.9 4.5 20 6.4 20 9.3 20 15.2 12 20 12 20Z" />
      <path d="M12 9v6M9 12h6" />
    </svg>
  )
}
