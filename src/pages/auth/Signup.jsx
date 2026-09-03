import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { FaHospital, FaUserDoctor, FaBellConcierge, FaIdCard, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaArrowRight, FaStar, FaShieldHalved, FaUserTie } from 'react-icons/fa6'
import { useAuth } from '../../hooks/useAuth'

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

  const roleMeta = {
    doctor: { title: 'Doctor', icon: FaUserDoctor, description: 'Provide care with streamlined tools for appointments and records' },
    receptionist: { title: 'Receptionist', icon: FaBellConcierge, description: 'Coordinate patient intake, scheduling, and front-desk operations' }
  }

  const currentRole = roleMeta[selectedRole] || null
  const IconComponent = currentRole?.icon || FaHospital

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
    <div className="auth-container flex items-center justify-center p-4">
      {/* Floating Background Shapes */}
      <div className="auth-shape auth-shape-1"></div>
      <div className="auth-shape auth-shape-2"></div>
      <div className="auth-shape auth-shape-3"></div>

      <div className="relative z-10 w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-primary rounded-2xl mb-3 shadow-glow-primary">
            <IconComponent className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white mb-1">Join Our Team</h1>
          <p className="text-xs text-white/90">
            {currentRole ? `Create your ${currentRole.title} account` : 'Choose your role and create your account'}
          </p>
        </div>

        {/* Form Card */}
        <div className="card">
          <form onSubmit={handleSubmit} className="form-container">
            {/* Professional Role Selection */}
            <div className="mb-3">
              <label className="form-label form-label-required mb-1.5">Professional Role</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole('doctor')}
                  className={`p-3 rounded-lg border-2 transition-all duration-300 ${selectedRole === 'doctor'
                    ? 'border-primary-500 bg-primary-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-primary-200 hover:bg-slate-50'
                    }`}
                >
                  <div className="flex flex-col items-center space-y-1">
                    <div className={`stat-card-icon ${selectedRole === 'doctor' ? 'stat-card-icon-primary' : 'bg-slate-100 text-slate-500'
                      }`}>
                      <FaUserDoctor className="icon-md" />
                    </div>
                    <span className={`text-sm font-semibold ${selectedRole === 'doctor' ? 'text-primary-700' : 'text-slate-600'}`}>
                      Doctor
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('receptionist')}
                  className={`p-3 rounded-lg border-2 transition-all duration-300 ${selectedRole === 'receptionist'
                    ? 'border-primary-500 bg-primary-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-primary-200 hover:bg-slate-50'
                    }`}
                >
                  <div className="flex flex-col items-center space-y-1">
                    <div className={`stat-card-icon ${selectedRole === 'receptionist' ? 'stat-card-icon-primary' : 'bg-slate-100 text-slate-500'
                      }`}>
                      <FaBellConcierge className="icon-md" />
                    </div>
                    <span className={`text-sm font-semibold ${selectedRole === 'receptionist' ? 'text-primary-700' : 'text-slate-600'}`}>
                      Receptionist
                    </span>
                  </div>
                </button>
              </div>
              {errors.role && <p className="form-error">{errors.role}</p>}
            </div>

            {/* Full Name Field */}
            <div className="mb-3">
              <label className="form-label form-label-required mb-1.5">Full Name</label>
              <div className="flex items-stretch border border-slate-300 rounded-lg overflow-hidden focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all">
                <div className="flex items-center justify-center px-3 bg-slate-50 border-r border-slate-200">
                  <FaIdCard className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  name="fullName"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="flex-1 px-3 py-2.5 outline-none bg-white"
                  required
                />
              </div>
              {errors.fullName && <p className="text-xs text-error mt-1">{errors.fullName}</p>}
            </div>

            {/* Email Field */}
            <div className="mb-3">
              <label className="form-label form-label-required mb-1.5">Email Address</label>
              <div className="flex items-stretch border border-slate-300 rounded-lg overflow-hidden focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all">
                <div className="flex items-center justify-center px-3 bg-slate-50 border-r border-slate-200">
                  <FaEnvelope className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="flex-1 px-3 py-2.5 outline-none bg-white"
                  required
                />
              </div>
              {errors.email && <p className="text-xs text-error mt-1">{errors.email}</p>}
            </div>

            {/* Password Field */}
            <div className="mb-3">
              <label className="form-label form-label-required mb-1.5">Password</label>
              <div className="flex items-stretch border border-slate-300 rounded-lg overflow-hidden focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all">
                <div className="flex items-center justify-center px-3 bg-slate-50 border-r border-slate-200">
                  <FaLock className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="flex-1 px-3 py-2.5 outline-none bg-white"
                  required
                />
                <button
                  type="button"
                  className="flex items-center justify-center px-3 bg-slate-50 border-l border-slate-200 text-slate-400 hover:text-primary-500 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-error mt-1">{errors.password}</p>}
              <p className="text-xs text-slate-500 mt-1">Minimum 6 characters</p>
            </div>

            {/* Confirm Password Field */}
            <div className="mb-3">
              <label className="form-label form-label-required mb-1.5">Confirm Password</label>
              <div className="flex items-stretch border border-slate-300 rounded-lg overflow-hidden focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all">
                <div className="flex items-center justify-center px-3 bg-slate-50 border-r border-slate-200">
                  <FaLock className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="flex-1 px-3 py-2.5 outline-none bg-white"
                  required
                />
                <button
                  type="button"
                  className="flex items-center justify-center px-3 bg-slate-50 border-l border-slate-200 text-slate-400 hover:text-primary-500 transition-colors"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-error mt-1">{errors.confirmPassword}</p>}
            </div>

            {/* General Error Display */}
            {errors.general && (
              <div className="text-xs text-error text-center bg-error-bg border border-error-border rounded-lg p-2 mb-3">
                {errors.general}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary rounded-lg w-full py-2.5 text-sm font-medium"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="spinner w-5 h-5"></div>
                  <span>Creating Account...</span>
                </div>
              ) : (
                <div className="flex  items-center justify-center rounded-lg space-x-2">
                  <FaShieldHalved className="icon-sm" />
                  <span>Create Account</span>
                  <FaArrowRight className="icon-sm" />
                </div>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-slate-500">Already have an account?</span>
            </div>
          </div>

          {/* Sign In Link */}
          <div className="text-center">
            <Link
              to="/login"
              className="btn-outline flex justify-center items-center rounded-lg py-2.5 px-4 w-full text-sm font-medium"
            >
              <FaStar className="w-4 h-4 mr-2" />
              Sign in here
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-4">
          <p className="text-xs text-white/80">
            Join our healthcare team and make a difference
          </p>
        </div>
      </div>
    </div>
  )
}
