import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, ArrowRight, UserPlus } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import AuthLayout from '../../components/auth/AuthLayout'
import RoleSelect from '../../components/auth/RoleSelect'
import AuthField from '../../components/auth/AuthField'

export default function Login() {
  const navigate = useNavigate()
  const { login, logout, currentUser, userRole: contextRole } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [selectedRole, setSelectedRole] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [pendingRole, setPendingRole] = useState(null)
  const [rememberDevice, setRememberDevice] = useState(false) // visual only

  useEffect(() => {
    const role = contextRole?.trim().toLowerCase()

    if (currentUser && role && (!pendingRole || pendingRole === role)) {
      navigate(role === 'doctor' ? '/doctor' : '/receptionist', { replace: true })
    }
  }, [currentUser, contextRole, navigate, pendingRole])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedRole || !email || !password) {
      setError('Please fill in all fields and select your role.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const { role: userRole } = await login(email, password, selectedRole)

      const normalizedRole = userRole?.trim().toLowerCase()

      if (normalizedRole === selectedRole) {
        setPendingRole(normalizedRole)
        setIsLoading(false)
      } else if (normalizedRole) {
        setError(`Selected role does not match your account role. Your account is registered as: ${normalizedRole}`)
        await logout()
        setIsLoading(false)
      } else {
        await logout()
        setError('Your account profile is incomplete. Please contact support.')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Login error:', error)
      let errorMessage = 'Failed to sign in. Please try again.'

      if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Email or password is incorrect.'
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.'
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.'
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.'
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled.'
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many attempts. Please wait and try again.'
      } else if (error.code === 'permission-denied') {
        errorMessage = 'Your account profile could not be accessed. Please contact support.'
      } else if (error.message.includes('No document to update')) {
        errorMessage = 'Account setup incomplete. Please contact support.'
      }

      await logout()
      setError(errorMessage)
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      heroHeadline="Everything in sync."
      heroAccent="Care without chaos."
      heroSubhead="Charts, orders, and handoff notes stay in sync the moment you sign in."
    >
      <form onSubmit={handleSubmit} noValidate>
        <h2>Welcome back</h2>
        <p className="auth-lede">Sign in to your Fieldstone Workspace</p>

        <RoleSelect
          legend="I'm signing in as"
          name="signin-role"
          value={selectedRole}
          onChange={setSelectedRole}
        />

        <AuthField
          label="Email address"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          icon={<Mail strokeWidth={1.9} />}
          placeholder="you@clinic.com"
        />

        <AuthField
          label="Password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          icon={<Lock strokeWidth={1.9} />}
          placeholder="Enter your password"
          showToggle
          toggled={showPassword}
          onToggle={() => setShowPassword(!showPassword)}
        />

        <div className="auth-row">
          <label className="auth-check">
            <input
              type="checkbox"
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
            />
            Remember this device
          </label>
          <Link to="/forgot-password" className="auth-link">
            Forgot password?
          </Link>
        </div>

        {error && <div className="auth-alert">{error}</div>}

        <button
          type="submit"
          disabled={!selectedRole || !email || !password || isLoading}
          className="auth-btn-primary"
          style={{ marginTop: error ? 16 : 4 }}
        >
          {isLoading ? (
            <>
              <span className="auth-spin" /> Signing in...
            </>
          ) : (
            <>
              Sign in <ArrowRight />
            </>
          )}
        </button>

        <div className="auth-divider">New to Fieldstone?</div>

        <Link to="/signup" className="auth-btn-secondary">
          <UserPlus /> Create an account
        </Link>

        <div className="auth-status">
          <span className="status-dot" />
          All systems operational
        </div>
      </form>
    </AuthLayout>
  )
}
