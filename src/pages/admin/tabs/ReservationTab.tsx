import { useState, useEffect } from 'react'
import { Download, Loader2 } from 'lucide-react'
import StatusBadge from '../../../components/StatusBadge'
import api, { ApiError } from '../../../lib/api'

interface ReservationTabProps {
  theme: 'dark' | 'light'
  orgId?: string
}

interface Reservation {
  id: string
  guest_first_name: string
  guest_last_name?: string
  table_number?: string
  table_name?: string
  start_time: string
  party_size: number
  status: string
}

export default function ReservationTab({ theme, orgId }: ReservationTabProps) {
  const isDark = theme === 'dark'
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!orgId) return
    const fetch = async () => {
      setIsLoading(true)
      setError('')
      try {
        const res = await api.get<Reservation[]>(`/organizations/${orgId}/reservations`)
        setReservations(res.data || [])
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load reservations.')
      } finally {
        setIsLoading(false)
      }
    }
    fetch()
  }, [orgId])

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
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1'
      const response = await fetch(`${baseUrl}/organizations/${orgId}/reservations/export`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reservations-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch { /* silent */ }
  }

  const formatTime = (t: string) => t?.slice(0, 5) || t
  const guestName = (r: Reservation) => [r.guest_first_name, r.guest_last_name].filter(Boolean).join(' ') || 'Guest'

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
        <Loader2 size={28} style={{ color: '#C99C63', animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  if (error) {
    return <div style={{ color: '#ef4444', textAlign: 'center', padding: '24px', fontSize: '0.875rem' }}>{error}</div>
  }

  return (
    <div>
      <div className="res-admin-tab-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: isDark ? '#ffffff' : '#1f2937' }}>
          Today's Reservations
        </h3>
        <button onClick={handleExportCsv} style={{
          display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', fontWeight: 600,
          padding: '8px 16px', backgroundColor: '#C99C63', color: '#101A1C', border: 'none', borderRadius: '6px', cursor: 'pointer'
        }}>
          <Download size={16} /> Export CSV
        </button>
      </div>

      {reservations.length === 0 ? (
        <p style={{ color: isDark ? '#8b949e' : '#6b7280', textAlign: 'center', padding: '32px 0' }}>No reservations found.</p>
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
              {reservations.map((res) => (
                <tr key={res.id}
                  style={{ borderBottom: `1px solid ${isDark ? '#30363d' : '#e5e7eb'}`, transition: 'background-color 0.2s', cursor: 'pointer' }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = isDark ? '#161B22' : '#f9fafb'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '16px', fontWeight: 600, color: isDark ? '#ffffff' : '#1f2937' }}>{guestName(res)}</td>
                  <td style={{ padding: '16px', color: isDark ? '#8b949e' : '#6b7280' }}>{res.table_name || res.table_number || '—'}</td>
                  <td style={{ padding: '16px', color: isDark ? '#8b949e' : '#6b7280' }}>{formatTime(res.start_time)}</td>
                  <td style={{ padding: '16px', color: isDark ? '#8b949e' : '#6b7280' }}>{res.party_size}</td>
                  <td style={{ padding: '16px' }}><StatusBadge status={res.status as any} /></td>
                  <td style={{ padding: '16px' }}>
                    <select
                      value={res.status}
                      onChange={(e) => handleStatusChange(res.id, e.target.value)}
                      style={{
                        padding: '4px 8px', fontSize: '0.75rem', borderRadius: '6px', cursor: 'pointer',
                        backgroundColor: isDark ? '#161B22' : '#f3f4f6', border: `1px solid ${isDark ? '#30363d' : '#d1d5db'}`,
                        color: isDark ? '#e6edf3' : '#374151',
                      }}
                    >
                      {['confirmed', 'arrived', 'seated', 'completed', 'no_show', 'cancelled'].map(s => (
                        <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
