import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import LogoutButton from '../../../components/LogoutButton'
import {
  Hash,
  User,
  Calendar,
  Clock,
  Phone,
  Mail,
  CheckCircle,
  AlertCircle,
  Clock as ClockIcon,
  ArrowLeft,
  RefreshCw,
  Printer,
  Eye,
  Search,
  Filter
} from 'lucide-react'
import { collection, onSnapshot, query, updateDoc, doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { db } from '../../../firebase/config'
import { getDateString, getDateObject, getDisplayDate, getDisplayTime } from '../../../utils/firestoreUtils'

export default function TokenManagement() {
  const [appointments, setAppointments] = useState([])
  const [filteredAppointments, setFilteredAppointments] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'))
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!selectedDate) return

    setLoading(true)
    const appointmentsRef = collection(db, 'appointments')
    const q = query(appointmentsRef)

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const selectedNorm = (selectedDate || '').split('T')[0]
      const raw = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      const appointmentsData = raw
        .filter(apt => {
          const aptDateStr = getDateString(apt.date ?? apt.appointmentDate)
          return (aptDateStr || '').split('T')[0] === selectedNorm
        })
        .map(apt => ({
          ...apt,
          appointmentDate: getDateString(apt.date ?? apt.appointmentDate) || apt.appointmentDate || '',
          appointmentDateDisplay: getDisplayDate(apt.date ?? apt.appointmentDate) || apt.appointmentDate || '',
          appointmentTimeDisplay: getDisplayTime(apt.appointmentTime ?? apt.time) || apt.appointmentTime || ''
        }))

      const sortedAppointments = appointmentsData.sort((a, b) => {
        if (a.tokenNumber != null && b.tokenNumber != null) return a.tokenNumber - b.tokenNumber
        if (a.tokenNumber != null) return -1
        if (b.tokenNumber != null) return 1
        const dateA = getDateObject(a.createdAt) || new Date(0)
        const dateB = getDateObject(b.createdAt) || new Date(0)
        return (dateA?.getTime?.() || 0) - (dateB?.getTime?.() || 0)
      })

      setAppointments(sortedAppointments)
      setFilteredAppointments(sortedAppointments)
      setLoading(false)
    }, (error) => {
      console.error('Error fetching appointments:', error)
      toast.error('Error loading appointments')
      setLoading(false)
    })

    return () => unsubscribe()
  }, [selectedDate])

  useEffect(() => {
    let filtered = appointments
    const term = (searchTerm || '').toLowerCase().trim()

    if (term) {
      filtered = filtered.filter(appointment =>
        (appointment.patientName || '').toLowerCase().includes(term) ||
        (appointment.patientPhone || '').includes(searchTerm) ||
        (appointment.tokenNumber != null && String(appointment.tokenNumber).includes(searchTerm))
      )
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(appointment => (appointment.status || '') === filterStatus)
    }

    setFilteredAppointments(filtered)
  }, [appointments, searchTerm, filterStatus])

  // Concurrency-safe token assignment.
  //
  // Tokens are a per-day queue: the number restarts each calendar day. The next
  // number is kept in an atomic counter document `tokenCounters/{YYYY-MM-DD}`
  // and both the counter and the appointment are written inside a single
  // Firestore transaction. runTransaction retries automatically if either
  // document changed since it was read, so two receptionists (or two rapid
  // clicks) can never be handed the same number, and a page reload / re-login
  // never resets the sequence (it lives in Firestore, not React state).
  const generateToken = async (appointment) => {
    const appointmentId = appointment.id
    const dateKey =
      getDateString(appointment.date ?? appointment.appointmentDate) ||
      appointment.appointmentDate ||
      selectedDate

    if (!dateKey) {
      toast.error('Cannot generate token: this appointment has no date.')
      return
    }

    // Floor = the highest token already present in this day's loaded queue.
    // Guards the first run for a day whose appointments were tokenised before
    // this counter existed, so an existing number is never reused.
    const existingFloor = appointments.reduce(
      (max, apt) => (apt.tokenNumber != null && apt.tokenNumber > max ? apt.tokenNumber : max),
      0
    )

    try {
      const counterRef = doc(db, 'tokenCounters', dateKey)
      const appointmentRef = doc(db, 'appointments', appointmentId)

      const result = await runTransaction(db, async (transaction) => {
        const apptSnap = await transaction.get(appointmentRef)
        if (!apptSnap.exists()) {
          throw new Error('Appointment no longer exists')
        }
        // Never overwrite a token that has already been assigned.
        const current = apptSnap.data().tokenNumber
        if (current != null) {
          return { token: current, alreadyHad: true }
        }

        const counterSnap = await transaction.get(counterRef)
        const counterValue = counterSnap.exists() ? (counterSnap.data().current || 0) : 0
        const next = Math.max(counterValue, existingFloor) + 1

        transaction.set(
          counterRef,
          { current: next, dateKey, updatedAt: serverTimestamp() },
          { merge: true }
        )
        transaction.update(appointmentRef, {
          tokenNumber: next,
          tokenGeneratedAt: new Date().toISOString(),
          status: 'token_generated'
        })
        return { token: next, alreadyHad: false }
      })

      if (result.alreadyHad) {
        toast(`This appointment already has token ${result.token}.`)
      } else {
        toast.success(`Token ${result.token} generated successfully!`)
      }
    } catch (error) {
      console.error('Error generating token:', error)
      toast.error(`Error generating token: ${error.message || 'please try again'}`)
    }
  }

  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      const appointmentRef = doc(db, 'appointments', appointmentId)
      await updateDoc(appointmentRef, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      })

      toast.success(`Appointment status updated to ${newStatus}`)
    } catch (error) {
      console.error('Error updating appointment status:', error)
      toast.error('Error updating appointment status')
    }
  }

  const printToken = (appointment) => {
    const dateDisplay = appointment.appointmentDateDisplay ?? appointment.appointmentDate ?? ''
    const timeDisplay = appointment.appointmentTimeDisplay ?? appointment.appointmentTime ?? ''
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>Token ${appointment.tokenNumber ?? ''}</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
            .token { font-size: 48px; font-weight: bold; color: #06b6d4; margin: 20px 0; }
            .patient-info { margin: 20px 0; }
            .appointment-info { margin: 20px 0; color: #666; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <h1>Patient Token</h1>
          <div class="token">${appointment.tokenNumber ?? '-'}</div>
          <div class="patient-info">
            <h2>${(appointment.patientName || '').replace(/</g, '&lt;')}</h2>
            <p>Age: ${appointment.patientAge ?? 'N/A'} | Gender: ${appointment.patientGender ?? 'N/A'}</p>
            <p>Phone: ${(appointment.patientPhone || '').replace(/</g, '&lt;')}</p>
          </div>
          <div class="appointment-info">
            <p>Date: ${dateDisplay}</p>
            <p>Time: ${timeDisplay}</p>
            <p>Doctor: ${(appointment.doctorName || '').replace(/</g, '&lt;')}</p>
          </div>
          <p>Generated at: ${new Date().toLocaleString()}</p>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  const getStatusInfo = (status) => {
    switch (status) {
      case 'scheduled':
        return { badge: 'info', icon: ClockIcon }
      case 'token_generated':
        return { badge: 'warning', icon: CheckCircle }
      case 'in_progress':
        return { badge: 'info', icon: AlertCircle }
      case 'completed':
        return { badge: 'success', icon: CheckCircle }
      case 'cancelled':
        return { badge: 'error', icon: AlertCircle }
      default:
        return { badge: 'pending', icon: ClockIcon }
    }
  }

  const getTodayDisplay = () => {
    const today = new Date()
    return today.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="dashboard-container">
      {/* Premium Navigation Bar */}
      <header className="nav-bar">
        <div className="nav-bar-content">
          <div className="flex items-center space-x-4">

            <div className="stat-card-icon stat-card-icon-primary">
              <Hash className="icon-lg" />
            </div>
            <div>
              <h1 className="nav-bar-title">Token Management</h1>
              <p className="text-sm text-slate-300">Manage patient tokens for today's appointments</p>
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
          <h1 className="page-title">Token Management</h1>
          <p className="page-description">Generate and manage patient queue tokens</p>
        </div>

        {/* Stats Card */}
        <div className="grid-stats mb-6">
          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-card-icon stat-card-icon-primary">
                <Calendar className="icon-lg" />
              </div>
            </div>
            <p className="stat-card-title">Total Appointments</p>
            <p className="stat-card-value">{appointments.length}</p>
            <p className="text-muted text-sm mt-1">{getTodayDisplay()}</p>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-card-icon stat-card-icon-secondary">
                <Hash className="icon-lg" />
              </div>
            </div>
            <p className="stat-card-title">Tokens Generated</p>
            <p className="stat-card-value">
              {appointments.filter(apt => apt.tokenNumber).length}
            </p>
            <p className="text-muted text-sm mt-1">Active tokens</p>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-card-icon stat-card-icon-amber">
                <ClockIcon className="icon-lg" />
              </div>
            </div>
            <p className="stat-card-title">In Progress</p>
            <p className="stat-card-value">
              {appointments.filter(apt => apt.status === 'in_progress').length}
            </p>
            <p className="text-muted text-sm mt-1">Currently serving</p>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-card-icon stat-card-icon-success">
                <CheckCircle className="icon-lg" />
              </div>
            </div>
            <p className="stat-card-title">Completed</p>
            <p className="stat-card-value">
              {appointments.filter(apt => apt.status === 'completed').length}
            </p>
            <p className="text-muted text-sm mt-1">Finished today</p>
          </div>
        </div>

        {/* Controls */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 md:flex-[3]">
              <input
                type="text"
                placeholder="Search by patient name, phone, or token number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input form-input"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="form-input md:flex-1"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="token_generated">Token Generated</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="form-input md:flex-1"
            />
          </div>
        </div>

        {/* Appointments Table */}
        <div className="card">
          <div className="section-header mb-6">
            <div>
              <h2 className="section-title">Appointments Queue</h2>
              <p className="section-subtitle">Manage tokens and appointment status</p>
            </div>
          </div>

          {loading ? (
            <div className="table-empty">
              <div className="spinner w-12 h-12 mx-auto mb-4"></div>
              <p className="table-empty-text">Loading appointments...</p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="table-empty">
              <AlertCircle className="icon-xl text-muted mx-auto mb-4" />
              <p className="table-empty-text">
                {searchTerm || filterStatus !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'No appointments scheduled for the selected date.'}
              </p>
            </div>
          ) : (
            <div className="table-container">
              <div className="table-wrapper">
                <table className="table">
                  <thead className="table-header">
                    <tr className="table-header-row">
                      <th className="table-header-cell">Token</th>
                      <th className="table-header-cell">Patient</th>
                      <th className="table-header-cell">Contact</th>
                      <th className="table-header-cell">Appointment</th>
                      <th className="table-header-cell">Status</th>
                      <th className="table-header-cell">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {filteredAppointments.map((appointment) => {
                      const statusInfo = getStatusInfo(appointment.status)
                      const StatusIcon = statusInfo.icon

                      return (
                        <tr key={appointment.id} className="table-row">
                          <td className="table-cell">
                            {appointment.tokenNumber ? (
                              <div className="flex items-center gap-3">
                                <div className="stat-card-icon stat-card-icon-primary">
                                  <span className="text-xl font-bold text-white">
                                    {appointment.tokenNumber}
                                  </span>
                                </div>
                                <button
                                  onClick={() => printToken(appointment)}
                                  className="btn-icon btn-ghost"
                                  title="Print Token"
                                >
                                  <Printer className="icon-sm" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>

                          <td className="table-cell">
                            <div>
                              <p className="table-cell-header">{appointment.patientName || '—'}</p>
                              <p className="text-xs text-muted">
                                {appointment.patientAge ?? '—'} years, {appointment.patientGender ?? '—'}
                              </p>
                            </div>
                          </td>

                          <td className="table-cell">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="icon-sm text-muted" />
                                <span>{appointment.patientPhone ?? '—'}</span>
                              </div>
                              {(appointment.patientEmail != null && appointment.patientEmail !== '') && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Mail className="icon-sm text-muted" />
                                  <span className="text-muted text-xs">{appointment.patientEmail}</span>
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="table-cell">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="icon-sm text-muted" />
                                <span>{appointment.appointmentDateDisplay ?? appointment.appointmentDate ?? '—'}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="icon-sm text-muted" />
                                <span className="text-muted">{appointment.appointmentTimeDisplay ?? appointment.appointmentTime ?? '—'}</span>
                              </div>
                              <p className="text-sm text-muted">{appointment.doctorName ?? '—'}</p>
                            </div>
                          </td>

                          <td className="table-cell">
                            <span className={`badge-${statusInfo.badge} flex items-center gap-1 w-fit`}>
                              <StatusIcon className="icon-xs" />
                              {(appointment.status || 'scheduled').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </td>

                          <td className="table-cell">
                            <div className="flex items-center gap-2">
                              {!appointment.tokenNumber && (
                                <button
                                  onClick={() => generateToken(appointment)}
                                  className="btn-primary rounded-lg border btn-sm"
                                  title="Generate Token"
                                >
                                  Generate Token
                                </button>
                              )}

                              {appointment.tokenNumber && appointment.status === 'token_generated' && (
                                <button
                                  onClick={() => updateAppointmentStatus(appointment.id, 'in_progress')}
                                  className="btn-secondary rounded-lg border btn-sm"
                                  title="Mark In Progress"
                                >
                                  Start Consultation
                                </button>
                              )}

                              {appointment.status === 'in_progress' && (
                                <button
                                  onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                                  className="btn-success rounded-lg border btn-sm"
                                  title="Mark Completed"
                                >
                                  Complete
                                </button>
                              )}

                              <button
                                onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                                className="btn-danger rounded-lg border btn-sm"
                                title="Cancel Appointment"
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
