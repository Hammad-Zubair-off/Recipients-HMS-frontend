import { Building2, Zap, ShieldCheck, Users } from 'lucide-react'
import heroBg from '../../assets/medical_auth_background.png'

/**
 * Left-hand brand / visual panel for the auth screens.
 * Image-backed with a navy overlay + glassmorphism accents. Decorative only.
 *
 * Props:
 *   headline  string  — main line
 *   accent    string  — emphasised trailing phrase (gradient text)
 *   subhead   string  — supporting sentence
 */
export default function HeroScene({ headline, accent, subhead }) {
  return (
    <aside className="auth-hero">
      <div className="auth-hero__bg" style={{ backgroundImage: `url(${heroBg})` }} aria-hidden="true" />
      <div className="auth-hero__overlay" aria-hidden="true" />

      <div className="auth-hero__brand">
        <Building2 strokeWidth={1.75} />
        <span>Fieldstone Clinic Workspace</span>
      </div>

      <div className="auth-hero__body">
        <h1>
          {headline}
          {accent ? (
            <>
              {' '}
              <span className="hero-accent">{accent}</span>
            </>
          ) : null}
        </h1>
        <p>{subhead}</p>

        <div className="hero-rule" aria-hidden="true" />

        <div className="hero-badges">
          <span className="hero-badge"><Zap strokeWidth={2} /> Real-time sync</span>
          <span className="hero-badge"><ShieldCheck strokeWidth={2} /> Secure &amp; HIPAA ready</span>
          <span className="hero-badge"><Users strokeWidth={2} /> Built for care teams</span>
        </div>

        <div className="hero-stats">
          <div className="hero-stat">
            <b>6,200+</b>
            <span>clinicians signed in weekly</span>
          </div>
          <div className="hero-stat">
            <b>128</b>
            <span>practices on Fieldstone</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
