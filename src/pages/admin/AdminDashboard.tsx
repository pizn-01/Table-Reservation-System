import { useState, useEffect } from 'react'
import { Calendar, Users as UsersIcon, LayoutGrid, UserCheck, Loader2 } from 'lucide-react'
import Navbar from '../../components/Navbar'
import StatsCard from '../../components/StatsCard'
import ReservationTab from './tabs/ReservationTab'
import TablesManagementTab from './tabs/TablesManagementTab'
import StaffManagementTab from './tabs/StaffManagementTab'
import FloorMapTab from './tabs/FloorMapTab'
import { useAuth } from '../../context/AuthContext'
import api from '../../lib/api'

const tabs = [
  { id: 'reservation', label: 'Reservation' },
  { id: 'tables', label: 'Tables Management' },
  { id: 'staff', label: 'Staff Management' },
  { id: 'floormap', label: 'Floor Map' },
]

interface DashboardStats {
  todaysBookings: number
  seatedNow: number
  totalTables: number
  totalStaff: number
}

export default function AdminDashboard() {
  const { restaurant } = useAuth()
  const orgId = restaurant?.id
  const [activeTab, setActiveTab] = useState('reservation')
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const isDark = theme === 'dark'
  const [stats, setStats] = useState<DashboardStats>({ todaysBookings: 0, seatedNow: 0, totalTables: 0, totalStaff: 0 })
  const [statsLoading, setStatsLoading] = useState(true)

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark')

  useEffect(() => {
    if (!orgId) return
    const fetchStats = async () => {
      setStatsLoading(true)
      try {
        const res = await api.get<DashboardStats>(`/organizations/${orgId}/dashboard/stats`)
        if (res.data) setStats(res.data)
      } catch {
        // Silently fall back to zeros — stats are non-critical
      } finally {
        setStatsLoading(false)
      }
    }
    fetchStats()
  }, [orgId])

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: isDark ? '#0B1517' : '#ffffff',
      fontFamily: 'var(--font-sans)',
      transition: 'background-color 0.3s ease'
    }}>
      <Navbar variant="admin" theme={theme} onToggleTheme={toggleTheme} />

      <div className="res-admin-container" style={{ padding: '32px 48px' }}>
        {/* Stats Cards */}
        <div className="res-admin-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
          <StatsCard label="Today's Bookings" value={statsLoading ? '...' : stats.todaysBookings} icon={<Calendar size={18} />} variant={theme} />
          <StatsCard label="Seated Now" value={statsLoading ? '...' : stats.seatedNow} icon={<UsersIcon size={18} />} variant={theme} />
          <StatsCard label="Tables" value={statsLoading ? '...' : stats.totalTables} icon={<LayoutGrid size={18} />} variant={theme} />
          <StatsCard label="Total Staff" value={statsLoading ? '...' : stats.totalStaff} icon={<UserCheck size={18} />} variant={theme} />
        </div>

        {/* Tab Navigation */}
        <div style={{ width: '100%' }}>
          <div className="res-admin-tabs" style={{ display: 'flex', gap: '32px', borderBottom: `1px solid ${isDark ? '#30363d' : '#e5e7eb'}`, marginBottom: '24px' }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '16px 0', fontSize: '0.875rem', fontWeight: 500, position: 'relative',
                  cursor: 'pointer', background: 'none', border: 'none',
                  color: activeTab === tab.id ? (isDark ? '#5EEA7A' : '#10b981') : (isDark ? '#8b949e' : '#6b7280'),
                  transition: 'color 0.2s'
                }}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', backgroundColor: isDark ? '#5EEA7A' : '#10b981' }} />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
            {activeTab === 'reservation' && <ReservationTab theme={theme} orgId={orgId} />}
            {activeTab === 'tables' && <TablesManagementTab theme={theme} orgId={orgId} />}
            {activeTab === 'staff' && <StaffManagementTab theme={theme} orgId={orgId} />}
            {activeTab === 'floormap' && <FloorMapTab theme={theme} orgId={orgId} />}
          </div>
        </div>
      </div>
    </div>
  )
}
