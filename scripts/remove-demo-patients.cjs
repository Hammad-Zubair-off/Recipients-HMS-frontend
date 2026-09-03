/*
 * remove-demo-patients.cjs
 * ----------------------------------------------------------------------------
 * Deletes ONLY the demo patients created by seed-demo-patients.cjs, i.e. docs
 * in the `patients` collection where `demoData === true`. It never touches any
 * document that does not carry that marker, so real/application patient records
 * are safe.
 *
 * Dry run (default - lists what would be deleted, deletes nothing):
 *     node scripts/remove-demo-patients.cjs
 *
 * Actually delete:
 *     node scripts/remove-demo-patients.cjs --confirm
 */

const fs = require('fs')
const path = require('path')
const { initializeApp } = require('firebase/app')
const {
  getFirestore, collection, getDocs, query, where, deleteDoc, doc,
} = require('firebase/firestore')

function loadFirebaseConfig() {
  const envPath = path.join(__dirname, '..', '.env')
  const env = {}
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim()
  }
  return {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  }
}

async function removeDemoPatients() {
  const confirm = process.argv.includes('--confirm')
  const cfg = loadFirebaseConfig()
  const app = initializeApp(cfg)
  const db = getFirestore(app)

  console.log(`\nFirebase project : ${cfg.projectId}`)
  console.log(`Mode             : ${confirm ? 'DELETE' : 'DRY RUN (pass --confirm to delete)'}\n`)

  let snap
  try {
    snap = await getDocs(query(collection(db, 'patients'), where('demoData', '==', true)))
  } catch (err) {
    console.error(`Could not query demo patients: ${err.code || err.message}`)
    process.exit(1)
  }

  if (snap.empty) {
    console.log('No demo patients (demoData === true) found. Nothing to do.')
    process.exit(0)
  }

  console.log(`Found ${snap.size} demo patient(s):`)
  const ids = []
  snap.forEach(d => {
    const p = d.data()
    ids.push(d.id)
    console.log(`  - ${p.patientId || d.id}  ${p.fullName}  <${p.email}>  (doc ${d.id})`)
  })

  if (!confirm) {
    console.log('\nDry run only - nothing deleted. Re-run with --confirm to delete these.\n')
    process.exit(0)
  }

  console.log('\nDeleting...')
  let removed = 0
  const failures = []
  for (const id of ids) {
    try {
      await deleteDoc(doc(db, 'patients', id))
      removed++
    } catch (err) {
      failures.push({ id, error: err.code || err.message })
    }
  }

  console.log(`\n----------------------------------------------------------------`)
  console.log(`Removed ${removed} demo patient(s). Real records untouched.`)
  if (failures.length) {
    console.log(`FAILED: ${failures.length}`)
    failures.forEach(f => console.log(`   - ${f.id}: ${f.error}`))
  }
  console.log(`----------------------------------------------------------------\n`)
  process.exit(failures.length ? 1 : 0)
}

module.exports = { removeDemoPatients }

if (require.main === module) {
  removeDemoPatients().catch(err => {
    console.error('\nRemoval failed:', err)
    process.exit(1)
  })
}