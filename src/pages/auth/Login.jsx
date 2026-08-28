import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaHospital, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaArrowRight, FaStar, FaShieldHalved, FaUserDoctor, FaUserTie, FaDatabase } from 'react-icons/fa6'
import { useAuth } from '../../hooks/useAuth'
import { seedDatabase } from '../../utils/seedData'
import toast from 'react-hot-toast'

export default function Login() {
  const navigate = useNavigate()
  const { login, logout, currentUser, userRole: contextRole } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [selectedRole, setSelectedRole] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSeeding, setIsSeeding] = useState(false)
  const [pendingRole, setPendingRole] = useState(null)

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

  const handleSeedDatabase = async () => {
    if (window.confirm('This will add example data to your database (Medicines, Appointments, Invoices). Continue?')) {
      setIsSeeding(true)
      const result = await seedDatabase()
      setIsSeeding(false)

      if (result.success) {
        toast.success(`Successfully added ${result.count} records!`)
      } else {
        toast.error('Failed to seed database. Check console for details.')
      }
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
            <FaHospital className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white mb-1">Welcome Back</h1>
          <p className="text-xs text-white/90">Access your professional healthcare dashboard</p>
        </div>

        {/* Form Card */}
        <div className="card">
          <form onSubmit={handleSubmit} className="form-container">
            {/* Professional Role Selection */}
            <div className="mb-3">
              <label className="form-label mb-1.5">Professional Role</label>
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
                      <FaUserTie className="icon-md" />
                    </div>
                    <span className={`text-sm font-semibold ${selectedRole === 'receptionist' ? 'text-primary-700' : 'text-slate-600'}`}>
                      Receptionist
                    </span>
                  </div>
                </button>
              </div>
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
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-3 py-2.5 outline-none bg-white"
                  required
                />
              </div>
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
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              <div className="text-right mt-1.5">
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-xs text-error text-center bg-error-bg border border-error-border rounded-lg p-2 mb-3">{error}</div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!selectedRole || !email || !password || isLoading}
              className="btn-primary rounded-lg w-full py-2.5 text-sm font-medium"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="spinner w-5 h-5"></div>
                  <span>Signing In...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <FaArrowRight className="icon-sm" />
                  <span>Sign In</span>
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
              <span className="px-3 bg-white text-slate-500">New to our team?</span>
            </div>
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <Link
              to="/signup"
              className="btn-outline rounded-lg flex items-center justify-center py-2.5 px-4 w-full text-sm font-medium"
            >
              <FaShieldHalved className="w-4 h-4 mr-2" />
              Create an account
            </Link>
          </div>
        </div>

        {/* Footer with Seed Button */}
        <div className="text-center mt-4 space-y-2">
          <p className="text-xs text-white/80">
            Secure access to your healthcare workspace
          </p>

          {/* Developer Seed Button */}
          <button
            onClick={handleSeedDatabase}
            disabled={isSeeding}
            className="btn-ghost text-xs py-1.5 px-3"
            title="Populate database with example data (Dev only)"
          >
            <FaDatabase className={`w-3 h-3 mr-1 ${isSeeding ? 'animate-spin' : ''}`} />
            {isSeeding ? 'Seeding...' : 'Seed DB'}
          </button>
        </div>
      </div>
    </div>
  )
}
