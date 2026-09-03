import { useState, useEffect } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import { Link, useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import LogoutButton from '../../../components/LogoutButton'
import { 
  User, 
  ArrowLeft, 
  Edit,
  Phone,
  Mail,
  Calendar,
  MapPin,
  FileText,
  Pill,
  Receipt,
  Clock,
  AlertCircle,
  Heart,
  Activity
} from 'lucide-react'
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../../../firebase/config'
import { getDisplayDate, getDisplayTime } from '../../../utils/firestoreUtils'

export default function ViewPatient() {
  const { currentUser } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()
  const [patient, setPatient] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  // Fetch patient data
  useEffect(() => {
    if (!id) return

    const fetchPatientData = async () => {
      setLoading(true)
      try {
        const patientRef = doc(db, 'patients', id)
        const patientSnap = await getDoc(patientRef)
        
        if (patientSnap.exists()) {
          setPatient({ id: patientSnap.id, ...patientSnap.data() })
        } else {
          toast.error('Patient not found')
          navigate('/receptionist/patients')
        }
      } catch (error) {
        console.error('Error fetching patient:', error)
        toast.error('Error loading patient data')
        navigate('/receptionist/patients')
      } finally {
        setLoading(false)
      }
    }

    fetchPatientData()
  }, [id, navigate])

  // Fetch patient appointments
  useEffect(() => {
    if (!patient) return

    const appointmentsRef = collection(db, 'appointments')
    const q = query(
      appointmentsRef,
      where('patientPhone', '==', patient.phone)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const appointmentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setAppointments(appointmentsData)
    }, (error) => {
      console.error('Error fetching appointments:', error)
    })

    return () => unsubscribe()
  }, [patient])

  // Fetch patient prescriptions
  useEffect(() => {
    if (!patient) return

    const prescriptionsRef = collection(db, 'prescriptions')
    const q = query(
      prescriptionsRef,
      where('patientPhone', '==', patient.phone)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prescriptionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setPrescriptions(prescriptionsData)
    }, (error) => {
      console.error('Error fetching prescriptions:', error)
    })

    return () => unsubscribe()
  }, [patient])

  // Fetch patient invoices
  useEffect(() => {
    if (!patient) return

    const invoicesRef = collection(db, 'invoices')
    const q = query(
      invoicesRef,
      where('patientPhone', '==', patient.phone)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const invoicesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setInvoices(invoicesData)
    }, (error) => {
      console.error('Error fetching invoices:', error)
    })

    return () => unsubscribe()
  }, [patient])

  const getAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A'
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      'active': 'badge-success',
      'scheduled': 'badge-info',
      'completed': 'badge-success',
      'cancelled': 'badge-error',
      'paid': 'badge-success',
      'pending': 'badge-warning',
      'overdue': 'badge-error'
    }
    return statusMap[status] || 'badge-pending'
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="spinner w-12 h-12 mx-auto mb-4"></div>
            <p className="text-muted">Loading patient profile...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!patient) {
    return null
  }

  return (
    <div className="dashboard-container">
      {/* Premium Navigation */}
      <header className="nav-bar">
        <div className="nav-bar-content">
          <div className="flex items-center gap-4">
            <div className="stat-card-icon stat-card-icon-primary">
              <User className="icon-lg" />
            </div>
            <div>
              <h1 className="nav-bar-title">{patient.fullName}</h1>
              <p className="text-sm text-slate-400">Patient Profile & History</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link 
              to="/receptionist/patients"
              className="btn-outline rounded-lg btn-md flex items-center gap-2"
            >
              <span>Back to Patients</span>
            </Link>
            <Link
              to={`/receptionist/patients/edit/${patient.id}`}
              className="btn-outline rounded-lg btn-md flex items-center gap-2"
            >
              <Edit className="icon-sm" />
              <span>Edit</span>
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="page-container">
        {/* Patient Overview Card */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h2 className="text-heading text-2xl mb-2">{patient.fullName}</h2>
              <p className="text-muted mb-4">Patient ID: {patient.patientId || patient.id.slice(0, 8).toUpperCase()}</p>
              
              <div className="space-y-2">
                {patient.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="icon-sm text-muted" />
                    <span>{patient.phone}</span>
                  </div>
                )}
                {patient.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="icon-sm text-muted" />
                    <span className="text-muted">{patient.email}</span>
                  </div>
                )}
                {patient.address && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="icon-sm text-muted" />
                    <span className="text-muted">{patient.address}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-heading text-lg mb-3">Personal Details</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted">Age: </span>
                  <span className="font-medium">{getAge(patient.dateOfBirth)} years</span>
                </div>
                {patient.gender && (
                  <div>
                    <span className="text-muted">Gender: </span>
                    <span className="font-medium">{patient.gender}</span>
                  </div>
                )}
                {patient.dateOfBirth && (
                  <div>
                    <span className="text-muted">Date of Birth: </span>
                    <span className="font-medium">{new Date(patient.dateOfBirth).toLocaleDateString()}</span>
                  </div>
                )}
                {patient.bloodGroup && (
                  <div>
                    <span className="text-muted">Blood Group: </span>
                    <span className="font-medium">{patient.bloodGroup}</span>
                  </div>
                )}
                <div>
                  <span className="text-muted">Status: </span>
                  <span className={patient.status === 'active' ? 'inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-teal-500 text-white' : 'inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-orange-500 text-white'}>
                    {patient.status || 'active'}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-heading text-lg mb-3">Medical Summary</h3>
              <div className="space-y-2 text-sm">
                {patient.allergies && (
                  <div>
                    <span className="text-muted">Allergies: </span>
                    <span className="font-medium text-error">{patient.allergies}</span>
                  </div>
                )}
                {patient.medicalHistory && (
                  <div>
                    <span className="text-muted">Medical History: </span>
                    <span className="font-medium">{patient.medicalHistory.substring(0, 50)}...</span>
                  </div>
                )}
                {patient.emergencyContactName && (
                  <div>
                    <span className="text-muted">Emergency Contact: </span>
                    <span className="font-medium">{patient.emergencyContactName} ({patient.emergencyContactRelation})</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid-stats mb-6">
          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-card-icon stat-card-icon-primary">
                <Calendar className="icon-lg" />
              </div>
            </div>
            <p className="stat-card-title">Total Appointments</p>
            <p className="stat-card-value">{appointments.length}</p>
          </div>
          
          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-card-icon stat-card-icon-secondary">
                <Pill className="icon-lg" />
              </div>
            </div>
            <p className="stat-card-title">Prescriptions</p>
            <p className="stat-card-value">{prescriptions.length}</p>
          </div>
          
          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-card-icon stat-card-icon-success">
                <Receipt className="icon-lg" />
              </div>
            </div>
            <p className="stat-card-title">Invoices</p>
            <p className="stat-card-value">{invoices.length}</p>
          </div>
          
          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-card-icon stat-card-icon-amber">
                <Activity className="icon-lg" />
              </div>
            </div>
            <p className="stat-card-title">Total Visits</p>
            <p className="stat-card-value">{appointments.filter(a => a.status === 'completed').length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="card mb-6">
          <div className="flex gap-2 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'overview' 
                  ? 'text-primary-600 border-b-2 border-primary-600' 
                  : 'text-muted hover:text-heading'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('appointments')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'appointments' 
                  ? 'text-primary-600 border-b-2 border-primary-600' 
                  : 'text-muted hover:text-heading'
              }`}
            >
              Appointments ({appointments.length})
            </button>
            <button
              onClick={() => setActiveTab('prescriptions')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'prescriptions' 
                  ? 'text-primary-600 border-b-2 border-primary-600' 
                  : 'text-muted hover:text-heading'
              }`}
            >
              Prescriptions ({prescriptions.length})
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'billing' 
                  ? 'text-primary-600 border-b-2 border-primary-600' 
                  : 'text-muted hover:text-heading'
              }`}
            >
              Billing ({invoices.length})
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Medical Information */}
            {patient.allergies || patient.medicalHistory || patient.medications ? (
              <div className="card">
                <h3 className="text-heading text-lg mb-4 flex items-center gap-2">
                  <FileText className="icon-md text-primary-500" />
                  <span>Medical Information</span>
                </h3>
                <div className="space-y-4">
                  {patient.allergies && (
                    <div>
                      <label className="form-label">Allergies</label>
                      <p className="text-body">{patient.allergies}</p>
                    </div>
                  )}
                  {patient.medicalHistory && (
                    <div>
                      <label className="form-label">Medical History</label>
                      <p className="text-body">{patient.medicalHistory}</p>
                    </div>
                  )}
                  {patient.medications && (
                    <div>
                      <label className="form-label">Current Medications</label>
                      <p className="text-body">{patient.medications}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Emergency Contact */}
            {patient.emergencyContactName && (
              <div className="card">
                <h3 className="text-heading text-lg mb-4 flex items-center gap-2">
                  <AlertCircle className="icon-md text-accent-amber-500" />
                  <span>Emergency Contact</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="form-label">Name</label>
                    <p className="text-body">{patient.emergencyContactName}</p>
                  </div>
                  <div>
                    <label className="form-label">Phone</label>
                    <p className="text-body">{patient.emergencyContactPhone}</p>
                  </div>
                  <div>
                    <label className="form-label">Relation</label>
                    <p className="text-body">{patient.emergencyContactRelation}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Insurance */}
            {patient.insuranceProvider && (
              <div className="card">
                <h3 className="text-heading text-lg mb-4">Insurance Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Provider</label>
                    <p className="text-body">{patient.insuranceProvider}</p>
                  </div>
                  <div>
                    <label className="form-label">Policy Number</label>
                    <p className="text-body">{patient.insurancePolicyNumber}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="table-container">
            <div className="table-wrapper">
              {appointments.length === 0 ? (
                <div className="table-empty">
                  <div className="text-muted text-lg mb-2">No appointments found</div>
                </div>
              ) : (
                <table className="table">
                  <thead className="table-header">
                    <tr className="table-header-row">
                      <th className="table-header-cell">Date</th>
                      <th className="table-header-cell">Time</th>
                      <th className="table-header-cell">Doctor</th>
                      <th className="table-header-cell">Type</th>
                      <th className="table-header-cell">Status</th>
                      <th className="table-header-cell">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {appointments.map((appointment) => (
                      <tr key={appointment.id} className="table-row">
                        <td className="table-cell">{getDisplayDate(appointment.date ?? appointment.appointmentDate) || appointment.appointmentDate || '—'}</td>
                        <td className="table-cell">{getDisplayTime(appointment.appointmentTime ?? appointment.time) || appointment.appointmentTime || '—'}</td>
                        <td className="table-cell">{appointment.doctorName ?? '—'}</td>
                        <td className="table-cell">{appointment.appointmentType}</td>
                        <td className="table-cell">
                          <span className={`badge ${getStatusBadge(appointment.status)}`}>
                            {appointment.status}
                          </span>
                        </td>
                        <td className="table-cell">
                          <Link
                            to={`/receptionist/appointments`}
                            className="btn-outline-primary btn-sm"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'prescriptions' && (
          <div className="table-container">
            <div className="table-wrapper">
              {prescriptions.length === 0 ? (
                <div className="table-empty">
                  <div className="text-muted text-lg mb-2">No prescriptions found</div>
                </div>
              ) : (
                <table className="table">
                  <thead className="table-header">
                    <tr className="table-header-row">
                      <th className="table-header-cell">Date</th>
                      <th className="table-header-cell">Doctor</th>
                      <th className="table-header-cell">Diagnosis</th>
                      <th className="table-header-cell">Medicines</th>
                      <th className="table-header-cell">Status</th>
                      <th className="table-header-cell">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {prescriptions.map((prescription) => (
                      <tr key={prescription.id} className="table-row">
                        <td className="table-cell">{prescription.prescriptionDate}</td>
                        <td className="table-cell">{prescription.doctorName}</td>
                        <td className="table-cell">{prescription.diagnosis?.substring(0, 50)}...</td>
                        <td className="table-cell">{prescription.medicines?.length || 0} medicines</td>
                        <td className="table-cell">
                          <span className={`badge ${getStatusBadge(prescription.status)}`}>
                            {prescription.status}
                          </span>
                        </td>
                        <td className="table-cell">
                          <Link
                            to={`/receptionist/prescriptions/view/${prescription.id}`}
                            className="btn-outline-primary btn-sm"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="table-container">
            <div className="table-wrapper">
              {invoices.length === 0 ? (
                <div className="table-empty">
                  <div className="text-muted text-lg mb-2">No invoices found</div>
                </div>
              ) : (
                <table className="table">
                  <thead className="table-header">
                    <tr className="table-header-row">
                      <th className="table-header-cell">Invoice #</th>
                      <th className="table-header-cell">Date</th>
                      <th className="table-header-cell">Amount</th>
                      <th className="table-header-cell">Status</th>
                      <th className="table-header-cell">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="table-row">
                        <td className="table-cell">{invoice.invoiceNumber}</td>
                        <td className="table-cell">{invoice.invoiceDate}</td>
                        <td className="table-cell">${invoice.totalAmount?.toFixed(2)}</td>
                        <td className="table-cell">
                          <span className={`badge ${getStatusBadge(invoice.paymentStatus)}`}>
                            {invoice.paymentStatus}
                          </span>
                        </td>
                        <td className="table-cell">
                          <Link
                            to={`/receptionist/billing/invoices/${invoice.id}`}
                            className="btn-outline-primary btn-sm"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
