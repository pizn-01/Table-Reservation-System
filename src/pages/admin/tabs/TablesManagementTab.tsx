import { useState, useEffect } from 'react'
import { Plus, Edit, Loader2 } from 'lucide-react'
import StatusBadge from '../../../components/StatusBadge'
import api, { ApiError } from '../../../lib/api'

interface TablesManagementTabProps {
  theme: 'dark' | 'light'
  orgId?: string
}

interface Table {
  id: string
  table_number: string
  area_name?: string
  capacity: number
  table_type?: string
  shape?: string
  status: string
}

export default function TablesManagementTab({ theme, orgId }: TablesManagementTabProps) {
  const isDark = theme === 'dark'
  const [tables, setTables] = useState<Table[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!orgId) return
    const fetchTables = async () => {
      setIsLoading(true)
      setError('')
      try {
        const res = await api.get<Table[]>(`/organizations/${orgId}/tables`)
        setTables(res.data || [])
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load tables.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchTables()
  }, [orgId])

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
          All Tables
        </h3>
        <button style={{
          display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', fontWeight: 600,
          padding: '8px 16px', backgroundColor: '#C99C63', color: '#101A1C', border: 'none', borderRadius: '6px', cursor: 'pointer'
        }}>
          <Plus size={16} /> Add Table
        </button>
      </div>

      {tables.length === 0 ? (
        <p style={{ color: isDark ? '#8b949e' : '#6b7280', textAlign: 'center', padding: '32px 0' }}>No tables configured. Add tables from the Floor Map tab or Setup Wizard.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${isDark ? '#30363d' : '#e5e7eb'}` }}>
                {['Table', 'Area', 'Capacity', 'Type', 'Shape', 'Status', ''].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '16px', fontWeight: 500, color: isDark ? '#8b949e' : '#6b7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tables.map((table) => (
                <tr key={table.id}
                  style={{ borderBottom: `1px solid ${isDark ? '#30363d' : '#e5e7eb'}`, transition: 'background-color 0.2s', cursor: 'pointer' }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = isDark ? '#161B22' : '#f9fafb'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '16px', fontWeight: 600, color: isDark ? '#ffffff' : '#1f2937' }}>#{table.table_number}</td>
                  <td style={{ padding: '16px', color: isDark ? '#8b949e' : '#6b7280' }}>{table.area_name || '—'}</td>
                  <td style={{ padding: '16px', color: isDark ? '#8b949e' : '#6b7280' }}>{table.capacity}</td>
                  <td style={{ padding: '16px', color: isDark ? '#8b949e' : '#6b7280' }}>{table.table_type || '—'}</td>
                  <td style={{ padding: '16px', color: isDark ? '#8b949e' : '#6b7280' }}>{table.shape || '—'}</td>
                  <td style={{ padding: '16px' }}><StatusBadge status={table.status as any} /></td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <button style={{ background: 'none', border: 'none', color: isDark ? '#8b949e' : '#6b7280', cursor: 'pointer', padding: '4px' }}>
                      <Edit size={16} />
                    </button>
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
