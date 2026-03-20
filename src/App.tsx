import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import CustomerSignUp from './pages/CustomerSignUp'
import CustomerLogin from './pages/CustomerLogin'
import ForgotPassword from './pages/ForgotPassword'
import CustomerDashboard from './pages/CustomerDashboard'
import ReservationWizard from './pages/reservation/ReservationWizard'
import BookingConfirmed from './pages/reservation/BookingConfirmed'
import AdminDashboard from './pages/admin/AdminDashboard'
import SetupWizard from './pages/setup/SetupWizard'
import StaffLogin from './pages/StaffLogin'
import StaffTableManagement from './pages/staff/StaffTableManagement'
import LoggedInTabRes from './pages/LoggedInTabRes'
import Welcome from './pages/Welcome'
import PremiumReservation from './pages/PremiumReservation'
import PremiumBookingConfirmed from './pages/reservation/PremiumBookingConfirmed'
import UserReservationWizard from './pages/user-reservation/UserReservationWizard'
import UserBookingConfirmed from './pages/user-reservation/UserBookingConfirmed'
import BookATableWizard from './pages/public-reservation/BookATableWizard'
import PublicBookingConfirmed from './pages/public-reservation/PublicBookingConfirmed'

function App() {
  return (
    <Routes>
      {/* ─── Public Routes ─────────────────────────── */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/customer-signup" element={<CustomerSignUp />} />
      <Route path="/customer-login" element={<CustomerLogin />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/staff-login" element={<StaffLogin />} />
      <Route path="/book-a-table" element={<BookATableWizard />} />
      <Route path="/book-a-table/:slug" element={<BookATableWizard />} />
      <Route path="/public-booking-confirmed" element={<PublicBookingConfirmed />} />

      {/* ─── Protected Routes (Auth Required) ──────── */}
      <Route path="/welcome" element={<ProtectedRoute><Welcome /></ProtectedRoute>} />
      <Route path="/customer-dashboard" element={<ProtectedRoute><CustomerDashboard /></ProtectedRoute>} />
      <Route path="/setup" element={<ProtectedRoute><SetupWizard /></ProtectedRoute>} />
      <Route path="/reserve" element={<ProtectedRoute><ReservationWizard /></ProtectedRoute>} />
      <Route path="/booking-confirmed" element={<ProtectedRoute><BookingConfirmed /></ProtectedRoute>} />
      <Route path="/premium-reserve" element={<ProtectedRoute><PremiumReservation /></ProtectedRoute>} />
      <Route path="/premium-booking-confirmed" element={<ProtectedRoute><PremiumBookingConfirmed /></ProtectedRoute>} />
      <Route path="/user-reserve" element={<ProtectedRoute><UserReservationWizard /></ProtectedRoute>} />
      <Route path="/user-booking-confirmed" element={<ProtectedRoute><UserBookingConfirmed /></ProtectedRoute>} />
      <Route path="/logged-in-tab-res" element={<ProtectedRoute><LoggedInTabRes /></ProtectedRoute>} />

      {/* ─── Admin/Staff Routes (Role-Protected) ───── */}
      <Route path="/admin" element={<ProtectedRoute requiredRoles={['admin', 'manager']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/staff/tables" element={<ProtectedRoute requiredRoles={['admin', 'manager', 'host']}><StaffTableManagement /></ProtectedRoute>} />
    </Routes>
  )
}

export default App
