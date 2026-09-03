import { useEffect, useRef } from 'react'

/**
 * Left-hand hero / context panel for the auth screens.
 * Purely decorative — no functional behaviour.
 *
 * Props:
 *   headline  string
 *   subhead   string
 */
export default function HeroScene({ headline, subhead }) {
  const sceneRef = useRef(null)
  const innerRef = useRef(null)

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

    const scene = sceneRef.current
    const inner = innerRef.current
    if (!scene || !inner) return

    const onMove = (e) => {
      const r = scene.getBoundingClientRect()
      const px = (e.clientX - r.left) / r.width
      const py = (e.clientY - r.top) / r.height
      const rotY = (px - 0.5) * 14
      const rotX = (0.5 - py) * 10
      inner.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`
    }
    const onLeave = () => {
      inner.style.transform = 'rotateX(0deg) rotateY(0deg)'
    }

    scene.addEventListener('mousemove', onMove)
    scene.addEventListener('mouseleave', onLeave)
    return () => {
      scene.removeEventListener('mousemove', onMove)
      scene.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <aside className="auth-hero" aria-hidden="true">
      <div className="auth-hero__grain" />

      <div className="auth-brand">
        <ClinicGlyph />
        <span>Fieldstone Clinic Workspace</span>
      </div>

      <div className="auth-hero__head">
        <h1>{headline}</h1>
        <p>{subhead}</p>

        <div className="scene" ref={sceneRef}>
          <div className="scene-inner" ref={innerRef}>
            <span className="orb orb--1" />
            <span className="orb orb--2" />
            <span className="orb orb--3" />

            <div className="care-panel">
              <svg
                className="care-panel__illus"
                viewBox="0 0 264 132"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* doctor (left) */}
                <circle cx="70" cy="34" r="13" stroke="#EAF0FF" strokeWidth="2.2" />
                <path
                  d="M46 104c0-16 11-28 24-28s24 12 24 28"
                  stroke="#EAF0FF"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                <path
                  d="M60 60c-6 4-9 10-9 18v10M60 60c4 8 4 8 10 8"
                  stroke="#7FA3FF"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                <circle cx="51" cy="90" r="3.4" stroke="#7FA3FF" strokeWidth="2.2" />

                {/* pulse line between chest points */}
                <path
                  className="care-panel__pulse"
                  d="M92 74h20l6-14 8 28 7-18 6 8h20"
                  stroke="#7FE0C4"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* patient (right) */}
                <circle cx="196" cy="36" r="13" stroke="#EAF0FF" strokeWidth="2.2" />
                <path
                  d="M172 108c0-18 10-30 24-30s24 12 24 30"
                  stroke="#EAF0FF"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                <path
                  d="M196 62v20M180 92h32"
                  stroke="#EAF0FF"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>

              <div className="care-panel__cap">
                <b>Continuous care</b>
                <span>Every visit, connected</span>
              </div>
            </div>

            <span className="chip chip--steth">
              <StethIcon />
            </span>
            <span className="chip chip--heart">
              <HeartbeatIcon />
            </span>
            <span className="chip chip--vitals">
              <BarsIcon />
            </span>
          </div>
        </div>
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
    </aside>
  )
}

/* --- inline icons -------------------------------------------------------- */
function ClinicGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#C7D3F5" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18M5 21V9l7-5 7 5v12" />
      <circle cx="10" cy="12" r="0.9" fill="#C7D3F5" stroke="none" />
      <circle cx="14" cy="12" r="0.9" fill="#C7D3F5" stroke="none" />
    </svg>
  )
}
function StethIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3v6a5 5 0 0 0 10 0V3" />
      <path d="M11 14v2a5 5 0 0 0 10 0v-2" />
      <circle cx="21" cy="10" r="2" />
    </svg>
  )
}
function HeartbeatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12h4l2-5 4 10 2-5h6" />
    </svg>
  )
}
function BarsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 20V10M12 20V4M19 20v-7" />
    </svg>
  )
}