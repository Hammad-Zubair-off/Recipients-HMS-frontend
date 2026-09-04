import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BarChart3, CalendarDays, Check, ChevronDown, ClipboardList, CreditCard, FileText, LayoutDashboard, Menu, Moon, ShieldCheck, Stethoscope, Sun, Users, X } from 'lucide-react'
import './home-theme.css'

export default function Home() {
  const [isLoading, setIsLoading] = useState(true)
  const [isLight, setIsLight] = useState(() => {
    try {
      return localStorage.getItem('fieldstone-site-theme') === 'light'
    } catch {
      return false
    }
  })
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const id = setTimeout(() => setIsLoading(false), 650)
    return () => clearTimeout(id)
  }, [])

  useEffect(() => {
    document.title = 'Fieldstone Clinic | Healthcare Management'
  }, [])

  const toggleTheme = () => {
    setIsLight((current) => {
      const next = !current
      try {
        localStorage.setItem('fieldstone-site-theme', next ? 'light' : 'dark')
      } catch {
        // Keep the switch usable when storage is unavailable.
      }
      return next
    })
  }

  if (isLoading) return <LoadingScreen />

  return <div className={`site-home${isLight ? ' site-home--light' : ''}`}>
    <header className="site-nav">
      <Link to="/" className="site-brand" onClick={() => setMenuOpen(false)}>
        <span className="site-brand__mark"><HeartPlus /></span>
        <span><strong>Fieldstone Clinic</strong><small>Healthcare Management</small></span>
      </Link>
      <button className="site-menu-toggle" type="button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">
        {menuOpen ? <X /> : <Menu />}
      </button>
      <nav className={`site-nav__links${menuOpen ? ' is-open' : ''}`}>
        <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
        <a href="#solutions" onClick={() => setMenuOpen(false)}>Solutions <ChevronDown /></a>
        <a href="#pricing" onClick={() => setMenuOpen(false)}>Pricing</a>
        <a href="#about" onClick={() => setMenuOpen(false)}>About us</a>
        <button className="site-theme-toggle" type="button" onClick={toggleTheme} aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}>
          {isLight ? <Moon /> : <Sun />}
        </button>
        <Link to="/login" className="site-nav__login">Sign in</Link>
        <Link to="/signup" className="site-nav__signup">Sign up</Link>
      </nav>
    </header>

    <main>
      <section className="site-hero" id="about">
        <div className="site-hero__copy">
          <span className="site-eyebrow"><Stethoscope /> Modern Healthcare Management Platform</span>
          <h1>Simplify Healthcare.<br /><span>Elevate Patient Care.</span></h1>
          <p>One calm, connected platform to manage appointments, patients, billing, and your care team securely.</p>
          <div className="site-hero__actions"><Link to="/signup" className="site-button site-button--primary">Get started free <ArrowRight /></Link><a href="#features" className="site-button site-button--ghost">Explore platform</a></div>
          <div className="site-trust"><TrustItem icon={<ShieldCheck />} title="HIPAA Compliant" detail="Enterprise-grade security" /><TrustItem icon={<CloudIcon />} title="Cloud Based" detail="Access anywhere, anytime" /><TrustItem icon={<Users />} title="For Care Teams" detail="Built for clinics of all sizes" /></div>
        </div>
        <DashboardPreview />
      </section>

      <div className="site-proof"><span>Trusted by modern care teams</span><b>MediCare+</b><b>HealthPoint</b><b>CareWell</b><b>LifeLine</b><b>NovaClinic</b></div>

      <section className="site-section site-features" id="features">
        <div className="site-section__intro"><span className="site-eyebrow">Why clinics choose Fieldstone</span><h2>Everything you need<br />to <span>run your clinic.</span></h2></div>
        <div className="site-feature-grid"><FeatureCard icon={<CalendarDays />} tone="blue" title="Smart Scheduling" detail="Streamline appointments with easy scheduling and real-time availability." /><FeatureCard icon={<Users />} tone="green" title="Patient Management" detail="Keep patient records organized and accessible in one secure place." /><FeatureCard icon={<FileText />} tone="purple" title="Prescriptions" detail="Create, manage, and review prescriptions with a clear clinical workflow." /><FeatureCard icon={<BarChart3 />} tone="cyan" title="Powerful Reports" detail="Gain insight with custom reports and operational analytics." /></div>
      </section>

      <section className="site-section site-solutions" id="solutions"><div><span className="site-eyebrow">Designed around your workflow</span><h2>One system.<br /><span>Every handoff connected.</span></h2><p>Doctors can focus on care while reception teams coordinate the front desk, tokens, payments, and patient flow from the same source of truth.</p></div><div className="site-solution-list"><Solution icon={<Stethoscope />} title="For doctors" text="Appointments, patient context, prescriptions, and token queues in one focused workspace." /><Solution icon={<ClipboardList />} title="For reception teams" text="Patient registration, scheduling, billing, payments, and daily operations without the busywork." /></div></section>

      <section className="site-pricing" id="pricing"><span className="site-eyebrow">Simple to get started</span><h2>Everything your clinic needs,<br /><span>ready from day one.</span></h2><p>Explore the full platform with your care team. No complicated setup, no scattered tools.</p><Link to="/signup" className="site-button site-button--primary">Create your workspace <ArrowRight /></Link></section>
    </main>
    <footer className="site-footer"><span>© 2026 Fieldstone Clinic</span><span>Secure care coordination for modern clinics</span></footer>
  </div>
}

function LoadingScreen() { return <div className="site-loading"><div className="site-loading__mark"><HeartPlus /></div><span>FIELDSTONE CLINIC</span><strong>Preparing your care workspace</strong><i /></div> }
function HeartPlus() { return <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M16 27S5 20.4 5 12.4C5 8.5 7.8 6 11.2 6c2.1 0 3.8 1 4.8 2.6C17 7 18.7 6 20.8 6 24.2 6 27 8.5 27 12.4 27 20.4 16 27 16 27Z" /><path d="M16 12v7M12.5 15.5h7" /></svg> }
function CloudIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7 18h10a4 4 0 0 0 .7-7.94A6 6 0 0 0 6.1 11.5 3.5 3.5 0 0 0 7 18Z" /></svg> }
function TrustItem({ icon, title, detail }) { return <div className="site-trust__item"><span>{icon}</span><b>{title}<small>{detail}</small></b></div> }
function FeatureCard({ icon, tone, title, detail }) { return <article className="site-feature-card"><span className={`site-feature-card__icon ${tone}`}>{icon}</span><h3>{title}</h3><p>{detail}</p></article> }
function Solution({ icon, title, text }) { return <div className="site-solution"><span>{icon}</span><div><h3>{title}</h3><p>{text}</p></div><Check /></div> }
function DashboardPreview() { return <div className="dashboard-preview"><div className="dashboard-preview__top"><span><HeartPlus /> Fieldstone Clinic</span><small>Dashboard</small><i /><i /><i /></div><div className="dashboard-preview__body"><aside><b><LayoutDashboard /> Dashboard</b><span><CalendarDays /> Appointments</span><span><Users /> Patients</span><span><Stethoscope /> Doctors</span><span><CreditCard /> Billing</span><span><FileText /> Prescriptions</span><span><BarChart3 /> Reports</span></aside><div className="dashboard-preview__content"><div className="dashboard-stats"><Stat label="Total Appointments" value="248" icon={<CalendarDays />} /><Stat label="Total Patients" value="1,248" icon={<Users />} /><Stat label="Active Doctors" value="18" icon={<Stethoscope />} /><Stat label="Revenue" value="$45,231" icon={<CreditCard />} /></div><div className="dashboard-charts"><div><b>Appointments Overview</b><div className="chart-lines"><span /><span /><span /></div></div><div><b>Upcoming Appointments</b><p>09:00 AM &nbsp; Emily Johnson</p><p>10:30 AM &nbsp; Michael Brown</p><p>11:15 AM &nbsp; Sarah Davis</p></div></div></div></div></div> }
function Stat({ label, value, icon }) { return <div className="dashboard-stat"><span>{icon}</span><small>{label}</small><strong>{value}</strong><em>↑ 12% from last week</em></div> }
