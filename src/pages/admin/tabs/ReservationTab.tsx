import { useState, useEffect, useCallback } from 'react'
import { Download, Loader2, Search } from 'lucide-react'
import StatusBadge from '../../../components/StatusBadge'
import api, { ApiError, BASE_URL } from '../../../lib/api'
import ReservationDetailModal from './ReservationDetailModal'

interface ReservationTabProps {
  theme: 'dark' | 'light'
  orgId?: string
}

interface Reservation {
  id: string
  guestFirstName: string
  guestLastName?: string
  guestEmail?: string
  guestPhone?: string
  reservationDate?: string
  table?: {
    tableNumber?: string
    name?: string
    area?: string
  } | null
  startTime: string
  endTime?: string
  partySize: number
  status: string
  source?: string
  specialRequests?: string
  internalNotes?: string
  confirmedAt?: string
  seatedAt?: string
  completedAt?: string
  cancelledAt?: string
  cancellationReason?: string
  createdAt?: string
}

// Mirror backend valid transitions for frontend UX
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['arriving', 'seated', 'cancelled', 'no_show'],
  arriving: ['seated', 'cancelled', 'no_show'],
  seated: ['completed'],
  completed: [],
  cancelled: [],
  no_show: [],
}

export default function ReservationTab({ theme, orgId }: ReservationTabProps) {
  const isDark = theme === 'dark'
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const today = new Date().toISOString().split('T')[0]
  const [dateFilter, setDateFilter] = useState(today)
  const [statusFilter, setStatusFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Detail modal
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)

  const fetchReservations = useCallback(async () => {
    if (!orgId) return
    setIsLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (dateFilter) params.set('date', dateFilter)
      if (statusFilter) params.set('status', statusFilter)
      if (searchTerm) params.set('search', searchTerm)
      const res = await api.get<{ reservations: Reservation[] }>(`/organizations/${orgId}/reservations?${params.toString()}`)
      // API may return { reservations: [...] } or directly [...]
      const data = res.data
      setReservations(Array.isArray(data) ? data : (data as any)?.reservations || [])
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load reservations.')
    } finally {
      setIsLoading(false)
    }
  }, [orgId, dateFilter, statusFilter, searchTerm])

  useEffect(() => {
    fetchReservations()
  }, [fetchReservations])

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/organizations/${orgId}/reservations/${id}/status`, { status: newStatus })
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r))
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to update status.')
    }
  }

  const handleExportCsv = async () => {
    if (!orgId) return
    try {
      const token = localStorage.getItem('trs_token')
      const response = await fetch(`${BASE_URL}/organizations/${orgId}/reservations/export`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reservations-${dateFilter || 'all'}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch { /* silent */ }
  }

  const formatTime = (t: string) => t?.slice(0, 5) || t
  const guestName = (r: Reservation) => [r.guestFirstName, r.guestLastName].filter(Boolean).join(' ') || 'Guest'

  const getValidNextStatuses = (currentStatus: string): string[] => {
    return VALID_TRANSITIONS[currentStatus] || []
  }

  const inputStyle: React.CSSProperties = {
    padding: '8px 12px',
    fontSize: '0.8125rem',
    borderRadius: '8px',
    border: `1px solid ${isDark ? '#30363d' : '#d1d5db'}`,
    backgroundColor: isDark ? '#161B22' : '#ffffff',
    color: isDark ? '#e6edf3' : '#1f2937',
  }

  return (
    <div>
      <ReservationDetailModal
        isOpen={!!selectedReservation}
        onClose={() => setSelectedReservation(null)}
        reservation={selectedReservation}
      />

      {/* Filter Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          style={{ ...inputStyle, minWidth: '150px' }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ ...inputStyle, cursor: 'pointer', minWidth: '140px' }}
        >
          <option value="">All Statuses</option>
          {['pending', 'confirmed', 'arriving', 'seated', 'completed', 'no_show', 'cancelled'].map(s => (
            <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
          ))}
        </select>
        <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: isDark ? '#8b949e' : '#9ca3af' }} />
          <input
            type="text"
            placeholder="Search guest name or email…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ ...inputStyle, width: '100%', paddingLeft: '32px' }}
          />
        </div>
        <button
          onClick={() => { setDateFilter(''); setStatusFilter(''); setSearchTerm('') }}
          style={{
            padding: '8px 14px', fontSize: '0.8125rem', borderRadius: '8px', cursor: 'pointer',
            border: `1px solid ${isDark ? '#30363d' : '#d1d5db'}`, backgroundColor: 'transparent',
            color: isDark ? '#8b949e' : '#6b7280',
          }}
        >
          Clear
        </button>
      </div>

      {/* Header */}
      <div className="res-admin-tab-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: isDark ? '#ffffff' : '#1f2937' }}>
          Reservations {dateFilter ? `— ${dateFilter}` : ''}
        </h3>
        <button onClick={handleExportCsv} style={{
          display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', fontWeight: 600,
          padding: '8px 16px', backgroundColor: '#C99C63', color: '#101A1C', border: 'none', borderRadius: '6px', cursor: 'pointer'
        }}>
          <Download size={16} /> Export CSV
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
          <Loader2 size={28} style={{ color: '#C99C63', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : error ? (
        <div style={{ color: '#ef4444', textAlign: 'center', padding: '24px', fontSize: '0.875rem' }}>{error}</div>
      ) : reservations.length === 0 ? (
        <p style={{ color: isDark ? '#8b949e' : '#6b7280', textAlign: 'center', padding: '32px 0' }}>No reservations found for these filters.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${isDark ? '#30363d' : '#e5e7eb'}` }}>
                {['Guest', 'Table', 'Time', 'Party Size', 'Status', ''].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '16px', fontWeight: 500, color: isDark ? '#8b949e' : '#6b7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reservations.map((res) => {
                const nextStatuses = getValidNextStatuses(res.status)
                return (
                  <tr key={res.id}
                    style={{ borderBottom: `1px solid ${isDark ? '#30363d' : '#e5e7eb'}`, transition: 'background-color 0.2s', cursor: 'pointer' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = isDark ? '#161B22' : '#f9fafb'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    onClick={() => setSelectedReservation(res)}
                  >
                    <td style={{ padding: '16px', fontWeight: 600, color: isDark ? '#ffffff' : '#1f2937' }}>{guestName(res)}</td>
                    <td style={{ padding: '16px', color: isDark ? '#8b949e' : '#6b7280' }}>{res.table?.name || res.table?.tableNumber || '—'}</td>
                    <td style={{ padding: '16px', color: isDark ? '#8b949e' : '#6b7280' }}>{formatTime(res.startTime)}</td>
                    <td style={{ padding: '16px', color: isDark ? '#8b949e' : '#6b7280' }}>{res.partySize}</td>
                    <td style={{ padding: '16px' }}><StatusBadge status={res.status as any} /></td>
                    <td style={{ padding: '16px' }} onClick={(e) => e.stopPropagation()}>
                      {nextStatuses.length > 0 ? (
                        <select
                          value={res.status}
                          onChange={(e) => handleStatusChange(res.id, e.target.value)}
                          style={{
                            padding: '4px 8px', fontSize: '0.75rem', borderRadius: '6px', cursor: 'pointer',
                            backgroundColor: isDark ? '#161B22' : '#f3f4f6', border: `1px solid ${isDark ? '#30363d' : '#d1d5db'}`,
                            color: isDark ? '#e6edf3' : '#374151',
                          }}
                        >
                          <option value={res.status}>{res.status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                          {nextStatuses.map(s => (
                            <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                          ))}
                        </select>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: isDark ? '#484f58' : '#9ca3af', fontStyle: 'italic' }}>Final</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

