import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Render error caught by ErrorBoundary:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#0f172a' }}>
          <div style={{ maxWidth: 640, width: '100%', background: '#fff', borderRadius: 12, padding: 24, fontFamily: 'system-ui, sans-serif' }}>
            <h1 style={{ fontSize: 20, margin: '0 0 8px', color: '#b91c1c' }}>Something went wrong</h1>
            <p style={{ margin: '0 0 12px', color: '#334155' }}>The page failed to render. Details below:</p>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: '#f1f5f9', padding: 12, borderRadius: 8, fontSize: 13, color: '#0f172a' }}>
              {String(this.state.error?.stack || this.state.error?.message || this.state.error)}
            </pre>
            <button
              onClick={() => { this.setState({ error: null }); window.location.assign('/login') }}
              style={{ marginTop: 12, padding: '8px 16px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer' }}
            >
              Go to Login
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}