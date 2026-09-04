import { ShieldCheck, LayoutGrid, Users, LockKeyhole } from 'lucide-react'
import clinicImage from '../../assets/medical_auth_background.jpg'

/**
 * Left-hand brand / visual panel for the auth screens.
 * Solid deep-navy panel with a subtle gradient and a short benefits list.
 * Decorative only — no functional impact.
 *
 * Props:
 *   headline  string  — main line (white)
 *   accent    string  — second line (indigo/lavender accent)
 *   subhead   string  — supporting sentence
 */
export default function HeroScene({ headline, accent, subhead }) {
  return (
    <aside className="auth-hero">
      <img className="auth-hero__image" src={clinicImage} alt="" aria-hidden="true" />
      <div className="auth-hero__wash" aria-hidden="true" />
      <div className="auth-hero__brand">
        <span className="auth-hero__mark" aria-hidden="true">
          <BrandGlyph />
        </span>
        <span className="auth-hero__brand-text">
          <span className="auth-hero__brand-name">Fieldstone Clinic</span>
          <span className="auth-hero__brand-sub">Healthcare Management</span>
        </span>
      </div>

      <div className="auth-hero__body">
        <h1>
          <span className="hero-line-1">{headline}</span>
          {accent ? <span className="hero-line-2">{accent}</span> : null}
        </h1>
        <p>{subhead}</p>

        <div className="hero-benefits">
          <BenefitItem
            icon={<ShieldCheck strokeWidth={1.8} />}
            title="Secure & Compliant"
            description="HIPAA-ready and enterprise-grade security"
          />
          <BenefitItem
            icon={<LayoutGrid strokeWidth={1.8} />}
            title="All-in-One Platform"
            description="Manage appointments, patients, billing and more"
          />
          <BenefitItem
            icon={<Users strokeWidth={1.8} />}
            title="Built for Care Teams"
            description="Designed for clinics of all sizes and specialties"
          />
        </div>
      </div>

      <div className="auth-hero__security">
        <span className="auth-hero__security-icon" aria-hidden="true"><LockKeyhole strokeWidth={1.8} /></span>
        <span><b>Your data is protected with</b><small>enterprise-grade security</small></span>
      </div>
    </aside>
  )
}

function BenefitItem({ icon, title, description }) {
  return (
    <div className="hero-benefit">
      <span className="hero-benefit__ico" aria-hidden="true">{icon}</span>
      <span className="hero-benefit__txt">
        <b>{title}</b>
        <span>{description}</span>
      </span>
    </div>
  )
}

function BrandGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20S4 15.2 4 9.3C4 6.4 6.1 4.5 8.6 4.5c1.5 0 2.7.7 3.4 1.8.7-1.1 1.9-1.8 3.4-1.8C17.9 4.5 20 6.4 20 9.3 20 15.2 12 20 12 20Z" />
      <path d="M12 9v6M9 12h6" />
    </svg>
  )
}
