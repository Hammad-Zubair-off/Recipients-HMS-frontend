import { useAuth } from '../../hooks/useAuth'
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import LogoutButton from '../../components/LogoutButton'
import EmailVerificationStatus from '../../components/EmailVerificationStatus'
import { Bell, CalendarCheck, Calendar, FileText, FileDown, Hash, DollarSign, UserCircle } from 'lucide-react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../../firebase/config'

export default function Receptionist() {
  const { currentUser, userRole } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [todayAppointments, setTodayAppointments] = useState(0)
  const [todayPrescriptions, setTodayPrescriptions] = useState(0)
  const [totalAppointments, setTotalAppointments] = useState(0)

  // Fetch real appointment data
  useEffect(() => {
    const appointmentsRef = collection(db, 'appointments')
    const q = query(appointmentsRef, orderBy('createdAt', 'desc'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const appointmentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setAppointments(appointmentsData)

      // Calculate today's appointments
      const today = new Date().toLocaleDateString('en-CA')
      const todayCount = appointmentsData.filter(apt => {
        let aptDateStr = ''
        if (apt.date && typeof apt.date.toDate === 'function') {
          aptDateStr = apt.date.toDate().toISOString().split('T')[0]
        } else if (apt.appointmentDate) {
          aptDateStr = apt.appointmentDate
        } else if (apt.date && typeof apt.date === 'string') {
          aptDateStr = apt.date.split('T')[0]
        }
        return aptDateStr === today
      }).length
      setTodayAppointments(todayCount)
      setTotalAppointments(appointmentsData.length)
    }, (error) => {
      console.error('Error fetching appointments:', error)
    })

    return () => unsubscribe()
  }, [])

  // Fetch prescription data
  useEffect(() => {
    const prescriptionsRef = collection(db, 'prescriptions')
    const q = query(prescriptionsRef, orderBy('createdAt', 'desc'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prescriptionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      // Calculate today's prescriptions
      const today = new Date().toLocaleDateString('en-CA')
      const todayCount = prescriptionsData.filter(pres => {
        let presDateStr = ''
        if (pres.date && typeof pres.date.toDate === 'function') {
          presDateStr = pres.date.toDate().toLocaleDateString('en-CA')
        } else if (pres.prescriptionDate) {
          presDateStr = pres.prescriptionDate
        } else if (pres.date && typeof pres.date === 'string') {
          presDateStr = pres.date.split('T')[0]
        }
        return presDateStr === today
      }).length
      setTodayPrescriptions(todayCount)
    }, (error) => {
      console.error('Error fetching prescriptions:', error)
    })

    return () => unsubscribe()
  }, [])

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
              <h1 className="nav-bar-title">Receptionist Dashboard</h1>
              <p className="text-sm text-slate-300">Welcome, {currentUser?.displayName || 'Receptionist'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="page-container">
        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">Overview</h1>
          <p className="page-description">Manage patient flow, appointments & billing</p>
        </div>

        {/* Premium Stat Cards */}
        <div className="grid-stats mb-8">

          <Link to="/receptionist/appointments" className="stat-card action-card">
            <div className="stat-card-header">
              <div className="stat-card-icon stat-card-icon-primary">
                <CalendarCheck className="icon-lg" />
              </div>
            </div>
            <p className="stat-card-title">Today's Appointments</p>
            <p className="stat-card-value">{todayAppointments}</p>
            <p className="text-muted text-sm mt-1">Scheduled today</p>
          </Link>

          <Link to="/receptionist/prescriptions" className="stat-card action-card">
            <div className="stat-card-header">
              <div className="stat-card-icon stat-card-icon-secondary">
                <FileText className="icon-lg" />
              </div>
            </div>
            <p className="stat-card-title">Today's Prescriptions</p>
            <p className="stat-card-value">{todayPrescriptions}</p>
            <p className="text-muted text-sm mt-1">Issued today</p>
          </Link>
          <Link to="/receptionist/billing" className="stat-card action-card">
            <div className="stat-card-header">
              <div className="stat-card-icon stat-card-icon-success">
                <DollarSign className="icon-lg" />
              </div>
            </div>
            <p className="stat-card-title">Billing & Payments</p>
            <p className="stat-card-value">{totalAppointments}</p>
            <p className="text-muted text-sm mt-1">Total invoices</p>
          </Link>

          <Link to="/receptionist/tokens" className="stat-card action-card">
            <div className="stat-card-header">
              <div className="stat-card-icon stat-card-icon-amber">
                <Hash className="icon-lg" />
              </div>
            </div>
            <p className="stat-card-title">Token Management</p>
            <p className="stat-card-value">{appointments.filter(apt => apt.tokenNumber).length}</p>
            <p className="text-muted text-sm mt-1">Tokens generated today</p>
          </Link>
        </div>

        {/* Quick Actions Section */}
        <div className="section-container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Quick Actions</h2>
              <p className="section-subtitle">Access frequently used features</p>
            </div>
          </div>

          <div className="grid-cards">
            <Link to="/receptionist/patients" className="card action-card p-3">
              <div className="flex items-start space-x-3">
                <div className="stat-card-icon stat-card-icon-primary shrink-0">
                  <UserCircle className="icon-lg" />
                </div>
                <div className="flex-1">
                  <h3 className="text-heading text-lg mb-1">Patient Management</h3>
                  <p className="text-muted text-sm leading-relaxed">Register and manage patients</p>
                </div>
              </div>
            </Link>
            <Link to="/receptionist/appointments" className="card action-card p-3">
              <div className="flex items-start space-x-3">
                <div className="stat-card-icon stat-card-icon-primary shrink-0">
                  <Calendar className="icon-lg" />
                </div>
                <div className="flex-1">
                  <h3 className="text-heading text-lg mb-1">Manage Appointments</h3>
                  <p className="text-muted text-sm leading-relaxed">View and manage appointments</p>
                </div>
              </div>
            </Link>

            <Link to="/receptionist/tokens" className="card action-card p-3">
              <div className="flex items-start space-x-3">
                <div className="stat-card-icon stat-card-icon-primary shrink-0">
                  <Hash className="icon-lg" />
                </div>
                <div className="flex-1">
                  <h3 className="text-heading text-lg mb-1">Token Management</h3>
                  <p className="text-muted text-sm leading-relaxed">Manage patient tokens</p>
                </div>
              </div>
            </Link>
            <Link to="/receptionist/prescriptions" className="card action-card p-3">
              <div className="flex items-start space-x-3">
                <div className="stat-card-icon stat-card-icon-secondary shrink-0">
                  <FileText className="icon-lg" />
                </div>
                <div className="flex-1">
                  <h3 className="text-heading text-lg mb-1">View Prescriptions</h3>
                  <p className="text-muted text-sm leading-relaxed">Manage patient prescriptions</p>
                </div>
              </div>
            </Link>



            <Link to="/receptionist/billing" className="card action-card p-3">
              <div className="flex items-start space-x-3">
                <div className="stat-card-icon stat-card-icon-success shrink-0">
                  <DollarSign className="icon-lg" />
                </div>
                <div className="flex-1">
                  <h3 className="text-heading text-lg mb-1">Billing & Payments</h3>
                  <p className="text-muted text-sm leading-relaxed">Manage invoices and payments</p>
                </div>
              </div>
            </Link>

            <Link to="/receptionist/billing/reports" className="card action-card p-3">
              <div className="flex items-start space-x-3">
                <div className="stat-card-icon stat-card-icon-secondary shrink-0">
                  <FileDown className="icon-lg" />
                </div>
                <div className="flex-1">
                  <h3 className="text-heading text-lg mb-1">Download Reports</h3>
                  <p className="text-muted text-sm leading-relaxed">Generate and download reports</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Account Information Card */}
        <div className="mt-8">
          <div className="card">
            <div className="section-header mb-4">
              <div>
                <h2 className="section-title">Account Information</h2>
                <p className="section-subtitle">Your profile and verification status</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-muted text-sm mb-1">Email</p>
                <p className="text-heading">{currentUser?.email}</p>
              </div>
              <div>
                <p className="text-muted text-sm mb-1">Role</p>
                <span className="inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-blue-600 text-white">{userRole}</span>
              </div>
              <div>
                <p className="text-muted text-sm mb-1">Full Name</p>
                <p className="text-heading">{currentUser?.displayName}</p>
              </div>
              <div>
                <p className="text-muted text-sm mb-1">Email Verified</p>
                <EmailVerificationStatus />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
