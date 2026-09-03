/*
 * seed-demo-doctors-admin.cjs
 * ----------------------------------------------------------------------------
 * Creates 4 fictional U.S. doctor records in the EXISTING `staffData`
 * collection so the receptionist "Create Appointment" doctor dropdown (which
 * queries staffData where role == 'doctor' and displays `specialization`)
 * stops showing "No doctors available".
 *
 * Uses the Firebase Admin SDK (bypasses security rules). Needs the same
 * scripts/serviceAccountKey.json as seed-demo-patients-admin.cjs.
 *
 *   node scripts/seed-demo-doctors-admin.cjs
 *
 * Idempotent: keyed by fixed document ids (demo-doctor-01..04) and unique
 * emails. Existing docs are left untouched; nothing is overwritten or deleted.
 * No Firebase Auth accounts are created (the receptionist dropdown only needs
 * the staffData records; a real doctor still signs up normally).
 */

const admin = require('firebase-admin')
const { initAdminApp } = require('./_adminApp.cjs')

const DEMO_BATCH = 'usa-doctors-v1'

// specialization = the EXACT field name the receptionist dropdown reads.
const DOCTORS = [
  { id: 'demo-doctor-01', fullName: 'Olivia Martinez', specialization: 'Cardiology',      ac: '617' },
  { id: 'demo-doctor-02', fullName: 'Ethan Anderson',  specialization: 'Family Medicine', ac: '312' },
  { id: 'demo-doctor-03', fullName: 'Sophia Patel',    specialization: 'Dermatology',     ac: '415' },
  { id: 'demo-doctor-04', fullName: 'Marcus Williams', specialization: 'Orthopedics',     ac: '206' },
]

function buildDoctorDoc(d, i) {
  const now = new Date().toISOString()
  const n = String(i + 1).padStart(2, '0')
  const slug = d.fullName.toLowerCase().replace(/[^a-z]+/g, '.')
  return {
    uid: d.id,
    fullName: d.fullName,
    email: `dr.${slug}@example.com`,
    phone: `+1 (${d.ac}) 555-07${n}`,
    role: 'doctor',
    specialization: d.specialization,
    status: 'active',
    emailVerified: true,
    createdAt: now,
    updatedAt: now,
    lastLogin: null,
    demoData: true,
    demoBatch: DEMO_BATCH,
  }
}

async function seedDemoDoctorsAdmin() {
  const info = initAdminApp()
  const db = admin.firestore()

  console.log(`\nAuth via          : ${info.how}`)
  console.log(`Firebase project  : ${info.projectId}`)
  console.log(`Collection        : staffData`)
  console.log(`Demo batch marker : demoData=true, demoBatch="${DEMO_BATCH}"\n`)

  const docs = DOCTORS.map(buildDoctorDoc)

  // Idempotency: skip any doc id that already exists, and any email already taken.
  const emails = docs.map(d => d.email)
  const emailSnap = await db.collection('staffData').where('email', 'in', emails).get()
  const takenEmails = new Set()
  emailSnap.forEach(s => takenEmails.add(s.data().email))

  let inserted = 0
  const skipped = []
  const failures = []

  for (let i = 0; i < DOCTORS.length; i++) {
    const id = DOCTORS[i].id
    const data = docs[i]
    const ref = db.collection('staffData').doc(id)
    try {
      const existing = await ref.get()
      if (existing.exists || takenEmails.has(data.email)) {
        skipped.push(`${data.fullName} (${id})`)
        continue
      }
      await ref.set(data)
      inserted++
      console.log(`  OK  ${id}  Dr. ${data.fullName.padEnd(18)} ${data.specialization.padEnd(16)} role=${data.role}`)
    } catch (err) {
      failures.push({ name: data.fullName, error: err.code || err.message })
      console.error(`  ERR ${data.fullName}: ${err.code || err.message}`)
    }
  }

  console.log(`\n----------------------------------------------------------------`)
  console.log(`SUCCESS: inserted ${inserted} doctor(s) into "staffData".`)
  if (skipped.length) console.log(`Skipped (already existed): ${skipped.join(', ')}`)
  if (failures.length) {
    console.log(`FAILED: ${failures.length}`)
    failures.forEach(f => console.log(`   - ${f.name}: ${f.error}`))
  }
  console.log(`----------------------------------------------------------------\n`)
  process.exit(failures.length ? 1 : 0)
}

if (require.main === module) {
  seedDemoDoctorsAdmin().catch(err => {
    console.error('\nSeed (doctors) failed:', err)
    process.exit(1)
  })
}

module.exports = { seedDemoDoctorsAdmin, DOCTORS, DEMO_BATCH }
