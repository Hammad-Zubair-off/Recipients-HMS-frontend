/*
 * verify-doctor-dropdown.cjs
 * ----------------------------------------------------------------------------
 * Proves the receptionist "Create Appointment" doctor dropdown will show the
 * 4 seeded doctors, by running the EXACT query the component runs
 * (src/pages/receptionist/appointment/Appointments.jsx:93-94):
 *
 *     collection(db, 'staffData')
 *     query(ref, where('role', '==', 'doctor'))
 *
 * ...through the CLIENT SDK, as a genuinely signed-in user, against the
 * deployed security rules. A throwaway Auth user is created for the sign-in
 * and deleted afterwards. Nothing else is touched.
 */

const admin = require('firebase-admin')
const fs = require('fs')
const path = require('path')
const { initAdminApp } = require('./_adminApp.cjs')
const { initializeApp } = require('firebase/app')
const {
  getAuth, signInWithEmailAndPassword, signOut,
} = require('firebase/auth')
const {
  getFirestore, collection, query, where, getDocs,
} = require('firebase/firestore')

function loadClientConfig() {
  const env = {}
  for (const line of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim()
  }
  return {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
  }
}

async function main() {
  const info = initAdminApp()
  console.log(`Auth via : ${info.how}`)
  console.log(`Project  : ${info.projectId}\n`)

  // 1. throwaway signed-in user (mimics a logged-in receptionist session)
  const testEmail = `dropdown-check-${Date.now()}@example.com`
  const testPass = 'Test123456!'
  const userRec = await admin.auth().createUser({ email: testEmail, password: testPass })
  console.log(`created throwaway auth user ${testEmail}`)

  const clientApp = initializeApp(loadClientConfig(), 'verify-client')
  const clientAuth = getAuth(clientApp)
  const clientDb = getFirestore(clientApp)

  let exitCode = 0
  try {
    await signInWithEmailAndPassword(clientAuth, testEmail, testPass)
    console.log('signed in with client SDK\n')

    // 2. THE EXACT COMPONENT QUERY
    const doctorsRef = collection(clientDb, 'staffData')
    const doctorsQuery = query(doctorsRef, where('role', '==', 'doctor'))
    const snapshot = await getDocs(doctorsQuery)

    // 3. map exactly like the component does
    const doctors = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))

    console.log(`query staffData where role == 'doctor'  ->  ${doctors.length} result(s)`)
    console.log('\nDropdown would render:')
    console.log('  <option value="">Select a doctor</option>')
    doctors.forEach(doc => {
      // component line: Dr. {doctor.fullName || doctor.name}{doctor.specialization && ` (${doctor.specialization})`}
      const label = `Dr. ${doc.fullName || doc.name}${doc.specialization ? ` (${doc.specialization})` : ''}`
      console.log(`  <option value="${doc.id}">${label}</option>`)
    })

    const ok = doctors.length === 4 &&
      ['Olivia Martinez', 'Ethan Anderson', 'Sophia Patel', 'Marcus Williams']
        .every(n => doctors.some(d => d.fullName === n))
    console.log(`\nRESULT: ${ok ? 'PASS - 4 expected doctors present' : 'CHECK - unexpected result'}`)
    exitCode = ok ? 0 : 1

    await signOut(clientAuth)
  } finally {
    // 4. cleanup throwaway user
    await admin.auth().deleteUser(userRec.uid)
    console.log(`\ndeleted throwaway auth user ${testEmail}`)
  }

  process.exit(exitCode)
}

main().catch(e => { console.error('verify FAILED:', e); process.exit(1) })
