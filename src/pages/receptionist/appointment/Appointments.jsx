import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import LogoutButton from '../../../components/LogoutButton'
import { 
  Bell, 
  Plus, 
  Edit, 
  Calendar, 
  X, 
  Search,
  Filter,
  UserCheck,
  Phone,
  Mail,
  Clock,
  Check,
  AlertTriangle,
  ArrowLeft,
  User,
  UserPlus
} from 'lucide-react'
import { collection, addDoc, updateDoc, doc, onSnapshot, query, orderBy, where, getDocs } from 'firebase/firestore'
import { db } from '../../../firebase/config'

export default function Appointments() {
  const { currentUser } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [doctors, setDoctors] = useState([])
  const [patients, setPatients] = useState([])
  const [filteredPatients, setFilteredPatients] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPatientModal, setShowPatientModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [patientSearchTerm, setPatientSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [loading, setLoading] = useState(false)
  const patientDropdownRef = useRef(null)

  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    patientPhone: '',
    patientEmail: '',
    patientAge: '',
    patientGender: '',
    doctorName: '',
    doctorId: '',
    appointmentDate: '',
    appointmentTime: '',
    appointmentType: 'consultation',
    notes: '',
    status: 'scheduled',
    symptoms: '',
    medicalHistory: '',
    medications: '',
    vitalSigns: {
      bloodPressure: '',
      heartRate: '',
      temperature: '',
      weight: ''
    }
  })

  useEffect(() => {
    console.log('[ReceptionistAppointments] data loading started', {
      currentUserExists: Boolean(currentUser),
      currentUserUid: currentUser?.uid || null
    })

    if (!currentUser) {
      console.log('[ReceptionistAppointments] data loading skipped: no currentUser')
      return undefined
    }

    const appointmentsRef = collection(db, 'appointments')
    const q = query(appointmentsRef, orderBy('createdAt', 'desc'))
    
    const unsubscribeAppointments = onSnapshot(q, (snapshot) => {
      const appointmentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setAppointments(appointmentsData)
    }, (error) => {
      console.error('Error fetching appointments:', error)
    })

    const doctorsRef = collection(db, 'staffData')
    const doctorsQuery = query(doctorsRef, where('role', '==', 'doctor'))
    
    const unsubscribeDoctors = onSnapshot(doctorsQuery, (snapshot) => {
      const doctorsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setDoctors(doctorsData)
    }, (error) => {
      console.error('Error fetching doctors:', error)
    })

    // Fetch patients
    const patientsRef = collection(db, 'patients')
    const patientsQuery = query(patientsRef, orderBy('createdAt', 'desc'))
    console.log('[ReceptionistAppointments] executing patient query', {
      collection: 'patients',
      orderBy: ['createdAt', 'desc'],
      currentUserUid: currentUser.uid
    })
    
    const unsubscribePatients = onSnapshot(patientsQuery, (snapshot) => {
      console.log('[ReceptionistAppointments] patient query succeeded', {
        returnedDocuments: snapshot.size
      })
      const patientsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setPatients(patientsData)
      setFilteredPatients(patientsData)
    }, (error) => {
      console.error('[ReceptionistAppointments] patient query failed', {
        code: error.code,
        message: error.message,
        error
      })
    })

    return () => {
      unsubscribeAppointments()
      unsubscribeDoctors()
      unsubscribePatients()
    }
  }, [currentUser])

  // Filter patients based on search
  useEffect(() => {
    if (patientSearchTerm) {
      const filtered = patients.filter(patient =>
        patient.fullName?.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
        patient.phone?.includes(patientSearchTerm) ||
        patient.email?.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
        patient.patientId?.toLowerCase().includes(patientSearchTerm.toLowerCase())
      )
      setFilteredPatients(filtered)
    } else {
      setFilteredPatients(patients)
    }
  }, [patientSearchTerm, patients])

  // Handle click outside patient modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (patientDropdownRef.current && !patientDropdownRef.current.contains(event.target)) {
        setShowPatientModal(false)
        setPatientSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient)
    setFormData(prev => ({
      ...prev,
      patientId: patient.id,
      patientName: patient.fullName || patient.name || '',
      patientPhone: patient.phone || '',
      patientEmail: patient.email || '',
      patientAge: patient.dateOfBirth ? (() => {
        const today = new Date()
        const birthDate = new Date(patient.dateOfBirth)
        let age = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--
        }
        return age.toString()
      })() : (patient.age || ''),
      patientGender: patient.gender || '',
      symptoms: patient.medicalHistory || prev.symptoms,
      medicalHistory: patient.medicalHistory || prev.medicalHistory,
      medications: patient.medications || prev.medications
    }))
    setShowPatientModal(false)
    setPatientSearchTerm('')
    toast.success(`Patient ${patient.fullName || patient.name} selected`)
  }

  const handleCreateAppointment = () => {
    setFormData({
      patientName: '',
      patientPhone: '',
      patientEmail: '',
      patientAge: '',
      patientGender: '',
      doctorName: '',
      doctorId: '',
      appointmentDate: getMinDate(),
      appointmentTime: '',
      appointmentType: 'consultation',
      notes: '',
      status: 'scheduled',
      symptoms: '',
      medicalHistory: '',
      medications: '',
      vitalSigns: {
        bloodPressure: '',
        heartRate: '',
        temperature: '',
        weight: ''
      }
    })
    setSelectedPatient(null)
    setShowCreateModal(true)
  }

  const handleEditAppointment = (appointment) => {
    setSelectedAppointment(appointment)
    setFormData({
      patientId: appointment.patientId || '',
      patientName: appointment.patientName || '',
      patientPhone: appointment.patientPhone || '',
      patientEmail: appointment.patientEmail || '',
      patientAge: appointment.patientAge || '',
      patientGender: appointment.patientGender || '',
      doctorName: appointment.doctorName || '',
      doctorId: appointment.doctorId || '',
      appointmentDate: appointment.appointmentDate || '',
      appointmentTime: appointment.appointmentTime || '',
      appointmentType: appointment.appointmentType || 'consultation',
      notes: appointment.notes || '',
      status: appointment.status || 'scheduled',
      symptoms: appointment.symptoms || '',
      medicalHistory: appointment.medicalHistory || '',
      medications: appointment.medications || '',
      vitalSigns: appointment.vitalSigns || {
        bloodPressure: '',
        heartRate: '',
        temperature: '',
        weight: ''
      }
    })
    setShowEditModal(true)
  }

  const validateForm = () => {
    if (!formData.patientName.trim()) {
      toast.error('Please enter patient name')
      return false
    }
    if (!formData.patientPhone.trim()) {
      toast.error('Please enter patient phone')
      return false
    }
    if (!formData.patientEmail.trim()) {
      toast.error('Please enter patient email')
      return false
    }
    if (!formData.doctorId) {
      toast.error('Please select a doctor')
      return false
    }
    if (!formData.appointmentDate) {
      toast.error('Please select appointment date')
      return false
    }
    if (!formData.appointmentTime) {
      toast.error('Please select appointment time')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setLoading(true)
    
    try {
      if (showEditModal) {
        const appointmentRef = doc(db, 'appointments', selectedAppointment.id)
        await updateDoc(appointmentRef, {
          ...formData,
          updatedAt: new Date().toISOString()
        })
        toast.success('Appointment updated successfully!')
        setShowEditModal(false)
      } else {
        const appointmentData = {
          ...formData,
          createdAt: new Date().toISOString(),
          createdBy: currentUser?.uid || 'receptionist',
          status: 'scheduled'
        }
        
        await addDoc(collection(db, 'appointments'), appointmentData)
        toast.success('Appointment created successfully!')
        setShowCreateModal(false)
      }
    } catch (error) {
      console.error('Error saving appointment:', error)
      toast.error(`Error saving appointment: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelAppointment = async (appointmentId) => {
    try {
      const appointmentRef = doc(db, 'appointments', appointmentId)
      await updateDoc(appointmentRef, {
        status: 'cancelled',
        updatedAt: new Date().toISOString()
      })
      toast.success('Appointment cancelled successfully!')
    } catch (error) {
      console.error('Error cancelling appointment:', error)
      toast.error(`Error cancelling appointment: ${error.message}`)
    }
  }

  const handleRescheduleAppointment = (appointmentId) => {
    const appointment = appointments.find(apt => apt.id === appointmentId)
    handleEditAppointment(appointment)
    toast.success('Appointment opened for rescheduling!')
  }

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.doctorName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || appointment.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 11; hour <= 18; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`
      const displayTime = hour <= 12 ? `${hour}:00 AM` : `${hour - 12}:00 PM`
      slots.push({ value: time, label: displayTime })
    }
    return slots
  }

  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  const getMaxDate = () => {
    const maxDate = new Date()
    maxDate.setDate(maxDate.getDate() + 7)
    return maxDate.toISOString().split('T')[0]
  }

  return (
    <div className="dashboard-container">
      {/* Premium Navigation Bar */}
      <header className="nav-bar">
        <div className="nav-bar-content">
          <div className="flex items-center space-x-4">
            
            <div className="stat-card-icon stat-card-icon-secondary">
              <Bell className="icon-lg" />
            </div>
            <div>
              <h1 className="nav-bar-title">Appointment Management</h1>
              <p className="text-sm text-slate-300">Welcome, {currentUser?.displayName || 'Receptionist'}</p>
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
        <div className="page-header">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="page-title">Appointment Management</h1>
              <p className="page-description">Schedule and manage patient appointments</p>
            </div>
            <button
              onClick={handleCreateAppointment}
              className="btn-primary rounded-lg btn-md flex items-center gap-2"
            >
              <Plus className="icon-sm" />
              <span>New Appointment</span>
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 md:flex-[2]">
              <input
                type="text"
                placeholder="Search appointments by patient or doctor name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input  form-input"
              />
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className=" flex-1 rounded-lg form-input"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rescheduled">Rescheduled</option>
            </select>
          </div>
        </div>

        {/* Appointments Table */}
        <div className="card">
          <div className="section-header mb-6">
            <div>
              <h2 className="section-title">Appointments ({filteredAppointments.length})</h2>
              <p className="section-subtitle">All scheduled appointments</p>
            </div>
          </div>
          
          {filteredAppointments.length === 0 ? (
            <div className="table-empty">
              <Calendar className="icon-xl text-muted mx-auto mb-4" />
              <p className="table-empty-text">No appointments found</p>
            </div>
          ) : (
            <div className="table-container">
              <div className="table-wrapper">
                <table className="table">
                  <thead className="table-header">
                    <tr className="table-header-row">
                      <th className="table-header-cell">Patient</th>
                      <th className="table-header-cell">Doctor</th>
                      <th className="table-header-cell">Date & Time</th>
                      <th className="table-header-cell">Type</th>
                      <th className="table-header-cell">Status</th>
                      <th className="table-header-cell text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {filteredAppointments.map((appointment) => (
                      <tr key={appointment.id} className="table-row">
                        <td className="table-cell">
                          <div>
                            <p className="table-cell-header">{appointment.patientName}</p>
                            <p className="text-xs text-muted">{appointment.patientPhone}</p>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center gap-2">
                            <UserCheck className="icon-sm text-muted" />
                            <span>{appointment.doctorName}</span>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div>
                            <p className="table-cell-header">
                              {new Date(appointment.appointmentDate).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-muted flex items-center gap-1">
                              <Clock className="icon-xs" />
                              {appointment.appointmentTime}
                            </p>
                          </div>
                        </td>
                        <td className="table-cell">
                          <span className="badge-pending">{appointment.appointmentType || 'Consultation'}</span>
                        </td>
                        <td className="table-cell">
                          <span className={`badge-${
                            appointment.status === 'scheduled' ? 'info' :
                            appointment.status === 'completed' ? 'success' :
                            appointment.status === 'cancelled' ? 'error' : 'warning'
                          }`}>
                            {appointment.status?.charAt(0).toUpperCase() + appointment.status?.slice(1)}
                          </span>
                        </td>
                        <td className="table-cell text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEditAppointment(appointment)}
                              className="btn-icon btn-ghost"
                              title="Edit"
                            >
                              <Edit className="icon-sm" />
                            </button>
                            {appointment.status === 'scheduled' && (
                              <>
                                <button
                                  onClick={() => handleRescheduleAppointment(appointment.id)}
                                  className="btn-icon btn-ghost"
                                  title="Reschedule"
                                >
                                  <Calendar className="icon-sm" />
                                </button>
                                <button
                                  onClick={() => handleCancelAppointment(appointment.id)}
                                  className="btn-icon btn-danger"
                                  title="Cancel"
                                >
                                  <X className="icon-sm" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="modal-overlay" onClick={() => {
          setShowCreateModal(false)
          setShowEditModal(false)
        }}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {showCreateModal ? 'Create New Appointment' : 'Edit Appointment'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setShowEditModal(false)
                }}
                className="btn-icon btn-ghost"
              >
                <X className="icon-md" />
              </button>
            </div>
            
            <div className="modal-body">
              <form onSubmit={handleSubmit} className="form-container">
                {/* Patient Selection */}
                <div className="card mb-4 bg-primary-50 border-primary-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-heading text-sm font-semibold flex items-center gap-2">
                      <User className="icon-sm text-primary-600" />
                      <span>Patient Selection</span>
                    </h3>
                    <Link
                      to="/receptionist/patients/create"
                      target="_blank"
                      className="btn-outline-primary rounded-lg btn-sm flex items-center gap-2"
                    >
                      <UserPlus className="icon-sm" />
                      <span >Register New Patient</span>
                    </Link>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Select Registered Patient (Optional)</label>
                    <div className="flex gap-2">
                      <div className="flex-1 relative" ref={patientDropdownRef}>
                        <input
                          type="text"
                          placeholder="Search for registered patient..."
                          value={selectedPatient ? selectedPatient.fullName : patientSearchTerm}
                          onChange={(e) => {
                            setPatientSearchTerm(e.target.value)
                            if (selectedPatient) setSelectedPatient(null)
                          }}
                          onFocus={() => setShowPatientModal(true)}
                          className="search-input form-input "
                        />
                        {selectedPatient && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPatient(null)
                              setFormData(prev => ({
                                ...prev,
                                patientName: '',
                                patientPhone: '',
                                patientEmail: '',
                                patientAge: '',
                                patientGender: ''
                              }))
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 btn-icon btn-ghost"
                          >
                            <X className="icon-sm" />
                          </button>
                        )}
                        {showPatientModal && (
                          <div className="absolute z-50 w-full mt-2 max-h-60 overflow-y-auto card border-2 border-primary-200 shadow-xl">
                            {filteredPatients.length > 0 ? (
                              filteredPatients.map((patient) => (
                                <button
                                  key={patient.id}
                                  type="button"
                                  onClick={() => handlePatientSelect(patient)}
                                  className="w-full  px-4 py-3 text-left hover:bg-primary-50 border-b border-slate-100 last:border-b-0 transition-colors"
                                >
                                  <div className="font-medium text-heading">{patient.fullName}</div>
                                  <div className="text-sm text-muted">
                                    {patient.phone} • {patient.patientId || patient.id.slice(0, 8).toUpperCase()}
                                  </div>
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-3 text-muted text-center">
                                {patientSearchTerm ? 'No patients found.' : 'No registered patients.'}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="form-help">Or enter patient details manually below</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label form-label-required">Patient Name</label>
                    <input
                      type="text"
                      value={formData.patientName}
                      onChange={(e) => setFormData({...formData, patientName: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label form-label-required">Patient Phone</label>
                    <input
                      type="tel"
                      value={formData.patientPhone}
                      onChange={(e) => setFormData({...formData, patientPhone: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label form-label-required">Patient Email</label>
                    <input
                      type="email"
                      value={formData.patientEmail}
                      onChange={(e) => setFormData({...formData, patientEmail: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Patient Age</label>
                    <input
                      type="number"
                      min="0"
                      max="150"
                      value={formData.patientAge}
                      onChange={(e) => setFormData({...formData, patientAge: e.target.value})}
                      className="form-input"
                      placeholder="Enter age"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Patient Gender</label>
                    <select
                      value={formData.patientGender}
                      onChange={(e) => setFormData({...formData, patientGender: e.target.value})}
                      className="form-input"
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label form-label-required">Doctor Name</label>
                    <select
                      value={formData.doctorId}
                      onChange={(e) => {
                        const selectedDoctor = doctors.find(d => d.id === e.target.value)
                        setFormData({
                          ...formData,
                          doctorId: e.target.value,
                          doctorName: selectedDoctor ? (selectedDoctor.fullName || selectedDoctor.displayName || selectedDoctor.name) : ''
                        })
                      }}
                      className="form-input"
                      required
                    >
                      <option value="">
                        {doctors.length === 0 ? 'No doctors available' : 'Select a doctor'}
                      </option>
                      {doctors.map((doctor) => (
                        <option key={doctor.id} value={doctor.id}>
                          Dr. {doctor.fullName || doctor.name}
                          {doctor.specialization && ` (${doctor.specialization})`}
                        </option>
                      ))}
                    </select>
                    {doctors.length === 0 && (
                      <p className="form-error text-xs mt-1 ">
                        No doctors found. Please add doctors to the staffData collection with role: 'doctor'
                      </p>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label form-label-required">Appointment Date</label>
                    <input
                      type="date"
                      value={formData.appointmentDate}
                      onChange={(e) => setFormData({...formData, appointmentDate: e.target.value})}
                      min={getMinDate()}
                      max={getMaxDate()}
                      className="form-input"
                      required
                    />
                    <p className="form-help">
                      Available: {getMinDate()} to {getMaxDate()}
                    </p>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label form-label-required">Appointment Time</label>
                    <select
                      value={formData.appointmentTime}
                      onChange={(e) => setFormData({...formData, appointmentTime: e.target.value})}
                      className="form-input"
                      required
                    >
                      <option value="">Select time</option>
                      {generateTimeSlots().map((slot) => (
                        <option key={slot.value} value={slot.value}>
                          {slot.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Appointment Type</label>
                    <select
                      value={formData.appointmentType}
                      onChange={(e) => setFormData({...formData, appointmentType: e.target.value})}
                      className="form-input"
                    >
                      <option value="consultation">Consultation</option>
                      <option value="checkup">Checkup</option>
                      <option value="emergency">Emergency</option>
                      <option value="followup">Follow-up</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="form-input"
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="rescheduled">Rescheduled</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows="3"
                    className="form-textarea form-input"
                    placeholder="Additional notes..."
                  />
                </div>
                
                {/* Medical Information Section */}
                <div className="divider my-6"></div>
                <div className="section-header mb-4">
                  <div>
                    <h3 className="section-title text-lg">Medical Information</h3>
                    <p className="section-subtitle">Optional patient medical details</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="form-group">
                    <label className="form-label">Symptoms</label>
                    <textarea
                      value={formData.symptoms}
                      onChange={(e) => setFormData({...formData, symptoms: e.target.value})}
                      rows="2"
                      className="form-textarea form-input"
                      placeholder="Current symptoms..."
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Medical History</label>
                    <textarea
                      value={formData.medicalHistory}
                      onChange={(e) => setFormData({...formData, medicalHistory: e.target.value})}
                      rows="2"
                      className="form-textarea form-input"
                      placeholder="Past medical conditions..."
                    />
                  </div>
                </div>
                
                <div className="form-group mb-4">
                  <label className="form-label">Current Medications</label>
                  <textarea
                    value={formData.medications}
                    onChange={(e) => setFormData({...formData, medications: e.target.value})}
                    rows="2"
                    className="form-textarea form-input"
                    placeholder="Current medications and dosages..."
                  />
                </div>
                
                {/* Vital Signs */}
                <div className="form-group">
                  <label className="form-label">Vital Signs</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="form-label text-xs">Blood Pressure</label>
                      <input
                        type="text"
                        value={formData.vitalSigns.bloodPressure}
                        onChange={(e) => setFormData({
                          ...formData, 
                          vitalSigns: {...formData.vitalSigns, bloodPressure: e.target.value}
                        })}
                        className="form-input text-sm"
                        placeholder="e.g., 120/80"
                      />
                    </div>
                    <div>
                      <label className="form-label text-xs">Heart Rate</label>
                      <input
                        type="text"
                        value={formData.vitalSigns.heartRate}
                        onChange={(e) => setFormData({
                          ...formData, 
                          vitalSigns: {...formData.vitalSigns, heartRate: e.target.value}
                        })}
                        className="form-input text-sm"
                        placeholder="e.g., 72 bpm"
                      />
                    </div>
                    <div>
                      <label className="form-label text-xs">Temperature</label>
                      <input
                        type="text"
                        value={formData.vitalSigns.temperature}
                        onChange={(e) => setFormData({
                          ...formData, 
                          vitalSigns: {...formData.vitalSigns, temperature: e.target.value}
                        })}
                        className="form-input text-sm"
                        placeholder="e.g., 98.6°F"
                      />
                    </div>
                    <div>
                      <label className="form-label text-xs">Weight</label>
                      <input
                        type="text"
                        value={formData.vitalSigns.weight}
                        onChange={(e) => setFormData({
                          ...formData, 
                          vitalSigns: {...formData.vitalSigns, weight: e.target.value}
                        })}
                        className="form-input text-sm"
                        placeholder="e.g., 180 lbs"
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false)
                  setShowEditModal(false)
                }}
                className="btn-outline rounded-lg btn-md"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary rounded-lg btn-md"
              >
                {loading ? (
                  <div className="flex items-center rounded-lg gap-2">
                    <div className="spinner w-4 h-4"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  showCreateModal ? 'Create Appointment' : 'Update Appointment'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
