import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/config'

export function normalizeRole(role) {
  return typeof role === 'string' ? role.trim().toLowerCase() : null
}

export async function createUserWithRole(email, password, fullName, role) {
  const normalizedEmail = email.trim().toLowerCase()
  const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password)
  const user = userCredential.user

  await updateProfile(user, {
    displayName: fullName
  })

  await sendEmailVerification(user)

  await setDoc(doc(db, 'staffData', user.uid), {
    uid: user.uid,
    email: user.email,
    fullName: fullName,
    role: normalizeRole(role),
    emailVerified: false,
    createdAt: new Date().toISOString(),
    lastLogin: null,
    verificationEmailSent: new Date().toISOString()
  })

  await signOut(auth)

  return user
}

export async function signInUser(email, password, selectedRole = 'doctor') {
  const normalizedEmail = email.trim().toLowerCase()
  const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password)
  return userCredential.user
}

export async function resetUserPassword(email) {
  return await sendPasswordResetEmail(auth, email)
}

export async function resendUserVerificationEmail(user) {
  return await sendEmailVerification(user)
}

export async function fetchUserRoleFromFirestore(uid) {
  try {
    const userDoc = await getDoc(doc(db, 'staffData', uid))
    if (userDoc.exists()) {
      return normalizeRole(userDoc.data().role)
    }
    return null
  } catch (error) {
    console.error('Error fetching user role:', error)
    return null
  }
}


