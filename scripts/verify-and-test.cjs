/*
 * verify-and-test.cjs
 * ----------------------------------------------------------------------------
 * Verifies the seeded data and stress-tests the concurrency-safe token
 * generation against the LIVE Firestore, using the SAME transaction logic
 * that src/pages/receptionist/token/TokenManagement.jsx now uses.
 *
 * Creates a handful of throwaway test appointments (marked __tokenTest: true),
 * fires token generation at them concurrently, checks every token is unique,
 * then deletes the throwaway appointments and the test counter doc.
 * Real appointments / patients / doctors are never touched.
 *
 *   node scripts/verify-and-test.cjs
 */

const admin = require('firebase-admin')
const { initAdminApp } = require('./_adminApp.cjs')
const { FieldValue } = require('firebase-admin/firestore')

const info = initAdminApp()
const db = admin.firestore()

// --- Port of TokenManagement.generateToken()'s transaction -----------------
async function assignToken(appointmentId, dateKey, existingFloor) {
  const counterRef = db.collection('tokenCounters').doc(dateKey)
  const appointmentRef = db.collection('appointments').doc(appointmentId)

  return db.runTransaction(async (tx) => {
    const apptSnap = await tx.get(appointmentRef)
    if (!apptSnap.exists) throw new Error('Appointment no longer exists')
    const current = apptSnap.data().tokenNumber
    if (current != null) return { token: current, alreadyHad: true }

    const counterSnap = await tx.get(counterRef)
    const counterValue = counterSnap.exists ? (counterSnap.data().current || 0) : 0
    const next = Math.max(counterValue, existingFloor) + 1

    tx.set(counterRef, { current: next, dateKey, updatedAt: FieldValue.serverTimestamp() }, { merge: true })
    tx.update(appointmentRef, {
      tokenNumber: next,
      tokenGeneratedAt: new Date().toISOString(),
      status: 'token_generated',
    })
    return { token: next, alreadyHad: false }
  })
}

async function main() {
  console.log(`Auth via : ${info.how}`)
  console.log(`Project  : ${info.projectId}\n`)

  // ---------- 1. staffData / doctors ----------
  const staff = await db.collection('staffData').get()
  const doctors = staff.docs.filter(d => d.data().role === 'doctor')
  console.log('=== staffData ===')
  console.log(`total staff docs: ${staff.size}`)
  staff.docs.forEach(d => {
    const s = d.data()
    console.log(`  ${d.id}  role=${s.role}  name=${s.fullName}  spec=${s.specialization || '-'}  demo=${!!s.demoData}`)
  })
  console.log(`doctors with role=="doctor": ${doctors.length}`)

  // ---------- 2. patients ----------
  const patients = await db.collection('patients').get()
  const demoPatients = patients.docs.filter(d => d.data().demoData === true)
  const realPatients = patients.docs.filter(d => d.data().demoData !== true)
  console.log('\n=== patients ===')
  console.log(`total: ${patients.size}   demo(demoData==true): ${demoPatients.length}   non-demo: ${realPatients.length}`)
  const genders = {}
  const bloods = {}
  const statuses = {}
  demoPatients.forEach(d => {
    const p = d.data()
    genders[p.gender] = (genders[p.gender] || 0) + 1
    bloods[p.bloodGroup] = (bloods[p.bloodGroup] || 0) + 1
    statuses[p.status] = (statuses[p.status] || 0) + 1
  })
  console.log('demo genders  :', genders)
  console.log('demo blood grp:', bloods)
  console.log('demo status   :', statuses)

  // ---------- 3. token concurrency stress test ----------
  console.log('\n=== token generation stress test ===')
  const testDateKey = '1999-01-01' // clearly-not-real date so a stray counter is obvious
  const N = 12
  const testApptIds = []
  const batch = db.batch()
  for (let i = 0; i < N; i++) {
    const ref = db.collection('appointments').doc()
    testApptIds.push(ref.id)
    batch.set(ref, {
      __tokenTest: true,
      patientName: `Token Test Patient ${i + 1}`,
      appointmentDate: testDateKey,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
    })
  }
  await batch.commit()
  console.log(`created ${N} throwaway test appointments (date ${testDateKey})`)

  // Fire ALL token generations concurrently - the real race condition.
  const results = await Promise.allSettled(
    testApptIds.map(id => assignToken(id, testDateKey, 0))
  )
  const tokens = results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value.token)
    .sort((a, b) => a - b)
  const rejected = results.filter(r => r.status === 'rejected')

  console.log(`tokens assigned (concurrent): [${tokens.join(', ')}]`)
  const unique = new Set(tokens)
  console.log(`count=${tokens.length}  unique=${unique.size}  rejected=${rejected.length}`)
  const isSequential = tokens.every((t, i) => t === i + 1)
  const noDupes = unique.size === tokens.length
  console.log(`NO DUPLICATES: ${noDupes ? 'PASS' : 'FAIL'}`)
  console.log(`sequential 1..${N}: ${isSequential ? 'PASS' : 'FAIL'}`)

  // Second pass: re-run on the same appointments -> must NOT reassign / duplicate
  const rerun = await Promise.allSettled(testApptIds.map(id => assignToken(id, testDateKey, 0)))
  const reassigned = rerun.filter(r => r.status === 'fulfilled' && r.value.alreadyHad === false)
  console.log(`re-run reassigned any token: ${reassigned.length === 0 ? 'PASS (none)' : 'FAIL (' + reassigned.length + ')'}`)

  // One more after the batch -> continues the sequence
  const extraRef = db.collection('appointments').doc()
  await extraRef.set({ __tokenTest: true, appointmentDate: testDateKey, status: 'scheduled', createdAt: new Date().toISOString() })
  const extra = await assignToken(extraRef.id, testDateKey, 0)
  console.log(`token after refresh/extra generate: ${extra.token} (expected ${N + 1}) -> ${extra.token === N + 1 ? 'PASS' : 'FAIL'}`)
  testApptIds.push(extraRef.id)

  // ---------- cleanup test data ----------
  const cleanup = db.batch()
  testApptIds.forEach(id => cleanup.delete(db.collection('appointments').doc(id)))
  cleanup.delete(db.collection('tokenCounters').doc(testDateKey))
  await cleanup.commit()
  console.log(`\ncleaned up ${testApptIds.length} test appointments + test counter doc`)

  console.log('\nDONE.')
  process.exit(0)
}

main().catch(e => { console.error('verify/test FAILED:', e); process.exit(1) })