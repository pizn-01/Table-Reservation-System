import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, Users, MapPin, X, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api, { ApiError } from '../lib/api'

interface Reservation {
  id: string
  reservation_date: string
  start_time: string
  party_size: number
  table_number?: string
  table_name?: string
  area_name?: string
  status: string
  guest_first_name?: string
  guest_last_name?: string
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
        setHistory(historyRes.data || [])
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
      return d.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    } catch { return dateStr }
  }

  const formatTime = (timeStr: string) => timeStr?.slice(0, 5) || timeStr

  const reservations = activeTab === 'upcoming' ? upcoming : history

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <div className="bg-dark-card border-b border-dark-border px-8 py-8 res-cust-header">
        <div className="max-w-5xl mx-auto">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
              </h1>
              <p className="text-dark-text-secondary text-sm">Manage your dining reservations</p>
            </div>
            <button
              onClick={logout}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #30363d',
                backgroundColor: 'transparent',
                color: '#8b949e',
                fontSize: '0.8125rem',
                cursor: 'pointer',
              }}
            >
              Logout
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mt-6 max-w-md res-cust-stats-grid">
            <div className="bg-dark-bg-secondary border border-dark-border rounded-xl p-4">
              <p className="text-dark-text-secondary text-xs">Upcoming</p>
              <p className="text-2xl font-bold text-white mt-1">{upcoming.length}</p>
            </div>
            <div className="bg-dark-bg-secondary border border-dark-border rounded-xl p-4">
              <p className="text-dark-text-secondary text-xs">Past Visits</p>
              <p className="text-2xl font-bold text-white mt-1">{history.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-8 res-cust-content">
        {/* CTA Card */}
        <div className="bg-green-subtle border border-green-primary/30 rounded-2xl p-6 mb-8 flex items-center justify-between res-cust-cta">
          <div>
            <h2 className="text-lg font-semibold text-white">Ready For Your Next Visit?</h2>
            <p className="text-sm text-dark-text-secondary mt-1">Reserve your favorite table in just a few clicks</p>
          </div>
          <button
            onClick={() => navigate('/book-a-table')}
            className="btn-gold shrink-0"
          >
            Book A Table
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-dark-border mb-6 res-cust-tabs">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`pb-3 text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'upcoming'
                ? 'text-green-light border-b-2 border-green-light'
                : 'text-dark-text-secondary hover:text-white'
            }`}
          >
            Upcoming Reservation
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'history'
                ? 'text-green-light border-b-2 border-green-light'
                : 'text-dark-text-secondary hover:text-white'
            }`}
          >
            Visit History
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
            <Loader2 size={32} style={{ color: '#C99C63', animation: 'spin 1s linear infinite' }} />
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '16px',
            color: '#ef4444',
            fontSize: '0.875rem',
            textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && reservations.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#8b949e' }}>
            <p style={{ fontSize: '1rem' }}>
              {activeTab === 'upcoming' ? 'No upcoming reservations.' : 'No visit history yet.'}
            </p>
            {activeTab === 'upcoming' && (
              <button
                onClick={() => navigate('/book-a-table')}
                style={{
                  marginTop: '16px',
                  padding: '10px 24px',
                  backgroundColor: '#C99C63',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Make a Reservation
              </button>
            )}
          </div>
        )}

        {/* Reservation Cards */}
        {!isLoading && !error && (
          <div className="space-y-4 animate-fade-in">
            {reservations.map((res) => (
              <div
                key={res.id}
                className="bg-dark-card border border-dark-border rounded-xl p-6"
              >
                <div className="flex items-start justify-between res-cust-res-card-inner">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-white">
                      <Calendar size={14} className="text-gold" />
                      {formatDate(res.reservation_date)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-dark-text-secondary res-cust-res-meta">
                      <span className="flex items-center gap-1.5">
                        <Clock size={13} />
                        {formatTime(res.start_time)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users size={13} />
                        {res.party_size} Guests
                      </span>
                      {(res.table_number || res.table_name) && (
                        <span className="flex items-center gap-1.5">
                          <MapPin size={13} />
                          {res.table_name || `Table ${res.table_number}`}{res.area_name ? ` - ${res.area_name}` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 res-cust-res-actions">
                    <span className={`badge ${
                      res.status === 'confirmed' ? 'badge-confirmed' :
                      res.status === 'completed' ? 'badge-available' :
                      res.status === 'cancelled' ? 'badge-cancelled' : 'badge-pending'
                    }`}>
                      {res.status.charAt(0).toUpperCase() + res.status.slice(1)}
                    </span>
                    {activeTab === 'upcoming' && res.status !== 'cancelled' && (
                      <button
                        onClick={() => handleCancel(res.id)}
                        className="text-dark-text-secondary hover:text-red-400 transition-colors cursor-pointer"
                        title="Cancel reservation"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
