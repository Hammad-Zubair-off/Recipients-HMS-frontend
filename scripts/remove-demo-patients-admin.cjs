/*
 * remove-demo-patients-admin.cjs
 * ----------------------------------------------------------------------------
 * Deletes ONLY the demo patients (patients where demoData === true), using the
 * Firebase Admin SDK (bypasses security rules). Real/application records that
 * do not carry the demoData marker are never read for deletion or touched.
 *
 * Needs the same scripts/serviceAccountKey.json as seed-demo-patients-admin.cjs.
 *
 * Dry run (default - lists, deletes nothing):
 *     node scripts/remove-demo-patients-admin.cjs
 * Actually delete:
 *     node scripts/remove-demo-patients-admin.cjs --confirm
 */

const fs = require('fs')
const path = require('path')
const admin = require('firebase-admin')

function resolveKeyPath() {
  const candidates = [
    process.argv.slice(2).find(a => a.endsWith('.json')),
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    path.join(__dirname, 'serviceAccountKey.json'),
    path.join(__dirname, '..', 'serviceAccountKey.json'),
  ].filter(Boolean)
  return candidates.find(c => fs.existsSync(c)) || null
}

async function removeDemoPatientsAdmin() {
  const confirm = process.argv.includes('--confirm')
  const keyPath = resolveKeyPath()
  if (!keyPath) {
    console.error('\nNo service-account key found (scripts/serviceAccountKey.json).')
    console.error('See the header of seed-demo-patients-admin.cjs for how to get one.\n')
    process.exit(1)
  }

  const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'))
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
  const db = admin.firestore()

  console.log(`\nFirebase project : ${serviceAccount.project_id}`)
  console.log(`Mode             : ${confirm ? 'DELETE' : 'DRY RUN (pass --confirm to delete)'}\n`)

  const snap = await db.collection('patients').where('demoData', '==', true).get()
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

  const batch = db.batch()
  ids.forEach(id => batch.delete(db.collection('patients').doc(id)))
  await batch.commit()

  console.log(`\n----------------------------------------------------------------`)
  console.log(`Removed ${ids.length} demo patient(s). Real records untouched.`)
  console.log(`----------------------------------------------------------------\n`)
  process.exit(0)
}

if (require.main === module) {
  removeDemoPatientsAdmin().catch(err => {
    console.error('\nRemoval (admin) failed:', err)
    process.exit(1)
  })
}

module.exports = { removeDemoPatientsAdmin }