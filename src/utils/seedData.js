import { collection, doc, getDocs, query, where, writeBatch, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'

const DEMO_PATIENT_BATCH = 'usa-demo-patients-v2'

const demoPatientSeeds = [
  ['Ethan Brooks', 'Male', 24, 'New York', 'NY', '10011', 'O+', 'None known', 'No significant medical history', 'None', 'Aetna', 'Spouse'],
  ['Camila Torres', 'Female', 31, 'Los Angeles', 'CA', '90026', 'A+', 'Penicillin', 'Asthma; seasonal allergies', 'Albuterol inhaler as needed', 'Cigna', 'Sibling'],
  ['Marcus Jefferson', 'Male', 58, 'Chicago', 'IL', '60614', 'B+', 'Sulfa drugs', 'Hypertension; hyperlipidemia', 'Lisinopril 10mg; Atorvastatin 20mg', 'Humana', 'Partner'],
  ['Lina Chen', 'Female', 42, 'Houston', 'TX', '77008', 'AB+', 'None known', 'Hypothyroidism', 'Levothyroxine 75mcg daily', 'UnitedHealthcare', 'Parent'],
  ['Nolan Yazzie', 'Male', 67, 'Phoenix', 'AZ', '85016', 'O-', 'Latex', 'Type 2 diabetes; arthritis', 'Metformin 500mg; Acetaminophen as needed', 'Medicare', 'Child'],
  ['Grace Whitaker', 'Female', 76, 'Philadelphia', 'PA', '19103', 'A-', 'Aspirin', 'Osteoarthritis; vitamin D deficiency', 'Vitamin D3 2000 IU daily', 'Medicare', 'Friend'],
  ['Diego Morales', 'Male', 36, 'San Antonio', 'TX', '78209', 'B-', 'None known', 'GERD', 'Omeprazole 20mg daily', 'Medicaid', 'Spouse'],
  ['Avery Sinclair', 'Other', 29, 'San Diego', 'CA', '92103', 'AB-', 'Shellfish', 'Migraine with aura', 'Sumatriptan 50mg as needed', 'Kaiser Permanente', 'Partner'],
  ['Hannah Reed', 'Female', 52, 'Dallas', 'TX', '75219', 'O+', 'Peanuts', 'Hypertension', 'Amlodipine 5mg daily', 'Blue Cross Blue Shield', 'Child'],
  ['Andre Williams', 'Male', 45, 'Austin', 'TX', '78703', 'A+', 'None known', 'No significant medical history', 'None', 'Aetna', 'Sibling'],
  ['Mei Sullivan', 'Female', 21, 'Seattle', 'WA', '98103', 'B+', 'Seasonal/environmental allergies', 'Seasonal allergies', 'Cetirizine 10mg as needed', 'Cigna', 'Parent'],
  ['Caleb Foster', 'Male', 83, 'Boston', 'MA', '02116', 'O-', 'Penicillin', 'Congestive heart failure; arthritis', 'Furosemide 20mg; Lisinopril 5mg', 'Medicare', 'Spouse'],
  ['Nia Thompson', 'Female', 39, 'Denver', 'CO', '80206', 'A-', 'None known', 'Anxiety; vitamin D deficiency', 'Sertraline 50mg daily', 'Humana', 'Friend'],
  ['Owen McCarthy', 'Male', 63, 'Atlanta', 'GA', '30309', 'B-', 'Sulfa drugs', 'Hyperlipidemia', 'Rosuvastatin 10mg nightly', 'UnitedHealthcare', 'Child'],
  ['Sofia Rivera', 'Female', 27, 'Miami', 'FL', '33133', 'AB+', 'Latex', 'No significant medical history', 'None', 'Medicaid', 'Sibling'],
  ['Terrence Coleman', 'Male', 71, 'Minneapolis', 'MN', '55401', 'O+', 'None known', 'Type 2 diabetes; hypertension', 'Metformin 500mg; Losartan 50mg', 'Blue Cross Blue Shield', 'Spouse'],
  ['Maya Patel', 'Female', 34, 'Portland', 'OR', '97205', 'A+', 'Shellfish', 'Hypothyroidism', 'Levothyroxine 50mcg daily', 'Kaiser Permanente', 'Partner'],
  ['Elijah Carter', 'Male', 19, 'Charlotte', 'NC', '28202', 'B+', 'None known', 'No significant medical history', 'None', 'Aetna', 'Parent'],
  ['Rosa Delgado', 'Female', 55, 'Nashville', 'TN', '37203', 'AB-', 'Aspirin', 'GERD; migraine', 'Pantoprazole 40mg; Sumatriptan as needed', 'Cigna', 'Child'],
  ['Jordan Ellis', 'Other', 48, 'Washington', 'DC', '20009', 'O-', 'None known', 'Asthma', 'Albuterol inhaler as needed', 'Humana', 'Friend'],
  ['Lydia Washington', 'Female', 69, 'New York', 'NY', '11215', 'A-', 'Penicillin', 'Osteoarthritis; hypertension', 'Amlodipine 5mg daily', 'Medicare', 'Spouse'],
  ['Mateo Cruz', 'Male', 23, 'Los Angeles', 'CA', '90034', 'B-', 'None known', 'No significant medical history', 'None', 'Medicaid', 'Sibling'],
  ['Jamal Richardson', 'Male', 61, 'Chicago', 'IL', '60640', 'O+', 'Peanuts', 'Type 2 diabetes', 'Metformin 1000mg twice daily', 'UnitedHealthcare', 'Child'],
  ['Yuna Park', 'Female', 44, 'Houston', 'TX', '77019', 'A+', 'None known', 'Hyperlipidemia; anxiety', 'Atorvastatin 20mg; Sertraline 25mg', 'Blue Cross Blue Shield', 'Partner'],
  ['Thomas Redbird', 'Male', 78, 'Phoenix', 'AZ', '85018', 'AB+', 'Latex', 'Arthritis; vitamin D deficiency', 'Vitamin D3 2000 IU daily', 'Medicare', 'Spouse'],
  ['Isabel Romero', 'Female', 37, 'Philadelphia', 'PA', '19107', 'B+', 'Seasonal/environmental allergies', 'Seasonal allergies', 'Loratadine 10mg as needed', 'Aetna', 'Parent'],
  ['Malcolm Hayes', 'Male', 50, 'San Antonio', 'TX', '78212', 'O-', 'Sulfa drugs', 'Hypertension; GERD', 'Lisinopril 10mg; Omeprazole 20mg', 'Cigna', 'Sibling'],
  ['Priya Shah', 'Female', 65, 'Seattle', 'WA', '98115', 'A-', 'None known', 'Hypothyroidism; osteoporosis', 'Levothyroxine 75mcg; Calcium daily', 'Humana', 'Child'],
  ['Brooke Morgan', 'Female', 18, 'Denver', 'CO', '80211', 'AB-', 'None known', 'No significant medical history', 'None', 'Medicaid', 'Friend'],
  ['Samir Haddad', 'Male', 57, 'Atlanta', 'GA', '30318', 'B-', 'Penicillin', 'Asthma; hyperlipidemia', 'Albuterol inhaler; Rosuvastatin 10mg', 'Kaiser Permanente', 'Partner'],
]

function buildDemoPatient(seed, index, userId) {
  const [fullName, gender, age, city, state, zipCode, bloodGroup, allergies, medicalHistory, medications, insuranceProvider, emergencyContactRelation] = seed
  const [firstName, ...lastNameParts] = fullName.split(' ')
  const lastName = lastNameParts.join(' ')
  const number = String(index + 1).padStart(3, '0')
  const birthDate = new Date(Date.UTC(2026 - age, (index * 3) % 12, ((index * 7) % 27) + 1))
  const dateOfBirth = birthDate.toISOString().slice(0, 10)
  const streetNumber = 100 + index * 17
  const streetName = ['Oak Avenue', 'Maple Street', 'Cedar Lane', 'Pine Road', 'Lakeview Drive'][index % 5]

  return {
    fullName,
    phone: `+1 (555) 010-${String(1000 + index).slice(-4)}`,
    email: `demo.patient.${number}@example.com`,
    dateOfBirth,
    gender,
    address: `${streetNumber} ${streetName}`,
    city,
    state,
    zipCode,
    emergencyContactName: `${firstName} ${lastName} Emergency Contact ${number}`,
    emergencyContactPhone: `+1 (555) 011-${String(1000 + index).slice(-4)}`,
    emergencyContactRelation,
    bloodGroup,
    allergies,
    medicalHistory,
    medications,
    insuranceProvider,
    insurancePolicyNumber: `DEMO-${DEMO_PATIENT_BATCH}-${number}`,
    notes: ['Annual physical', 'New patient', 'Routine checkup', 'Preventive care', 'Medication review', 'Follow-up appointment'][index % 6],
    status: index === 5 || index === 15 || index === 24 ? 'inactive' : 'active',
    patientId: `DEMO-PAT-${number}`,
    createdAt: serverTimestamp(),
    createdBy: userId,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
    demoData: true,
    demoBatch: DEMO_PATIENT_BATCH
  }
}

// 1. Static Medicines Data
export const medicinesData = [
  { name: 'Amoxicillin', category: 'Antibiotic', strength: '500mg', form: 'Capsule', stock: 100, unitPrice: 15 },
  { name: 'Paracetamol', category: 'Analgesic', strength: '650mg', form: 'Tablet', stock: 500, unitPrice: 5 },
  { name: 'Ibuprofen', category: 'Painkiller', strength: '400mg', form: 'Tablet', stock: 200, unitPrice: 8 },
  { name: 'Cetirizine', category: 'Antihistamine', strength: '10mg', form: 'Tablet', stock: 300, unitPrice: 10 },
  { name: 'Omeprazole', category: 'Antacid', strength: '20mg', form: 'Capsule', stock: 150, unitPrice: 12 },
  { name: 'Metformin', category: 'Antidiabetic', strength: '500mg', form: 'Tablet', stock: 250, unitPrice: 7 },
  { name: 'Amlodipine', category: 'Antihypertensive', strength: '5mg', form: 'Tablet', stock: 200, unitPrice: 6 },
  { name: 'Azithromycin', category: 'Antibiotic', strength: '500mg', form: 'Tablet', stock: 100, unitPrice: 25 },
  { name: 'Pantoprazole', category: 'Antacid', strength: '40mg', form: 'Tablet', stock: 200, unitPrice: 9 },
  { name: 'Vitamin D3', category: 'Supplement', strength: '60k IU', form: 'Sachet', stock: 100, unitPrice: 40 }
]

// 2. Static Appointments Data (Past & Future)
// Note: We use ISO strings for dates to ensure compatibility
const today = new Date().toISOString().split('T')[0]
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

export const appointmentsData = [
  {
    patientName: 'Ethan Brooks',
    patientPhone: '+1 (555) 010-1000',
    patientEmail: 'demo.patient.001@example.com',
    patientAge: '32',
    patientGender: 'Male',
    doctorName: 'Dr. Emily Carter',
    appointmentDate: today,
    appointmentTime: '10:00',
    appointmentType: 'consultation',
    status: 'scheduled',
    tokenNumber: 101,
    symptoms: 'Fever, cough, and headache for 2 days',
    notes: 'Patient prefers morning, allergic to penicillin',
    demoData: true,
    demoBatch: 'usa-demo-appointments-v2'
  },
  {
    patientName: 'Camila Torres',
    patientPhone: '+1 (555) 010-1001',
    patientEmail: 'demo.patient.002@example.com',
    patientAge: '28',
    patientGender: 'Female',
    doctorName: 'Dr. Michael Johnson',
    appointmentDate: today,
    appointmentTime: '10:30',
    appointmentType: 'checkup',
    status: 'in_progress',
    tokenNumber: 102,
    symptoms: 'Routine checkup, blood pressure monitoring',
    notes: 'Follow up from last month',
    demoData: true,
    demoBatch: 'usa-demo-appointments-v2'
  },
  {
    patientName: 'Marcus Jefferson',
    patientPhone: '+1 (555) 010-1002',
    patientEmail: 'demo.patient.003@example.com',
    patientAge: '45',
    patientGender: 'Male',
    doctorName: 'Dr. Daniel Brooks',
    appointmentDate: today,
    appointmentTime: '11:00',
    appointmentType: 'consultation',
    status: 'completed',
    tokenNumber: 103,
    symptoms: 'Back pain and stiffness',
    notes: 'Recommended X-ray',
    demoData: true,
    demoBatch: 'usa-demo-appointments-v2'
  },
  {
    patientName: 'Lina Chen',
    patientPhone: '+1 (555) 010-1003',
    patientEmail: 'demo.patient.004@example.com',
    patientAge: '24',
    patientGender: 'Female',
    doctorName: 'Dr. Olivia Martinez',
    appointmentDate: tomorrow,
    appointmentTime: '09:00',
    appointmentType: 'consultation',
    status: 'scheduled',
    tokenNumber: 201,
    symptoms: 'Migraine and nausea',
    notes: 'First visit',
    demoData: true,
    demoBatch: 'usa-demo-appointments-v2'
  },
  {
    patientName: 'Nolan Yazzie',
    patientPhone: '+1 (555) 010-1004',
    patientEmail: 'demo.patient.005@example.com',
    patientAge: '55',
    patientGender: 'Male',
    doctorName: 'Dr. James Lee',
    appointmentDate: yesterday,
    appointmentTime: '14:00',
    appointmentType: 'followup',
    status: 'completed',
    tokenNumber: 55,
    symptoms: 'Diabetes management',
    notes: 'Sugar levels stable',
    demoData: true,
    demoBatch: 'usa-demo-appointments-v2'
  }
]

const legacyDemoAppointmentUpdates = [
  { oldPhone: '9876543210', appointment: appointmentsData[0] },
  { oldPhone: '9876543211', appointment: appointmentsData[1] },
  { oldPhone: '9876543212', appointment: appointmentsData[2] },
  { oldPhone: '9876543213', appointment: appointmentsData[3] },
  { oldPhone: '9876543214', appointment: appointmentsData[4] }
]

// 3. Static Invoices Data
export const invoicesData = [
  {
    invoiceNumber: `INV-${Date.now()}-001`,
    patientName: 'Amit Kumar',
    patientPhone: '9876543212',
    patientEmail: 'amit@example.com',
    patientAddress: '12 Health Ave, MediCity',
    invoiceDate: today,
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    items: [
      { description: 'Consultation Fee', quantity: 1, unitPrice: 500, amount: 500 },
      { description: 'X-Ray (Lumbar Spine)', quantity: 1, unitPrice: 800, amount: 800 }
    ],
    subtotal: 1300,
    taxRate: 18,
    taxAmount: 234,
    discount: 0,
    totalAmount: 1534,
    status: 'paid',
    paymentMethod: 'card',
    notes: 'Paid in full at reception'
  },
  {
    invoiceNumber: `INV-${Date.now()}-002`,
    patientName: 'Priya Patel',
    patientPhone: '9876543211',
    patientEmail: 'priya@example.com',
    patientAddress: '42 Wellness Rd, MediCity',
    invoiceDate: today,
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    items: [
      { description: 'General Checkup', quantity: 1, unitPrice: 300, amount: 300 },
      { description: 'Blood Pressure Monitor', quantity: 1, unitPrice: 0, amount: 0 }
    ],
    subtotal: 300,
    taxRate: 0,
    taxAmount: 0,
    discount: 0,
    totalAmount: 300,
    status: 'pending',
    paymentMethod: null,
    notes: 'Payment pending'
  }
]

// Function to seed the database
export const seedDatabase = async (currentUser) => {
  if (!currentUser?.uid) {
    const error = new Error('A signed-in staff user is required to seed the database.')
    console.error('Cannot seed database:', error.message)
    return { success: false, error }
  }

  const batch = writeBatch(db)
  let operationCount = 0

  console.log('🌱 Starting database seed...')

  // 1. Seed Medicines
  medicinesData.forEach(medicine => {
    const docRef = doc(collection(db, 'medicines'))
    batch.set(docRef, { ...medicine, createdAt: serverTimestamp() })
    operationCount++
  })

  // 3. Seed Invoices
  invoicesData.forEach(invoice => {
    const docRef = doc(collection(db, 'invoices'))
    batch.set(docRef, { ...invoice, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
    operationCount++
  })

  const demoPatients = demoPatientSeeds.map((patient, index) => buildDemoPatient(patient, index, currentUser.uid))
  const existingPatientsSnapshot = await getDocs(query(
    collection(db, 'patients'),
    where('demoBatch', '==', DEMO_PATIENT_BATCH)
  ))
  const existingPatientIds = new Set(existingPatientsSnapshot.docs.map(patient => patient.data().patientId))
  const patientsToCreate = demoPatients.filter(patient => !existingPatientIds.has(patient.patientId))

  patientsToCreate.forEach(patient => {
    batch.set(doc(collection(db, 'patients')), patient)
    operationCount++
  })

  const existingDemoAppointmentsSnapshot = await getDocs(query(
    collection(db, 'appointments'),
    where('demoBatch', '==', 'usa-demo-appointments-v2')
  ))
  if (existingDemoAppointmentsSnapshot.empty) {
    appointmentsData.forEach(appointment => {
      const docRef = doc(collection(db, 'appointments'))
      batch.set(docRef, { ...appointment, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
      operationCount++
    })
  }

  const legacyAppointmentPhones = legacyDemoAppointmentUpdates.map(item => item.oldPhone)
  const legacyAppointmentsSnapshot = await getDocs(query(
    collection(db, 'appointments'),
    where('patientPhone', 'in', legacyAppointmentPhones)
  ))
  const appointmentUpdates = new Map(legacyDemoAppointmentUpdates.map(item => [item.oldPhone, item.appointment]))
  legacyAppointmentsSnapshot.docs.forEach(appointmentDoc => {
    const existingAppointment = appointmentDoc.data()
    const replacement = appointmentUpdates.get(existingAppointment.patientPhone)
    if (!replacement) return

    batch.update(doc(db, 'appointments', appointmentDoc.id), {
      ...replacement,
      updatedAt: serverTimestamp(),
      demoData: true,
      demoBatch: 'usa-demo-appointments-v2'
    })
  })

  // Note: We are skipping Prescriptions because they usually require linking to specific Appointment/Patient IDs generated above.
  // In a real seed, we'd capture the IDs first. For simplicity, we just seed the independent collections.

  try {
    await batch.commit()
    console.log(`✅ Database seeded successfully with ${operationCount} documents!`)
    console.log(`✅ Demo patients created: ${patientsToCreate.length}; already present: ${existingPatientsSnapshot.size}`)
    console.log(`✅ Legacy demo appointments updated: ${legacyAppointmentsSnapshot.size}`)
    return {
      success: true,
      count: operationCount,
      patientsCreated: patientsToCreate.length,
      patientsExisting: existingPatientsSnapshot.size,
      appointmentsUpdated: legacyAppointmentsSnapshot.size
    }
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    return { success: false, error }
  }
}
