import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute({ children, requiredRole = null }) {
  const { currentUser, userRole, loading } = useAuth()

  // If the role never resolves (e.g. Firestore unreachable), don't hang
  // on a spinner forever - give up after a grace period.
  const [roleTimedOut, setRoleTimedOut] = useState(false)
  useEffect(() => {
    if (currentUser && requiredRole && !userRole) {
      const t = setTimeout(() => setRoleTimedOut(true), 8000)
      return () => clearTimeout(t)
    }
    setRoleTimedOut(false)
  }, [currentUser, requiredRole, userRole])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-900 text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  // Role could not be loaded within the grace period - send to login
  // so the user isn't stuck. (Usually means Firestore isn't reachable.)
  if (requiredRole && !userRole && roleTimedOut) {
    return <Navigate to="/login" replace />
  }

  // User is authenticated but role hasn't loaded yet - show loading
  if (requiredRole && !userRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-900 text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  if (requiredRole && userRole !== requiredRole) {
    // Redirect to login with error message or to appropriate dashboard
    if (userRole === 'doctor') {
      return <Navigate to="/doctor" replace />
    } else if (userRole === 'receptionist') {
      return <Navigate to="/receptionist" replace />
    } else {
      return <Navigate to="/login" replace />
    }
  }

  return children
}
