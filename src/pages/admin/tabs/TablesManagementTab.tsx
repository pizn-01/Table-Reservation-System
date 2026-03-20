import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react'
import StatusBadge from '../../../components/StatusBadge'
import api, { ApiError } from '../../../lib/api'
import AddEditTableModal from './AddEditTableModal'

interface TablesManagementTabProps {
  theme: 'dark' | 'light'
  orgId?: string
}

interface Table {
  id: string
  table_number: string
  area_name?: string
  area_id?: string
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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTable, setEditingTable] = useState<Table | null>(null)

  const fetchTables = async () => {
    if (!orgId) return
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

  useEffect(() => {
    fetchTables()
  }, [orgId])

  const handleAdd = () => {
    setEditingTable(null)
    setIsModalOpen(true)
  }

  const handleEdit = (table: Table) => {
    setEditingTable(table)
    setIsModalOpen(true)
  }

  const handleDelete = async (table: Table) => {
    if (!window.confirm(`Delete table #${table.table_number}? This cannot be undone.`)) return
    try {
      await api.delete(`/organizations/${orgId}/tables/${table.id}`)
      setTables(prev => prev.filter(t => t.id !== table.id))
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to delete table.')
    }
  }

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
      <AddEditTableModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchTables()}
        orgId={orgId}
        table={editingTable}
      />

      <div className="res-admin-tab-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: isDark ? '#ffffff' : '#1f2937', letterSpacing: '-0.02em' }}>
          All Tables ({tables.length})
        </h3>
        <button
          onClick={handleAdd}
          className="btn-gold"
          style={{
            display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', fontWeight: 800,
            padding: '0 20px', height: '48px', backgroundColor: '#C99C63', color: '#101A1C', border: 'none', borderRadius: '12px', 
            cursor: 'pointer', boxShadow: '0 8px 16px -4px rgba(201, 156, 99, 0.3)', textTransform: 'uppercase', letterSpacing: '0.05em'
          }}
        >
          <Plus size={18} strokeWidth={2.5} /> Add Table
        </button>
      </div>

      {tables.length === 0 ? (
        <p style={{ color: isDark ? '#8b949e' : '#6b7280', textAlign: 'center', padding: '32px 0' }}>No tables configured. Click "Add Table" to get started.</p>
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
                  style={{ borderBottom: `1px solid ${isDark ? '#30363d' : '#e5e7eb'}`, transition: 'background-color 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = isDark ? '#161B22' : '#f9fafb'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '16px', fontWeight: 600, color: isDark ? '#ffffff' : '#1f2937' }}>#{table.table_number}</td>
                  <td style={{ padding: '16px', color: isDark ? '#8b949e' : '#6b7280' }}>{table.area_name || '—'}</td>
                  <td style={{ padding: '16px', color: isDark ? '#8b949e' : '#6b7280' }}>{table.capacity}</td>
                  <td style={{ padding: '16px', color: isDark ? '#8b949e' : '#6b7280' }}>{table.table_type || '—'}</td>
                  <td style={{ padding: '16px', color: isDark ? '#8b949e' : '#6b7280' }}>{table.shape || '—'}</td>
                  <td style={{ padding: '16px' }}><StatusBadge status={table.status as any} /></td>
                  <td style={{ padding: '16px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => handleEdit(table)}
                      title="Edit table"
                      style={{ background: 'none', border: 'none', color: isDark ? '#8b949e' : '#6b7280', cursor: 'pointer', padding: '4px' }}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(table)}
                      title="Delete table"
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', opacity: 0.7 }}
                    >
                      <Trash2 size={16} />
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
