import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, Users, MapPin, Loader2, Settings, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api, { ApiError } from '../lib/api'

// ─── Custom Table Icon ───────────────────────────────
const CustomTableIcon = () => (
  <svg width="24" height="15" viewBox="0 0 30 19" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0.417699 18.0133C0.187364 18.0133 0 17.8269 0 17.5968V0.416586C0 0.186409 0.18768 0 0.417699 0C0.649613 0 0.835713 0.186094 0.835713 0.416586V17.5964C0.836029 17.8269 0.649613 18.0133 0.417699 18.0133Z" fill="#8b949e"/>
    <path d="M9.39158 12.1691H0.417699C0.187364 12.1691 0 11.983 0 11.7525V9.00709C0 8.77691 0.18768 8.59082 0.417699 8.59082H9.39127C9.62318 8.59082 9.80897 8.77691 9.80897 9.00709V11.7522C9.80928 11.983 9.6235 12.1691 9.39158 12.1691ZM0.836029 11.3359H8.9742V9.42336H0.836029V11.3359Z" fill="#8b949e"/>
    <path d="M9.39199 18.0141C9.16166 18.0141 8.97461 17.8277 8.97461 17.5975V10.3792C8.97461 10.1493 9.16197 9.96289 9.39199 9.96289C9.62391 9.96289 9.80969 10.1493 9.80969 10.3792V17.5972C9.80969 17.8277 9.62391 18.0141 9.39199 18.0141Z" fill="#8b949e"/>
    <path d="M29.5816 18.0133C29.3516 18.0133 29.1639 17.8269 29.1639 17.5968V0.416586C29.1639 0.186409 29.3519 0 29.5816 0C29.8139 0 29.9997 0.186094 29.9997 0.416586V17.5964C29.9997 17.8269 29.8142 18.0133 29.5816 18.0133Z" fill="#8b949e"/>
    <path d="M29.5817 12.1691H20.6081C20.3781 12.1691 20.1904 11.983 20.1904 11.7525V9.00709C20.1904 8.77691 20.3784 8.59082 20.6081 8.59082H29.5817C29.8139 8.59082 29.9997 8.77691 29.9997 9.00709V11.7522C29.9997 11.983 29.8142 12.1691 29.5817 12.1691ZM21.0258 11.3359H29.164V9.42336H21.0258V11.3359Z" fill="#8b949e"/>
    <path d="M20.6081 18.0141C20.3781 18.0141 20.1904 17.8277 20.1904 17.5975V10.3792C20.1904 10.1493 20.3784 9.96289 20.6081 9.96289C20.8404 9.96289 21.0258 10.1493 21.0258 10.3792V17.5972C21.0258 17.8277 20.8404 18.0141 20.6081 18.0141Z" fill="#8b949e"/>
    <path d="M22.8243 7.16753H7.002C6.7704 7.16753 6.58398 6.98144 6.58398 6.75095V4.691C6.58398 4.46082 6.7704 4.27441 7.002 4.27441H22.824C23.054 4.27441 23.2417 4.46082 23.2417 4.691V6.75095C23.242 6.98112 23.054 7.16753 22.8243 7.16753ZM7.42001 6.33436H22.406V5.10759H7.42001V6.33436Z" fill="#8b949e"/>
    <path d="M14.9125 17.5811H14.91C14.6796 17.5795 14.4939 17.3919 14.4951 17.162C14.5166 13.2059 14.5375 7.18377 14.5018 6.81285L14.9128 6.75081L15.2101 6.45703C15.3801 6.6277 15.3896 6.6384 15.3308 17.1667C15.3293 17.3966 15.1416 17.5811 14.9125 17.5811Z" fill="#8b949e"/>
    <path d="M18.16 17.5803H11.6661C11.4338 17.5803 11.248 17.394 11.248 17.164C11.248 16.9343 11.4338 16.748 11.6661 16.748H18.16C18.3903 16.748 18.5774 16.9343 18.5774 17.164C18.5774 17.3943 18.3903 17.5803 18.16 17.5803Z" fill="#8b949e"/>
    <path d="M1.13651 6.95836C0.509643 6.95836 0 6.45045 0 5.82573V2.57208C0 1.94735 0.509327 1.43945 1.13651 1.43945C1.76305 1.43945 2.27238 1.94704 2.27238 2.57208V5.82573C2.27238 6.45045 1.76305 6.95836 1.13651 6.95836ZM1.13651 2.27263C0.971576 2.27263 0.836029 2.40708 0.836029 2.57208V5.82573C0.836029 5.99073 0.971576 6.12518 1.13651 6.12518C1.30302 6.12518 1.43667 5.99073 1.43667 5.82573V2.57208C1.43667 2.40708 1.30302 2.27263 1.13651 2.27263Z" fill="#8b949e"/>
    <path d="M28.8634 6.95836C28.2366 6.95836 27.7275 6.45045 27.7275 5.82573V2.57208C27.7275 1.94735 28.2362 1.43945 28.8634 1.43945C29.4906 1.43945 29.9999 1.94704 29.9999 2.57208V5.82573C29.9996 6.45045 29.4903 6.95836 28.8634 6.95836ZM28.8634 2.27263C28.6988 2.27263 28.5636 2.40708 28.5636 2.57208V5.82573C28.5636 5.99073 28.6988 6.12518 28.8634 6.12518C29.0299 6.12518 29.1639 5.99073 29.1639 5.82573V2.57208C29.1639 2.40708 29.0299 2.27263 28.8634 2.27263Z" fill="#8b949e"/>
  </svg>
)

interface Reservation {
  id: string
  reservationDate: string
  startTime: string
  partySize: number
  table?: {
    tableNumber?: string
    name?: string
  } | null
  status: string
}

export default function CustomerDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming')
  const [upcoming, setUpcoming] = useState<Reservation[]>([])
  const [history, setHistory] = useState<Reservation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [upcomingRes, historyRes] = await Promise.all([
          api.get<Reservation[]>('/customers/me/reservations/upcoming'),
          api.get<Reservation[]>('/customers/me/reservations/history'),
        ])
        setUpcoming(upcomingRes.data || [])
        setHistory(historyRes.data || (historyRes as any).reservations || [])
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message)
        } else {
          setError('Failed to load reservations.')
        }
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleCancel = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) return
    try {
      await api.post(`/customers/me/reservations/${id}/cancel`)
      setUpcoming((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to cancel reservation.')
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      // Format as YYYY-MM-DD
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    } catch { return dateStr }
  }

  const formatTime = (timeStr: string) => timeStr?.slice(0, 5) || timeStr

  const reservations = activeTab === 'upcoming' ? upcoming : history

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0B1517', fontFamily: 'var(--font-sans)', color: '#ffffff' }}>
      
      {/* ─── Top Nav ────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '32px 48px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>Logo</h1>
        <div style={{ display: 'flex', gap: '24px', color: '#e5e7eb' }}>
          <button style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}>
            <Settings size={20} />
          </button>
          <button onClick={logout} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}>
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* ─── Main Content ───────────────────────────────────── */}
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 24px 64px' }}>
        
        {/* Header Greeting */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 8px 0', color: '#ffffff' }}>
            Welcome back{user?.name ? `,${user.name.split(' ')[0]}` : ''}
          </h2>
          <p style={{ margin: 0, color: '#e5e7eb', fontSize: '0.9375rem' }}>
            Manage your reservations and book your next visit
          </p>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
          {/* Upcoming Card */}
          <div style={{ flex: 1, backgroundColor: '#101A1C', borderRadius: '16px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: '0 0 8px 0', fontSize: '0.875rem', color: '#ffffff' }}>Upcoming</p>
              <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>{upcoming.length}</p>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#1a2628', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={20} color="#8b949e" />
            </div>
          </div>
          {/* Past Visits Card */}
          <div style={{ flex: 1, backgroundColor: '#101A1C', borderRadius: '16px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: '0 0 8px 0', fontSize: '0.875rem', color: '#ffffff' }}>Past Visits</p>
              <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>{history.length}</p>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#1a2628', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CustomTableIcon />
            </div>
          </div>
        </div>

        {/* CTA Banner */}
        <div style={{ backgroundColor: '#101A1C', borderRadius: '16px', padding: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 600 }}>Ready For Your Next Visit?</h3>
            <p style={{ margin: 0, color: '#e5e7eb', fontSize: '0.875rem' }}>Your preferences are saved - booking takes seconds.</p>
          </div>
          <button 
            onClick={() => navigate('/user-reserve')}
            style={{ backgroundColor: '#D8A25E', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '12px 24px', fontWeight: 600, fontSize: '0.9375rem', cursor: 'pointer', transition: 'opacity 0.2s' }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
          >
            Book A Table
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '32px', borderBottom: '1px solid #30363d', marginBottom: '24px' }}>
          <button
            onClick={() => setActiveTab('upcoming')}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'upcoming' ? '2px solid #6B9E78' : '2px solid transparent',
              color: activeTab === 'upcoming' ? '#6B9E78' : '#8b949e',
              fontSize: '0.875rem',
              fontWeight: 500,
              padding: '0 0 12px 0',
              cursor: 'pointer',
              transition: 'all 0.2s',
              outline: 'none',
            }}
          >
            Upcoming Reservation
          </button>
          <button
            onClick={() => setActiveTab('history')}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'history' ? '2px solid #6B9E78' : '2px solid transparent',
              color: activeTab === 'history' ? '#6B9E78' : '#8b949e',
              fontSize: '0.875rem',
              fontWeight: 500,
              padding: '0 0 12px 0',
              cursor: 'pointer',
              transition: 'all 0.2s',
              outline: 'none',
            }}
          >
            Visit History
          </button>
        </div>

        {/* Loading / Error / Empty States */}
        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
            <Loader2 size={32} style={{ color: '#D8A25E', animation: 'spin 1s linear infinite' }} />
          </div>
        )}

        {error && !isLoading && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '16px', color: '#ef4444', fontSize: '0.875rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {!isLoading && !error && reservations.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#8b949e' }}>
            <p style={{ fontSize: '1rem', margin: '0 0 16px 0' }}>
              {activeTab === 'upcoming' ? 'No upcoming reservations.' : 'No visit history yet.'}
            </p>
            {activeTab === 'upcoming' && (
              <button
                onClick={() => navigate('/user-reserve')}
                style={{ padding: '10px 24px', backgroundColor: '#D8A25E', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
              >
                Make a Reservation
              </button>
            )}
          </div>
        )}

        {/* Reservation Cards List */}
        {!isLoading && !error && reservations.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {reservations.map((res) => (
              <div
                key={res.id}
                style={{
                  backgroundColor: '#101A1C',
                  border: '1px solid #30363d',
                  borderRadius: '12px',
                  padding: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                  {/* Left Circle Icon */}
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#1a2628', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CustomTableIcon />
                  </div>
                  
                  {/* Info Box */}
                  <div>
                    {/* Top Row: Title + Status */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#ffffff' }}>
                        {res.table?.name || res.table?.tableNumber ? `Table ${res.table.tableNumber || res.table.name}` : 'Table Pending'}
                      </h4>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        padding: '2px 8px', 
                        borderRadius: '4px', 
                        fontWeight: 600,
                        backgroundColor: res.status === 'confirmed' ? 'rgba(94, 234, 122, 0.1)' : 
                                       res.status === 'cancelled' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(201, 156, 99, 0.1)',
                        color: res.status === 'confirmed' ? '#5EEA7A' : 
                               res.status === 'cancelled' ? '#ef4444' : '#C99C63'
                      }}>
                        {res.status.charAt(0).toUpperCase() + res.status.slice(1)}
                      </span>
                    </div>
                    
                    {/* Bottom Row: Metadata */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', color: '#e5e7eb', fontSize: '0.8125rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Users size={14} color="#8b949e" />
                        Capacity: {res.partySize} seats
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={14} color="#8b949e" />
                        By the window
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} color="#8b949e" />
                        {formatDate(res.reservationDate)}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} color="#8b949e" />
                        {formatTime(res.startTime)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cancel Button */}
                {activeTab === 'upcoming' && res.status !== 'cancelled' && (
                  <button
                    onClick={() => handleCancel(res.id)}
                    style={{
                      padding: '8px 24px',
                      backgroundColor: 'transparent',
                      color: '#ffffff',
                      border: '1px solid #30363d',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = '#8b949e'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = '#30363d'
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
