import { useState, useEffect } from 'react'
import { Search, MoreVertical, Loader2, Trash2, ArrowRight } from 'lucide-react'
import StatusBadge from '../../../components/StatusBadge'
import api, { ApiError } from '../../../lib/api'
import InviteStaffModal from './InviteStaffModal'

interface StaffManagementTabProps {
  theme: 'dark' | 'light'
  orgId?: string
}

interface StaffMember {
  id: string
  name: string
  email: string
  role: string
  last_active?: string
  created_at?: string
}

export default function StaffManagementTab({ theme, orgId }: StaffManagementTabProps) {
  const isDark = theme === 'dark'
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [filtered, setFiltered] = useState<StaffMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)

  const fetchStaff = async () => {
    if (!orgId) return
    setIsLoading(true)
    setError('')
    try {
      const res = await api.get<StaffMember[]>(`/organizations/${orgId}/staff`)
      setStaff(res.data || [])
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load staff.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStaff()
  }, [orgId])

  // Client-side filtering
  useEffect(() => {
    let result = staff
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(m => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q))
    }
    if (roleFilter !== 'all') {
      result = result.filter(m => m.role === roleFilter)
    }
    setFiltered(result)
  }, [staff, search, roleFilter])

  const handleRemove = async (id: string) => {
    if (!window.confirm('Remove this staff member?')) return
    try {
      await api.delete(`/organizations/${orgId}/staff/${id}`)
      setStaff(prev => prev.filter(m => m.id !== id))
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to remove staff member.')
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
      {/* Top Control Bar */}
      <div className="res-admin-tab-header res-staff-controls" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', gap: '20px' }}>
        <div style={{ position: 'relative', width: '450px', maxWidth: '100%' }}>
          <Search size={20} strokeWidth={2.5} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: isDark ? 'var(--color-dark-text-muted)' : '#6b7280' }} />
          <input
            type="text"
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-dark"
            style={{
              width: '100%', padding: '14px 16px 14px 52px',
              backgroundColor: isDark ? '#161B22' : '#ffffff', 
              border: `1px solid ${isDark ? '#30363d' : '#e5e7eb'}`,
              borderRadius: '14px', color: isDark ? '#ffffff' : '#1f2937', fontSize: '0.9375rem',
              height: '56px'
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input-dark"
            style={{
              padding: '0 16px', backgroundColor: isDark ? '#161B22' : '#ffffff',
              border: `1px solid ${isDark ? '#30363d' : '#e5e7eb'}`, borderRadius: '14px',
              color: isDark ? '#ffffff' : '#1f2937', fontSize: '0.9375rem', cursor: 'pointer', 
              minWidth: '160px', height: '56px'
            }}
          >
            <option value="all">All Roles</option>
            <option value="manager">Manager</option>
            <option value="host">Host</option>
            <option value="viewer">Viewer</option>
          </select>

          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="btn-gold"
            style={{
              height: '56px',
              padding: '0 28px',
              borderRadius: '14px',
              fontSize: '0.9375rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 12px 24px -8px rgba(212, 168, 86, 0.4)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            Invite Staff <ArrowRight size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <InviteStaffModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={() => {
          fetchStaff()
        }}
        orgId={orgId}
      />

      {filtered.length === 0 ? (
        <p style={{ color: isDark ? '#8b949e' : '#6b7280', textAlign: 'center', padding: '32px 0' }}>
          {staff.length === 0 ? 'No staff members yet. Invite your team from the Setup Wizard.' : 'No staff match your search.'}
        </p>
      ) : (
        <div style={{ borderRadius: '12px', border: `1px solid ${isDark ? '#30363d' : '#e5e7eb'}`, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${isDark ? '#30363d' : '#e5e7eb'}`, backgroundColor: isDark ? '#101A1C' : '#f9fafb' }}>
                  {['Name', 'Email', 'Role', ''].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '16px 24px', fontWeight: 500, color: isDark ? '#ffffff' : '#4b5563' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((member) => (
                  <tr key={member.id}
                    style={{ borderBottom: `1px solid ${isDark ? '#30363d' : '#e5e7eb'}`, transition: 'background-color 0.2s', cursor: 'pointer' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = isDark ? '#161B22' : '#f9fafb'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '16px 24px', color: isDark ? '#e6edf3' : '#1f2937' }}>{member.name}</td>
                    <td style={{ padding: '16px 24px', color: isDark ? '#e6edf3' : '#4b5563' }}>{member.email}</td>
                    <td style={{ padding: '16px 24px' }}><StatusBadge status={member.role as any} /></td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleRemove(member.id)}
                        title="Remove staff member"
                        style={{ background: 'none', border: 'none', color: isDark ? '#8b949e' : '#6b7280', cursor: 'pointer', padding: '4px' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
