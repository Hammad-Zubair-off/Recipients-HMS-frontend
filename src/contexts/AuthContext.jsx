import { createContext, useEffect, useState } from 'react'
import { signOut, onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase/config'
import {
  createUserWithRole,
  signInUser,
  resetUserPassword,
  resendUserVerificationEmail,
  fetchUserRoleFromFirestore,
  normalizeRole
} from '../utils/authUtils'

const AuthContext = createContext()

export { AuthContext }
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)

  async function signup(email, password, fullName, role) {
    return await createUserWithRole(email, password, fullName, role)
  }

  async function login(email, password, selectedRole) {
    const user = await signInUser(email, password, selectedRole)
    const role = normalizeRole(await fetchUserRole(user.uid)) || normalizeRole(selectedRole)
    setCurrentUser(user)
    setUserRole(role)
    return { user, role }
  }

  async function logout() {
    await signOut(auth)
  }

  async function resetPassword(email) {
    return await resetUserPassword(email)
  }

  async function resendVerificationEmail() {
    if (currentUser) {
      return await resendUserVerificationEmail(currentUser)
    }
  }



  async function fetchUserRole(uid) {
    try {
      return await fetchUserRoleFromFirestore(uid)
    } catch (error) {
      console.error('Error fetching user role:', error)
      return null
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true)
      // Failsafe: if the Firestore role lookup hangs (e.g. database not
      // reachable), don't leave the whole app stuck on a blank screen.
      const failsafe = setTimeout(() => setLoading(false), 5000)
      try {
        if (user) {
          console.log('[AuthContext] Firebase auth state: signed in', {
            uid: user.uid,
            email: user.email,
            emailVerified: user.emailVerified
          })
          setCurrentUser(user)
          const role = await fetchUserRole(user.uid)
          console.log('[AuthContext] role lookup completed', {
            uid: user.uid,
            role
          })
          if (role) {
            setUserRole(normalizeRole(role))
          }
        } else {
          setCurrentUser(null)
          setUserRole(null)
        }
      } catch (error) {
        console.error('[AuthContext] auth state handling failed', {
          code: error.code,
          message: error.message,
          error
        })
      } finally {
        clearTimeout(failsafe)
        setLoading(false)
      }
    })

    return unsubscribe
  }, [])

  const value = {
    currentUser,
    userRole,
    signup,
    login,
    logout,
    resetPassword,
    resendVerificationEmail,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
          <div style={{ width: 40, height: 40, border: '4px solid #60a5fa', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
        </div>
      ) : children}
    </AuthContext.Provider>
  )
}
