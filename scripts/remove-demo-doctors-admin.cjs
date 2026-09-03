/*
 * remove-demo-doctors-admin.cjs
 * ----------------------------------------------------------------------------
 * Deletes ONLY the 4 seeded demo doctors (staffData where
 * demoBatch === "usa-doctors-v1"). Never touches real staff accounts
 * (e.g. the receptionist "Ali") - those have no demo marker.
 *
 * Dry run:   node scripts/remove-demo-doctors-admin.cjs
 * Delete:    node scripts/remove-demo-doctors-admin.cjs --confirm
 */

const admin = require('firebase-admin')
const { initAdminApp } = require('./_adminApp.cjs')

async function removeDemoDoctorsAdmin() {
  const confirm = process.argv.includes('--confirm')
  const info = initAdminApp()
  const db = admin.firestore()

  console.log(`\nAuth via : ${info.how}`)
  console.log(`Project  : ${info.projectId}`)
  console.log(`Target   : staffData where demoBatch == "usa-doctors-v1"`)
  console.log(`Mode     : ${confirm ? 'DELETE' : 'DRY RUN (pass --confirm to delete)'}\n`)

  const snap = await db.collection('staffData').where('demoBatch', '==', 'usa-doctors-v1').get()
  if (snap.empty) {
    console.log('No seeded demo doctors found. Nothing to do.')
    process.exit(0)
  }

  console.log(`Found ${snap.size} demo doctor(s):`)
  const ids = []
  snap.forEach(d => {
    const s = d.data()
    ids.push(d.id)
    console.log(`  - ${d.id}  Dr. ${s.fullName}  ${s.specialization}  role=${s.role}`)
  })

  if (!confirm) {
    console.log('\nDry run only - nothing deleted. Re-run with --confirm.\n')
    process.exit(0)
  }

  const del = db.batch()
  ids.forEach(id => del.delete(db.collection('staffData').doc(id)))
  await del.commit()

  console.log(`\nRemoved ${ids.length} demo doctor(s). Real staff untouched.\n`)
  process.exit(0)
}

if (require.main === module) {
  removeDemoDoctorsAdmin().catch(err => {
    console.error('\nRemoval failed:', err)
    process.exit(1)
  })
}

module.exports = { removeDemoDoctorsAdmin }