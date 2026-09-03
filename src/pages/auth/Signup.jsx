import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import AuthLayout from '../../components/auth/AuthLayout'
import RoleSelect from '../../components/auth/RoleSelect'
import FloatingInput from '../../components/auth/FloatingInput'

export default function Signup() {
  const { role: initialRole } = useParams()
  const navigate = useNavigate()
  const { signup } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [selectedRole, setSelectedRole] = useState(initialRole || '')
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})

  // Visual-only fields from the design brief — not part of the existing
  // signup payload or validation, kept as local state so the form matches
  // the design without changing the auth flow.
  const [clinicName, setClinicName] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!selectedRole) {
      newErrors.role = 'Please select a professional role'
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      await signup(formData.email, formData.password, formData.fullName, selectedRole)
      navigate('/verify-email', {
        state: {
          role: selectedRole,
          email: formData.email,
          fullName: formData.fullName
        }
      })
    } catch (error) {
      console.error('Signup error:', error)

      const messagesByCode = {
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/weak-password': 'Password should be at least 6 characters long.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/operation-not-allowed': 'Email/Password sign-in is not enabled for this project. Enable it in Firebase Console → Authentication → Sign-in method.',
        'auth/configuration-not-found': 'Firebase Authentication is not configured for this project. Open Firebase Console → Authentication → Get started.',
        'auth/api-key-not-valid': 'Firebase API key is invalid. Check the VITE_FIREBASE_* values in your .env file.',
        'auth/network-request-failed': 'Network error contacting Firebase. Check your connection and that the project ID is correct.',
        'permission-denied': 'Account was created but saving the profile was blocked by Firestore security rules.',
        'unavailable': 'Cloud Firestore is not reachable. Make sure a Firestore database has been created for this project.',
        'failed-precondition': 'Cloud Firestore database does not exist yet. Create one in Firebase Console → Firestore Database.',
      }

      const errorMessage =
        messagesByCode[error?.code] ||
        (error?.code || error?.message
          ? `Failed to create account (${error.code || error.message}).`
          : 'Failed to create account. Please try again.')

      setErrors(prev => ({ ...prev, general: errorMessage }))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      heroHeadline="Set up your workspace in minutes."
      heroSubhead="Bring your team onto one system for charts, scheduling, and handoffs."
    >
      <form onSubmit={handleSubmit} noValidate>
        <h2>Create your account</h2>
        <p className="auth-lede">Set up access for yourself and your care team.</p>

        <RoleSelect
          legend="I'll be signing in as"
          name="signup-role"
          value={selectedRole}
          onChange={setSelectedRole}
        />
        {errors.role && <p className="field-error" style={{ marginTop: -14, marginBottom: 16 }}>{errors.role}</p>}

        <div className="auth-two-col">
          <FloatingInput
            label="Full name"
            name="fullName"
            value={formData.fullName}
            onChange={handleInputChange}
            required
            autoComplete="name"
            error={errors.fullName}
          />
          <FloatingInput
            label="Work email address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            autoComplete="email"
            error={errors.email}
          />
        </div>

        <FloatingInput
          label="Clinic / practice name"
          name="clinicName"
          value={clinicName}
          onChange={(e) => setClinicName(e.target.value)}
          required
          autoComplete="organization"
        />

        <FloatingInput
          label="Password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          value={formData.password}
          onChange={handleInputChange}
          required
          autoComplete="new-password"
          showToggle
          toggled={showPassword}
          onToggle={() => setShowPassword(!showPassword)}
          helper="At least 8 characters, with a number and a symbol."
          error={errors.password}
        />

        <FloatingInput
          label="Confirm password"
          name="confirmPassword"
          type={showConfirmPassword ? 'text' : 'password'}
          value={formData.confirmPassword}
          onChange={handleInputChange}
          required
          autoComplete="new-password"
          showToggle
          toggled={showConfirmPassword}
          onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
          error={errors.confirmPassword}
        />

        <label className="auth-check" style={{ margin: '18px 0 4px', alignItems: 'flex-start' }}>
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            style={{ marginTop: 2 }}
          />
          <span>
            I agree to the{' '}
            <a href="#terms" className="auth-link" onClick={(e) => e.preventDefault()}>Terms of Service</a>
            {' '}and{' '}
            <a href="#privacy" className="auth-link" onClick={(e) => e.preventDefault()}>Privacy Policy</a>.
          </span>
        </label>

        {errors.general && <div className="auth-alert">{errors.general}</div>}

        <button
          type="submit"
          disabled={isLoading}
          className="auth-btn-primary"
          style={{ marginTop: 16 }}
        >
          {isLoading ? (
            <>
              <span className="auth-spin" /> Creating account...
            </>
          ) : (
            'Create account'
          )}
        </button>

        <div className="auth-divider">Already have an account?</div>

        <Link to="/login" className="auth-btn-secondary">
          Sign in instead
        </Link>

        <div className="auth-status">
          <span className="status-dot" />
          All systems operational
        </div>
      </form>
    </AuthLayout>
  )
}
