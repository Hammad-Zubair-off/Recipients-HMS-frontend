import { useState, useEffect } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import LogoutButton from '../../../components/LogoutButton'
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Eye,
  Phone,
  Mail,
  Calendar,
  ArrowLeft,
  User,
  Filter
} from 'lucide-react'
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../../../firebase/config'
import { getDateObject } from '../../../utils/firestoreUtils'

export default function PatientList() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [patients, setPatients] = useState([])
  const [filteredPatients, setFilteredPatients] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterGender, setFilterGender] = useState('all')
  const [loading, setLoading] = useState(false)

  // Fetch patients (normalize dates for display; sort client-side if createdAt is mixed string/Timestamp)
  useEffect(() => {
    console.log('[PatientList] patient loading started', {
      currentUserExists: Boolean(currentUser),
      currentUserUid: currentUser?.uid || null,
      collection: 'patients',
      orderBy: ['createdAt', 'desc']
    })

    if (!currentUser) {
      console.log('[PatientList] patient loading skipped: no currentUser')
      setLoading(false)
      return undefined
    }

    setLoading(true)
    const patientsRef = collection(db, 'patients')
    const q = query(patientsRef, orderBy('createdAt', 'desc'))
    console.log('[PatientList] executing Firestore query', {
      collection: 'patients',
      orderBy: ['createdAt', 'desc'],
      currentUserUid: currentUser.uid
    })

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('[PatientList] patient query succeeded', {
        returnedDocuments: snapshot.size
      })
      const patientsData = snapshot.docs.map(docSnap => {
        const d = { id: docSnap.id, ...docSnap.data() }
        return {
          ...d,
          createdAtDisplay: getDateObject(d.createdAt),
          dateOfBirthDisplay: getDateObject(d.dateOfBirth)
        }
      })
      setPatients(patientsData)
      setFilteredPatients(patientsData)
      setLoading(false)
    }, (error) => {
      console.error('[PatientList] patient query failed', {
        code: error.code,
        message: error.message,
        error
      })
      toast.error('Error loading patients')
      setLoading(false)
    })

    return () => unsubscribe()
  }, [currentUser])

  // Filter patients
  useEffect(() => {
    let filtered = patients

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(patient =>
        patient.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone?.includes(searchTerm) ||
        patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.patientId?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Gender filter
    if (filterGender !== 'all') {
      filtered = filtered.filter(patient => patient.gender === filterGender)
    }

    setFilteredPatients(filtered)
  }, [patients, searchTerm, filterGender])

  const handleDeletePatient = async (patientId, patientName) => {
    if (!window.confirm(`Are you sure you want to delete patient "${patientName}"? This action cannot be undone.`)) {
      return
    }

    try {
      await deleteDoc(doc(db, 'patients', patientId))
      toast.success('Patient deleted successfully')
    } catch (error) {
      console.error('Error deleting patient:', error)
      toast.error('Error deleting patient')
    }
  }

  const getAge = (patient) => {
    const birthDate = getDateObject(patient?.dateOfBirth) || (patient?.dateOfBirthDisplay ?? null)
    if (!birthDate || isNaN(birthDate.getTime())) return 'N/A'
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  return (
    <div className="dashboard-container patients-page">
      {/* Premium Navigation */}
      <header className="nav-bar">
        <div className="nav-bar-content">
          <div className="flex items-center gap-4">
            <div className="stat-card-icon stat-card-icon-primary">
              <Users className="icon-lg" />
            </div>
            <div>
              <h1 className="nav-bar-title">Patient Management</h1>
              <p className="text-sm text-slate-400">Manage patient records and profiles</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              to="/receptionist"
              className="btn-outline rounded-lg btn-md flex"
            >
              {/* <ArrowLeft className="icon-sm" /> */}
              <span>Back to Dashboard</span>
            </Link>
          <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="page-container">
        {/* Page Header */}
        <div className="page-header patients-page-header">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="page-title">All Patients</h1>
              <p className="page-description">View and manage patient records</p>
            </div>
            <Link
              to="/receptionist/patients/create"
              className="btn-primary rounded-lg btn-md flex items-center gap-2"
            >
              <Plus className="icon-sm" />
              <span>Register New Patient</span>
            </Link>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid-stats mb-6">
          <div className="stat-card patients-stat-card">
            <div className="stat-card-header">
              <div className="stat-card-icon stat-card-icon-primary">
                <Users className="icon-lg" />
              </div>
            </div>
            <p className="stat-card-title">Total Patients</p>
            <p className="stat-card-value">{patients.length}</p>
          </div>
          
          <div className="stat-card patients-stat-card">
            <div className="stat-card-header">
              <div className="stat-card-icon stat-card-icon-secondary">
                <User className="icon-lg" />
              </div>
            </div>
            <p className="stat-card-title">Active Patients</p>
            <p className="stat-card-value">{patients.filter(p => p.status === 'active').length}</p>
          </div>
          
          <div className="stat-card patients-stat-card">
            <div className="stat-card-header">
              <div className="stat-card-icon stat-card-icon-success">
                <Calendar className="icon-lg" />
              </div>
            </div>
            <p className="stat-card-title">This Month</p>
            <p className="stat-card-value">
              {patients.filter(p => {
                const created = p.createdAtDisplay || getDateObject(p.createdAt)
                if (!created || typeof created.getMonth !== 'function') return false
                const now = new Date()
                return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
              }).length}
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="card patients-filter-card mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1/2">
              <input
                type="text"
                placeholder="Search by name, phone, email, or patient ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input form-input "
              />
            </div>
            
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="form-input flex-1 rounded-lg"
            >
              <option value="all">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Patients Table */}
        <div className="table-container patients-table-container">
          <div className="table-wrapper">
            {loading ? (
              <div className="table-empty">
                <div className="spinner w-12 h-12 mx-auto mb-4"></div>
                <p className="table-empty-text">Loading patients...</p>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="table-empty">
                <div className="text-muted text-lg mb-2">No patients found</div>
                <div className="text-muted text-sm">
                  {searchTerm || filterGender !== 'all' 
                    ? 'Try adjusting your search or filters.' 
                    : 'Register your first patient to get started.'}
                </div>
                {!searchTerm && filterGender === 'all' && (
                  <Link
                    to="/receptionist/patients/create"
                    className="btn-primary btn-md mt-4 inline-flex items-center gap-2 rounded-lg"
                  >
                    <Plus className="icon-sm" />
                    <span>Register New Patient</span>
                  </Link>
                )}
              </div>
            ) : (
              <table className="table">
                <thead className="table-header">
                  <tr className="table-header-row">
                    <th className="table-header-cell">Patient ID</th>
                    <th className="table-header-cell">Name</th>
                    <th className="table-header-cell">Contact</th>
                    <th className="table-header-cell">Age / Gender</th>
                    <th className="table-header-cell">Date of Birth</th>
                    <th className="table-header-cell">Status</th>
                    <th className="table-header-cell">Actions</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {filteredPatients.map((patient) => (
                    <tr key={patient.id} className="table-row">
                      <td className="table-cell">
                        <span className="font-mono text-sm font-semibold text-primary-600">
                          {patient.patientId || patient.id.slice(0, 8).toUpperCase()}
                        </span>
                      </td>
                      
                      <td className="table-cell table-cell-header">
                        <div>
                          <div className="font-semibold">{patient.fullName}</div>
                          {patient.address && (
                            <div className="text-muted text-sm">{patient.address}</div>
                          )}
                        </div>
                      </td>
                      
                      <td className="table-cell">
                        <div className="space-y-1">
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
                        </div>
                      </td>
                      
                      <td className="table-cell">
                        <div>
                          <span className="font-medium">{getAge(patient)} years</span>
                          {patient.gender && (
                            <span className="text-muted"> • {patient.gender}</span>
                          )}
                        </div>
                      </td>
                      
                      <td className="table-cell">
                        {(() => {
                          const dob = patient.dateOfBirthDisplay || getDateObject(patient.dateOfBirth)
                          if (!dob || (typeof dob.toLocaleDateString !== 'function')) return <span className="text-muted">N/A</span>
                          return (
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="icon-sm text-muted" />
                              <span>{dob.toLocaleDateString()}</span>
                            </div>
                          )
                        })()}
                      </td>
                      
                      <td className="table-cell">
                        <span className={patient.status === 'active' ? 'inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-teal-500 text-white' : 'inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-orange-500 text-white'}>
                          {patient.status || 'active'}
                        </span>
                      </td>
                      
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/receptionist/patients/view/${patient.id}`}
                            className="btn-icon btn-ghost"
                            title="View Profile"
                          >
                            <Eye className="icon-sm" />
                          </Link>
                          <Link
                            to={`/receptionist/patients/edit/${patient.id}`}
                            className="btn-icon btn-ghost"
                            title="Edit Patient"
                          >
                            <Edit className="icon-sm" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
