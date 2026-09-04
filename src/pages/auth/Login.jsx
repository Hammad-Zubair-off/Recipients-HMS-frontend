import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react'
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
      const errorCode = error?.code || ''
      const errorDetails = typeof error?.message === 'string' ? error.message : ''

      if (errorCode === 'auth/invalid-credential') {
        errorMessage = 'Email or password is incorrect.'
      } else if (errorCode === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.'
      } else if (errorCode === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.'
      } else if (errorCode === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.'
      } else if (errorCode === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled.'
      } else if (errorCode === 'auth/too-many-requests') {
        errorMessage = 'Too many attempts. Please wait and try again.'
      } else if (errorCode === 'auth/operation-not-allowed') {
        errorMessage = 'Email/password sign-in is disabled for this Firebase project. Enable it in Firebase Console > Authentication > Sign-in method.'
      } else if (errorCode === 'auth/configuration-not-found') {
        errorMessage = 'Firebase Authentication is not configured for this project. Enable it in Firebase Console > Authentication.'
      } else if (errorCode === 'auth/api-key-not-valid') {
        errorMessage = 'The Firebase API key is invalid. Check the VITE_FIREBASE_* values in .env.'
      } else if (errorCode === 'auth/network-request-failed') {
        errorMessage = 'Could not reach Firebase. Check your internet connection and Firebase configuration.'
      } else if (errorDetails.toLowerCase().includes('api_key') && errorDetails.toLowerCase().includes('suspended')) {
        errorMessage = 'The Firebase API key is suspended. Unsuspend or regenerate it in Google Cloud Console, then update VITE_FIREBASE_API_KEY.'
      } else if (errorCode === 'permission-denied') {
        errorMessage = 'Your account profile could not be accessed. Please contact support.'
      } else if (errorDetails.includes('No document to update')) {
        errorMessage = 'Account setup incomplete. Please contact support.'
      } else if (errorCode || errorDetails) {
        errorMessage = `Sign-in failed (${errorCode || errorDetails}).`
      }

      try {
        await logout()
      } catch (logoutError) {
        console.error('Could not clear failed sign-in session:', logoutError)
      }
      setError(errorMessage)
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      heroHeadline="Welcome back!"
      heroAccent="Glad to see you again"
      heroSubhead="Sign in to access your clinic dashboard and continue providing exceptional care."
    >
      <form onSubmit={handleSubmit} noValidate>
        <h2>Sign in</h2>
        <p className="auth-lede">Enter your credentials to access your account</p>

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
          labelExtra={
            <Link to="/forgot-password" className="auth-link">
              Forgot password?
            </Link>
          }
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
            Remember me
          </label>
        </div>

        {error && (
          <div className="auth-alert">
            <AlertCircle strokeWidth={2} aria-hidden="true" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!selectedRole || !email || !password || isLoading}
          className="auth-btn-primary"
          style={{ marginTop: 20 }}
        >
          {isLoading ? (
            <>
              <span className="auth-spin" /> Signing in...
            </>
          ) : (
            <>
              Sign in <ArrowRight strokeWidth={2} />
            </>
          )}
        </button>

        <p className="auth-switch">
          Don&rsquo;t have an account?
          <Link to="/signup" className="auth-link">Sign up</Link>
        </p>
      </form>
    </AuthLayout>
  )
}
