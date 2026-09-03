/*
 * fix-doctor-staff-record.cjs
 * ----------------------------------------------------------------------------
 * Creates a staffData/{uid} record (role: "doctor") for a Firebase Auth user
 * that has an account but no staff profile, so the security rules' isStaff()
 * check passes and the doctor dashboard / prescriptions / appointments load.
 *
 * Matches the shape written by src/utils/authUtils.js createUserWithRole(),
 * plus specialization/status like the demo doctors.
 *
 * Default target: faizankhan15658@gmail.com  (pass another email as arg 1)
 *
 *   node scripts/fix-doctor-staff-record.cjs
 *   node scripts/fix-doctor-staff-record.cjs someone@example.com "Dr. Jane Doe" Cardiology
 */

const admin = require('firebase-admin')
const { initAdminApp } = require('./_adminApp.cjs')

async function main() {
  const email = process.argv[2] || 'faizankhan15658@gmail.com'
  const fullNameArg = process.argv[3]
  const specialization = process.argv[4] || 'General Medicine'

  const info = initAdminApp()
  const db = admin.firestore()
  console.log(`\nAuth via : ${info.how}\nProject  : ${info.projectId}\n`)

  const user = await admin.auth().getUserByEmail(email)
  const ref = db.collection('staffData').doc(user.uid)
  const existing = await ref.get()

  if (existing.exists) {
    const d = existing.data()
    console.log(`staffData/${user.uid} already exists — role=${d.role}, name=${d.fullName}. No change.`)
    process.exit(0)
  }

  const fullName = fullNameArg || (user.displayName || email.split('@')[0])
  const now = new Date().toISOString()

  const record = {
    uid: user.uid,
    email: user.email,
    fullName,
    role: 'doctor',
    specialization,
    status: 'active',
    emailVerified: !!user.emailVerified,
    createdAt: now,
    lastLogin: null,
    verificationEmailSent: null,
  }

  await ref.set(record)
  console.log(`Created staffData/${user.uid}:`)
  console.log(JSON.stringify(record, null, 2))
  console.log(`\n${email} is now a doctor. Refresh the app / sign out & back in on the doctor side.`)
  process.exit(0)
}

main().catch((e) => {
  console.error('Failed:', e.message || e)
  process.exit(1)
})