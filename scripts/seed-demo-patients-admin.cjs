/*
 * seed-demo-patients-admin.cjs
 * ----------------------------------------------------------------------------
 * Same 25 fictional USA demo patients as seed-demo-patients.cjs, but written
 * with the Firebase ADMIN SDK. The Admin SDK authenticates with a service
 * account and BYPASSES Firestore security rules, so this works even while the
 * project's rules are locked down.
 *
 * It still:
 *   - uses the EXISTING project / EXISTING (default) database / EXISTING
 *     `patients` collection
 *   - never modifies, overwrites or deletes existing patient records
 *   - is idempotent (skips demo patients whose email already exists)
 *
 * You need a service-account key JSON (this is a local dev secret - it is
 * gitignored and must never be committed or shipped to the frontend):
 *
 *   Firebase Console (signed in as the project owner)
 *     -> Project settings (gear icon)  ->  Service accounts tab
 *     -> "Generate new private key"  ->  save the file as:
 *        scripts/serviceAccountKey.json
 *
 * Then run:
 *   node scripts/seed-demo-patients-admin.cjs
 *
 * Alternatively point at the key explicitly:
 *   node scripts/seed-demo-patients-admin.cjs C:\path\to\key.json
 *   (or set GOOGLE_APPLICATION_CREDENTIALS)
 */

const fs = require('fs')
const path = require('path')
const admin = require('firebase-admin')
const { buildPatientDoc, DEMO_PATIENTS, DEMO_BATCH } = require('./seed-demo-patients.cjs')

function resolveKeyPath() {
  const fromArg = process.argv[2]
  const candidates = [
    fromArg,
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    path.join(__dirname, 'serviceAccountKey.json'),
    path.join(__dirname, '..', 'serviceAccountKey.json'),
  ].filter(Boolean)
  for (const c of candidates) {
    if (fs.existsSync(c)) return c
  }
  return null
}

async function seedDemoPatientsAdmin() {
  const keyPath = resolveKeyPath()
  if (!keyPath) {
    console.error('\nNo service-account key found.')
    console.error('Download one from Firebase Console > Project settings > Service accounts')
    console.error('> "Generate new private key", and save it as:')
    console.error('   ' + path.join(__dirname, 'serviceAccountKey.json'))
    console.error('Then re-run this script.\n')
    process.exit(1)
  }

  const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'))
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
  const db = admin.firestore()

  console.log(`\nService account : ${serviceAccount.client_email}`)
  console.log(`Firebase project : ${serviceAccount.project_id}`)
  console.log(`Firestore database: (default)`)
  console.log(`Collection        : patients`)
  console.log(`Demo batch marker : demoData=true, demoBatch="${DEMO_BATCH}"\n`)

  // Build the 25 docs from the shared definition
  const docs = DEMO_PATIENTS.map((p, i) => buildPatientDoc(p, i))
  const emails = docs.map(d => d.email)

  // Idempotency: which demo emails already exist?
  const existing = new Set()
  // Firestore Admin 'in' also caps at 30; we have 25.
  const snap = await db.collection('patients').where('email', 'in', emails).get()
  snap.forEach(d => existing.add(d.data().email))
  console.log(`Existing demo patients found: ${existing.size}`)

  const toInsert = docs.filter(d => !existing.has(d.email))
  if (toInsert.length === 0) {
    console.log('\nAll 25 demo patients already present. Nothing to insert.')
    process.exit(0)
  }

  console.log(`Inserting ${toInsert.length} demo patient(s)...\n`)
  let inserted = 0
  const failures = []
  // Use a batch (fast + atomic). 25 well under the 500 limit.
  const batch = db.batch()
  const refs = []
  for (const d of toInsert) {
    const ref = db.collection('patients').doc()
    refs.push({ ref, d })
    batch.set(ref, d)
  }
  try {
    await batch.commit()
    inserted = refs.length
    refs.forEach(({ ref, d }) => {
      console.log(`  OK  ${d.patientId}  ${d.fullName.padEnd(18)} ${d.dateOfBirth}  ${d.gender.padEnd(6)} ${d.bloodGroup.padEnd(3)} ${d.city}, ${d.state}  ->  ${ref.id}`)
    })
  } catch (err) {
    failures.push(err.code || err.message)
    console.error(`  Batch commit failed: ${err.code || err.message}`)
  }

  console.log(`\n----------------------------------------------------------------`)
  console.log(`SUCCESS: inserted ${inserted} demo patient(s) into "patients".`)
  console.log(`Skipped (already existed): ${existing.size}`)
  if (failures.length) console.log(`FAILED: ${failures.join('; ')}`)
  console.log(`----------------------------------------------------------------\n`)
  process.exit(failures.length ? 1 : 0)
}

if (require.main === module) {
  seedDemoPatientsAdmin().catch(err => {
    console.error('\nSeed (admin) failed:', err)
    process.exit(1)
  })
}

module.exports = { seedDemoPatientsAdmin }
