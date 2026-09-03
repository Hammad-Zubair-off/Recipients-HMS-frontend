/*
 * seed-demo-patients.cjs
 * ----------------------------------------------------------------------------
 * Local development-only seed script. Inserts 25 COMPLETELY FICTIONAL demo
 * patients into the existing Firestore `patients` collection of the existing
 * Firebase project (the one configured in ../.env / src/firebase/config.js).
 *
 * It does NOT:
 *   - create a Firebase project or database
 *   - modify, overwrite or delete any existing patient records
 *   - touch anything outside the `patients` collection
 *   - embed any service-account key or secret (reads the same public client
 *     config the frontend already uses, from ../.env)
 *
 * Idempotent: every demo patient has a unique email (patient01@example.com ..
 * patient25@example.com) and a `demoData: true` marker. Before inserting, the
 * script looks up those emails and skips any that already exist, so running it
 * multiple times never creates duplicates.
 *
 * Run:   node scripts/seed-demo-patients.cjs
 */

const fs = require('fs')
const path = require('path')
const { initializeApp } = require('firebase/app')
const {
  getFirestore, collection, addDoc, getDocs, query, where,
} = require('firebase/firestore')

// --- Load the existing public Firebase web config from .env -----------------
function loadFirebaseConfig() {
  const envPath = path.join(__dirname, '..', '.env')
  if (!fs.existsSync(envPath)) {
    throw new Error('.env not found next to package.json - cannot read Firebase config')
  }
  const env = {}
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim()
  }
  const cfg = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  }
  if (!cfg.apiKey || !cfg.projectId) {
    throw new Error('Firebase config incomplete in .env (need VITE_FIREBASE_API_KEY / VITE_FIREBASE_PROJECT_ID)')
  }
  return cfg
}

// --- Deterministic DOB from age ------------------------------------------------
// Reference date is fixed so the script is reproducible. Birth month/day are
// always Jan-Aug 1..27, i.e. strictly before the reference month/day, so the
// person's age on the reference date is exactly `age`.
const REFERENCE_DATE = new Date('2026-09-03T00:00:00Z')
function dobFromAge(age, seed) {
  const year = REFERENCE_DATE.getUTCFullYear() - age
  const month = (seed % 8) + 1            // 1..8  (Jan..Aug)
  const day = (seed % 27) + 1             // 1..27
  const mm = String(month).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

function generatePatientId(seed) {
  const timestamp = (Date.now() + seed).toString().slice(-6)
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `PAT-${timestamp}-${random}`
}

// --- 25 fictional USA-resident demo patients --------------------------------
// Phone numbers use the reserved 555-01xx fictional range on real US area codes.
// Insurance policy numbers are obviously fake (DEMO- prefix).
const DEMO_PATIENTS = [
  { n: 'James Anderson',   g: 'Male',   age: 34, ac: '617', city: 'Boston',        st: 'Massachusetts', zip: '02116', addr: '245 Beacon Street, Apt 4B',        bg: 'O+',  ins: 'Aetna',                   rel: 'Spouse',  ecn: 'Laura Anderson',
    all: 'Penicillin', mh: 'Hypertension diagnosed 2019; appendectomy 2007', med: 'Lisinopril 10mg once daily', note: 'Follow-up for hypertension', status: 'active' },
  { n: 'Maria Garcia',     g: 'Female', age: 29, ac: '512', city: 'Austin',        st: 'Texas',         zip: '78704', addr: '1809 South Lamar Blvd, Unit 210',  bg: 'A+',  ins: 'UnitedHealthcare',        rel: 'Partner', ecn: 'Diego Ramos',
    all: 'None known', mh: 'Seasonal allergic rhinitis', med: 'Loratadine 10mg seasonally', note: 'Annual physical', status: 'active' },
  { n: 'Wei Zhang',        g: 'Male',   age: 47, ac: '415', city: 'San Francisco', st: 'California',    zip: '94111', addr: '600 Montgomery Street, Unit 1204', bg: 'B+',  ins: 'Kaiser Permanente',       rel: 'Spouse',  ecn: 'Grace Zhang',
    all: 'Sulfa drugs', mh: 'Type 2 diabetes since 2016; high cholesterol', med: 'Metformin 500mg twice daily; Atorvastatin 20mg nightly', note: 'Diabetes monitoring', status: 'active' },
  { n: 'Aisha Patel',      g: 'Female', age: 22, ac: '732', city: 'Edison',        st: 'New Jersey',    zip: '08817', addr: '55 Parsonage Road, Apt 12',       bg: 'AB+', ins: 'Cigna',                   rel: 'Parent',  ecn: 'Rina Patel',
    all: 'Shellfish', mh: 'Iron-deficiency anemia (2023)', med: 'Ferrous sulfate 325mg daily', note: 'New patient', status: 'inactive' },
  { n: 'David Kim',        g: 'Male',   age: 53, ac: '213', city: 'Los Angeles',   st: 'California',    zip: '90012', addr: '300 South Grand Ave, Apt 7A',     bg: 'O-',  ins: 'Blue Cross Blue Shield',  rel: 'Spouse',  ecn: 'Susan Kim',
    all: 'Aspirin (urticaria)', mh: 'Coronary artery disease; stent placed 2021; former smoker', med: 'Clopidogrel 75mg daily; Metoprolol 50mg twice daily', note: 'Follow-up appointment', status: 'active' },
  { n: 'Fatima Al-Sayed',  g: 'Female', age: 38, ac: '313', city: 'Dearborn',      st: 'Michigan',      zip: '48124', addr: '15201 Michigan Ave, Apt 3C',      bg: 'A-',  ins: 'Humana',                  rel: 'Sibling', ecn: 'Yusuf Al-Sayed',
    all: 'None known', mh: 'Migraine with aura', med: 'Sumatriptan 50mg as needed', note: 'Routine checkup', status: 'active' },
  { n: 'Carlos Mendoza',   g: 'Male',   age: 61, ac: '602', city: 'Phoenix',       st: 'Arizona',       zip: '85004', addr: '100 North Central Ave, Unit 505',  bg: 'B-',  ins: 'Medicare',                rel: 'Child',   ecn: 'Elena Mendoza',
    all: 'Penicillin, bee stings', mh: 'COPD; hypertension; osteoarthritis of the knees', med: 'Tiotropium inhaler daily; Amlodipine 5mg daily', note: 'Preventive care', status: 'active' },
  { n: 'Priya Nair',       g: 'Female', age: 31, ac: '206', city: 'Seattle',       st: 'Washington',    zip: '98109', addr: '400 Dexter Ave N, Apt 908',       bg: 'AB-', ins: 'Aetna',                   rel: 'Partner', ecn: 'Anita Nair',
    all: 'Latex', mh: 'Hypothyroidism (2019)', med: 'Levothyroxine 75mcg daily', note: 'Follow-up appointment', status: 'active' },
  { n: 'Kwame Osei',       g: 'Male',   age: 44, ac: '718', city: 'Bronx',         st: 'New York',      zip: '10451', addr: '270 East 149th Street, Apt 6D',    bg: 'O+',  ins: 'UnitedHealthcare',        rel: 'Spouse',  ecn: 'Abena Osei',
    all: 'None known', mh: 'Sickle cell trait; GERD', med: 'Omeprazole 20mg daily', note: 'Routine checkup', status: 'active' },
  { n: 'Sofia Rossi',      g: 'Female', age: 27, ac: '401', city: 'Providence',    st: 'Rhode Island',  zip: '02903', addr: '10 Weybosset Street, Apt 2',      bg: 'A+',  ins: 'Cigna',                   rel: 'Friend',  ecn: 'Marco Bianchi',
    all: 'Pollen, dust mites', mh: 'Asthma (childhood onset)', med: 'Albuterol inhaler as needed', note: 'Annual physical', status: 'active' },
  { n: 'Hiroshi Tanaka',   g: 'Male',   age: 58, ac: '808', city: 'Honolulu',      st: 'Hawaii',        zip: '96815', addr: '2500 Kalakaua Ave, Unit 1802',    bg: 'B+',  ins: 'Kaiser Permanente',       rel: 'Spouse',  ecn: 'Yoko Tanaka',
    all: 'None known', mh: 'Benign prostatic hyperplasia; high cholesterol', med: 'Tamsulosin 0.4mg daily; Rosuvastatin 10mg nightly', note: 'Preventive care', status: 'active' },
  { n: 'Leila Haddad',     g: 'Female', age: 40, ac: '312', city: 'Chicago',       st: 'Illinois',      zip: '60614', addr: '2100 North Clark Street, Apt 4B',  bg: 'AB+', ins: 'Blue Cross Blue Shield',  rel: 'Sibling', ecn: 'Sami Haddad',
    all: 'Codeine (nausea)', mh: 'Anxiety disorder; vitamin D deficiency', med: 'Sertraline 50mg daily; vitamin D3 2000 IU daily', note: 'Follow-up appointment', status: 'active' },
  { n: 'Miguel Santos',    g: 'Male',   age: 19, ac: '210', city: 'San Antonio',   st: 'Texas',         zip: '78205', addr: '110 East Houston Street, Apt 9',   bg: 'O-',  ins: 'Medicaid',                rel: 'Parent',  ecn: 'Rosa Santos',
    all: 'None known', mh: 'No significant medical history', med: 'None', note: 'New patient', status: 'inactive' },
  { n: 'Anna Kowalski',    g: 'Female', age: 66, ac: '412', city: 'Pittsburgh',    st: 'Pennsylvania',  zip: '15222', addr: '925 Liberty Ave, Unit 610',       bg: 'A-',  ins: 'Medicare',                rel: 'Child',   ecn: 'Peter Kowalski',
    all: 'Ibuprofen (GI upset)', mh: 'Atrial fibrillation; osteopenia; cataract surgery 2022', med: 'Apixaban 5mg twice daily; calcium + vitamin D3', note: 'Follow-up appointment', status: 'active' },
  { n: 'Rajesh Gupta',     g: 'Male',   age: 49, ac: '408', city: 'Sunnyvale',     st: 'California',    zip: '94086', addr: '650 West Olive Ave, Apt 314',     bg: 'B-',  ins: 'Humana',                  rel: 'Spouse',  ecn: 'Meena Gupta',
    all: 'None known', mh: 'Prediabetes; fatty liver', med: 'None', note: 'Diabetes monitoring', status: 'active' },
  { n: 'Nadia Petrova',    g: 'Female', age: 35, ac: '347', city: 'Brooklyn',      st: 'New York',      zip: '11215', addr: '200 7th Avenue, Apt 5F',          bg: 'AB-', ins: 'Aetna',                   rel: 'Partner', ecn: 'Ivan Petrov',
    all: 'Peanuts (anaphylaxis)', mh: 'Severe peanut allergy; migraine', med: 'Carries epinephrine auto-injector', note: 'Routine checkup', status: 'active' },
  { n: 'Samuel Okafor',    g: 'Male',   age: 25, ac: '713', city: 'Houston',       st: 'Texas',         zip: '77002', addr: '1400 McKinney Street, Apt 22',    bg: 'O+',  ins: 'UnitedHealthcare',        rel: 'Sibling', ecn: 'Chidi Okafor',
    all: 'None known', mh: 'ACL reconstruction (right knee, 2020)', med: 'None', note: 'Preventive care', status: 'active' },
  { n: 'Mei Lin',          g: 'Female', age: 72, ac: '503', city: 'Portland',      st: 'Oregon',        zip: '97205', addr: '1000 SW Broadway, Unit 1204',     bg: 'A+',  ins: 'Kaiser Permanente',       rel: 'Child',   ecn: 'Daniel Lin',
    all: 'Shellfish', mh: 'Type 2 diabetes; diabetic neuropathy; hypertension', med: 'Insulin glargine nightly; Metformin 1000mg twice daily; Losartan 50mg daily', note: 'Diabetes monitoring', status: 'active' },
  { n: 'Ahmed Hassan',     g: 'Male',   age: 41, ac: '614', city: 'Columbus',      st: 'Ohio',          zip: '43215', addr: '250 South High Street, Apt 7B',   bg: 'B+',  ins: 'Cigna',                   rel: 'Spouse',  ecn: 'Mona Hassan',
    all: 'None known', mh: 'Kidney stones (2021); hyperlipidemia', med: 'Atorvastatin 10mg nightly', note: 'Routine checkup', status: 'active' },
  { n: 'Isabella Nguyen',  g: 'Female', age: 33, ac: '303', city: 'Denver',        st: 'Colorado',      zip: '80202', addr: '1601 Wewatta Street, Apt 512',    bg: 'AB+', ins: 'Blue Cross Blue Shield',  rel: 'Partner', ecn: 'Kevin Tran',
    all: 'Dairy (intolerance)', mh: 'Polycystic ovary syndrome', med: 'None', note: 'Annual physical', status: 'active' },
  { n: 'Jordan Taylor',    g: 'Other',  age: 28, ac: '612', city: 'Minneapolis',   st: 'Minnesota',     zip: '55401', addr: '700 Washington Ave N, Apt 410',   bg: 'O-',  ins: 'Aetna',                   rel: 'Friend',  ecn: 'Alex Morgan',
    all: 'None known', mh: 'Generalized anxiety; vitamin B12 deficiency', med: 'Vitamin B12 1000mcg weekly', note: 'New patient', status: 'active' },
  { n: 'Dmitri Volkov',    g: 'Male',   age: 55, ac: '916', city: 'Sacramento',    st: 'California',    zip: '95814', addr: '1215 K Street, Unit 808',         bg: 'A-',  ins: 'Humana',                  rel: 'Spouse',  ecn: 'Olga Volkova',
    all: 'Contrast dye', mh: 'Chronic lower back pain; hypertension; sleep apnea (uses CPAP)', med: 'Amlodipine 10mg daily; naproxen as needed', note: 'Follow-up for hypertension', status: 'inactive' },
  { n: 'Grace Kim',        g: 'Female', age: 84, ac: '619', city: 'San Diego',     st: 'California',    zip: '92101', addr: '500 West Broadway, Unit 1503',    bg: 'B-',  ins: 'Medicare',                rel: 'Child',   ecn: 'Helen Kim',
    all: 'Penicillin', mh: 'Congestive heart failure; osteoarthritis; hip replacement 2019', med: 'Furosemide 20mg daily; Lisinopril 5mg daily; acetaminophen as needed', note: 'Follow-up appointment', status: 'active' },
  { n: 'Omar Farouk',      g: 'Male',   age: 37, ac: '615', city: 'Nashville',     st: 'Tennessee',     zip: '37203', addr: '1200 Broadway, Apt 3A',           bg: 'AB-', ins: 'UnitedHealthcare',        rel: 'Sibling', ecn: 'Karim Farouk',
    all: 'None known', mh: 'GERD; mild depression', med: 'Pantoprazole 40mg daily', note: 'Routine checkup', status: 'active' },
  { n: 'Chloe Dubois',     g: 'Female', age: 45, ac: '504', city: 'New Orleans',   st: 'Louisiana',     zip: '70112', addr: '234 Loyola Ave, Apt 611',         bg: 'O+',  ins: 'Cigna',                   rel: 'Spouse',  ecn: 'Julien Dubois',
    all: 'Latex, kiwi', mh: 'Breast cancer in remission (2019); osteopenia', med: 'Anastrozole 1mg daily; calcium + vitamin D3', note: 'Preventive care', status: 'active' },
]

const DEMO_BATCH = 'usa-demo-v1'

function buildPatientDoc(p, index) {
  const seed = index + 1
  const nowIso = new Date().toISOString()
  const emailNum = String(seed).padStart(2, '0')
  return {
    // --- fields the existing form collects ---
    fullName: p.n,
    phone: `+1 (${p.ac}) 555-01${emailNum}`,
    email: `patient${emailNum}@example.com`,
    dateOfBirth: dobFromAge(p.age, seed),
    gender: p.g,
    address: p.addr,
    city: p.city,
    state: p.st,
    zipCode: p.zip,
    emergencyContactName: p.ecn,
    emergencyContactPhone: `+1 (${p.ac}) 555-02${emailNum}`,
    emergencyContactRelation: p.rel,
    bloodGroup: p.bg,
    allergies: p.all,
    medicalHistory: p.mh,
    medications: p.med,
    insuranceProvider: p.ins,
    insurancePolicyNumber: `DEMO-${p.ins.split(' ').map(w => w[0]).join('').toUpperCase()}-${100000 + seed}`,
    notes: p.note,
    status: p.status,
    // --- fields the app generates on create ---
    patientId: generatePatientId(seed),
    createdAt: nowIso,
    updatedAt: nowIso,
    createdBy: 'demo-seed-script',
    updatedBy: 'demo-seed-script',
    // --- non-breaking markers so these records can be found & removed safely ---
    demoData: true,
    demoBatch: DEMO_BATCH,
  }
}

async function seedDemoPatients() {
  const cfg = loadFirebaseConfig()
  const app = initializeApp(cfg)
  const db = getFirestore(app)

  console.log(`\nFirebase project : ${cfg.projectId}`)
  console.log(`Firestore database: (default)`)
  console.log(`Collection        : patients`)
  console.log(`Demo batch marker : demoData=true, demoBatch="${DEMO_BATCH}"\n`)

  const docs = DEMO_PATIENTS.map(buildPatientDoc)
  const emails = docs.map(d => d.email)

  // --- Check which demo patients already exist (idempotency) ---------------
  // Firestore 'in' supports up to 30 values; we have 25.
  let existingEmails = new Set()
  try {
    const snap = await getDocs(query(collection(db, 'patients'), where('email', 'in', emails)))
    snap.forEach(d => existingEmails.add(d.data().email))
    console.log(`Existing demo patients found: ${existingEmails.size}`)
  } catch (err) {
    console.error(`\nCould not query existing patients: ${err.code || err.message}`)
    if ((err.code || '').includes('permission-denied')) {
      console.error('\n>> Firestore security rules are blocking access.')
      console.error('>> Publish firestore.rules to this project, then re-run:')
      console.error('>>   npx firebase deploy --only firestore:rules --project ' + cfg.projectId)
      console.error('>> or paste the rules in Firebase Console > Firestore > Rules > Publish.\n')
    }
    process.exit(1)
  }

  const toInsert = docs.filter(d => !existingEmails.has(d.email))
  if (toInsert.length === 0) {
    console.log('\nAll 25 demo patients are already present. Nothing to insert.')
    process.exit(0)
  }

  console.log(`Inserting ${toInsert.length} demo patient(s)...\n`)
  let inserted = 0
  const failures = []
  for (const d of toInsert) {
    try {
      const ref = await addDoc(collection(db, 'patients'), d)
      inserted++
      console.log(`  OK  ${d.patientId}  ${d.fullName.padEnd(18)} ${String(d.dateOfBirth)}  ${d.gender.padEnd(6)} ${d.bloodGroup.padEnd(3)} ${d.city}, ${d.state}  ->  ${ref.id}`)
    } catch (err) {
      failures.push({ name: d.fullName, error: err.code || err.message })
      console.error(`  ERR ${d.fullName}: ${err.code || err.message}`)
    }
  }

  console.log(`\n----------------------------------------------------------------`)
  console.log(`SUCCESS: inserted ${inserted} demo patient(s) into "patients".`)
  console.log(`Skipped (already existed): ${existingEmails.size}`)
  if (failures.length) {
    console.log(`FAILED: ${failures.length}`)
    failures.forEach(f => console.log(`   - ${f.name}: ${f.error}`))
  }
  console.log(`----------------------------------------------------------------\n`)
  process.exit(failures.length ? 1 : 0)
}

module.exports = { seedDemoPatients, buildPatientDoc, DEMO_PATIENTS, DEMO_BATCH }

if (require.main === module) {
  seedDemoPatients().catch(err => {
    console.error('\nSeed failed:', err)
    process.exit(1)
  })
}