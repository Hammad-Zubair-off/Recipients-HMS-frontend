/*
 * remove-demo-patients-admin.cjs
 * ----------------------------------------------------------------------------
 * Deletes ONLY the demo patients this project's seed script added
 * (patients where demoBatch === "usa-demo-v1"). Uses the Firebase Admin SDK
 * via the same credential as the seed scripts (_adminApp.cjs).
 *
 * It will NOT touch:
 *   - real patient records (no demo marker)
 *   - the earlier "Seed DB" batch (demoBatch "usa-demo-patients-v2")
 *   - the demo doctors (those are in staffData; see remove-demo-doctors-admin.cjs)
 *
 * Dry run (default - lists, deletes nothing):
 *     node scripts/remove-demo-patients-admin.cjs
 * Actually delete:
 *     node scripts/remove-demo-patients-admin.cjs --confirm
 *
 * To also clear the older Seed DB batch, add:  --batch usa-demo-patients-v2
 * To clear every demoData==true patient, add:  --all-demo
 */

const admin = require('firebase-admin')
const { initAdminApp } = require('./_adminApp.cjs')

async function removeDemoPatientsAdmin() {
  const confirm = process.argv.includes('--confirm')
  const allDemo = process.argv.includes('--all-demo')
  const batchIdx = process.argv.indexOf('--batch')
  const batch = batchIdx > -1 ? process.argv[batchIdx + 1] : 'usa-demo-v1'

  const info = initAdminApp()
  const db = admin.firestore()

  console.log(`\nAuth via : ${info.how}`)
  console.log(`Project  : ${info.projectId}`)
  console.log(`Target   : ${allDemo ? 'ALL patients with demoData == true' : `patients with demoBatch == "${batch}"`}`)
  console.log(`Mode     : ${confirm ? 'DELETE' : 'DRY RUN (pass --confirm to delete)'}\n`)

  const q = allDemo
    ? db.collection('patients').where('demoData', '==', true)
    : db.collection('patients').where('demoBatch', '==', batch)
  const snap = await q.get()

  if (snap.empty) {
    console.log('Nothing matches. Nothing to do.')
    process.exit(0)
  }

  console.log(`Found ${snap.size} patient(s):`)
  const ids = []
  snap.forEach(d => {
    const p = d.data()
    ids.push(d.id)
    console.log(`  - ${p.patientId || d.id}  ${p.fullName}  <${p.email}>  batch=${p.demoBatch || '-'}`)
  })

  if (!confirm) {
    console.log('\nDry run only - nothing deleted. Re-run with --confirm.\n')
    process.exit(0)
  }

  const del = db.batch()
  ids.forEach(id => del.delete(db.collection('patients').doc(id)))
  await del.commit()

  console.log(`\n----------------------------------------------------------------`)
  console.log(`Removed ${ids.length} patient(s). Real records + other batches untouched.`)
  console.log(`----------------------------------------------------------------\n`)
  process.exit(0)
}

if (require.main === module) {
  removeDemoPatientsAdmin().catch(err => {
    console.error('\nRemoval failed:', err)
    process.exit(1)
  })
}

module.exports = { removeDemoPatientsAdmin }