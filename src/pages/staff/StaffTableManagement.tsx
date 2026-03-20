import { useState, useEffect, useMemo } from 'react'
import { Users, MapPin, Settings, LogOut, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api, { ApiError } from '../../lib/api'
import FloorPlanCanvas, { FloorTable } from '../../components/FloorPlanCanvas'

// ─── Types ──────────────────────────────────────────────

interface TableData {
  id: string
  table_number: string
  capacity: number
  area_name?: string
  table_type?: string
  status: string
}

interface AreaGroup {
  title: string
  tables: TableData[]
}

interface CalendarBooking {
  id: string
  tableId: string
  guestName: string
  partySize: number
  startTime: string   // "HH:MM"
  endTime: string     // "HH:MM"
  status: string
}

const toCalendarBooking = (b: any): CalendarBooking => ({
  id: b.id,
  tableId: String(b.table_id || b.tableId || b.table?.id || ''),
  guestName: [b.guest_first_name, b.guest_last_name, b.guestFirstName, b.guestLastName]
    .filter(Boolean)
    .slice(0, 2)
    .join(' ') || b.guestName || 'Guest',
  partySize: b.party_size || b.partySize || 0,
  startTime: (b.start_time || b.startTime || '').slice(0, 5),
  endTime: (b.end_time || b.endTime || '').slice(0, 5),
  status: b.status || 'confirmed',
})

// ─── Helpers ────────────────────────────────────────────

const dateToYMD = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const dayLabels = (base: Date): { label: string; date: string }[] => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    return {
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : days[d.getDay()],
      date: dateToYMD(d),
    }
  })
}

const formatLongDate = (ymd: string) => {
  const d = new Date(ymd + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

// ─── Calendar Table Icon ───────────────────────────────

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

// ─── Component ──────────────────────────────────────────

export default function StaffTableManagement() {
  const { restaurant, logout } = useAuth()
  const orgId = restaurant?.id

  const [activeTab, setActiveTab] = useState('Day View')
  const today = new Date()
  const days = useMemo(() => dayLabels(today), [])
  const [selectedDate, setSelectedDate] = useState(days[0].date)

  // ── Data State ─────────────────────────────────────────
  const [tables, setTables] = useState<TableData[]>([])
  const [bookings, setBookings] = useState<CalendarBooking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState<'standard' | 'merged' | 'split'>('standard')

  // ── Fetch Tables ───────────────────────────────────────
  useEffect(() => {
    if (!orgId) return
    const fetchTables = async () => {
      try {
        const res = await api.get<TableData[]>(`/organizations/${orgId}/tables`)
        setTables(res.data || [])
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load tables.')
      }
    }
    fetchTables()
  }, [orgId])

  // ── Fetch Reservations (per date) ─────────────────────
  useEffect(() => {
    if (!orgId) return
    const fetchBookings = async () => {
      setIsLoading(true)
      setError('')
      try {
        // Try /calendar first; fall back to list
        let calendarData: CalendarBooking[] = []
        try {
          const calRes = await api.get<any>(`/organizations/${orgId}/reservations/calendar?date=${selectedDate}`)
          if (Array.isArray(calRes.data)) {
            calendarData = calRes.data.map(toCalendarBooking)
          } else if (calRes.data?.sections) {
            calendarData = calRes.data.sections
              .flatMap((section: any) => section.tables || [])
              .flatMap((table: any) => (table.reservations || []).map((r: any) => ({
                ...r,
                tableId: table.id,
              })))
              .map(toCalendarBooking)
          }
        } catch {
          // calendar endpoint might not exist; fall back to list
          const listRes = await api.get<any>(`/organizations/${orgId}/reservations?date=${selectedDate}`)
          const list = listRes.data || (listRes as any).reservations || []
          calendarData = list.map(toCalendarBooking)
        }
        setBookings(calendarData)
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load reservations.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchBookings()
  }, [orgId, selectedDate])

  // ── Derived Data ───────────────────────────────────────

  // Group tables by area_name for Table View / Calendar View
  const areaGroups: AreaGroup[] = useMemo(() => {
    const map = new Map<string, TableData[]>()
    tables.forEach(t => {
      const area = t.area_name || 'Uncategorized'
      if (!map.has(area)) map.set(area, [])
      map.get(area)!.push(t)
    })
    return Array.from(map.entries()).map(([title, tables]) => ({ title, tables }))
  }, [tables])

  // Stats computed from real data
  const stats = useMemo(() => {
    const arriving = bookings.filter(b => b.status === 'arriving' || b.status === 'confirmed').length
    const seated = bookings.filter(b => b.status === 'seated').length
    const available = tables.filter(t => {
      // A table is "available now" if no booking for it overlaps the current time
      const now = new Date()
      const nowMin = now.getHours() * 60 + now.getMinutes()
      return !bookings.some(b => {
        if (String(b.tableId) !== String(t.id) && String(b.tableId) !== t.table_number) return false
        const [sh, sm] = b.startTime.split(':').map(Number)
        const [eh, em] = b.endTime.split(':').map(Number)
        return nowMin >= (sh * 60 + sm) && nowMin < (eh * 60 + em)
      })
    }).length
    return [
      { label: 'Bookings', value: bookings.length },
      { label: 'Seated', value: seated },
      { label: 'Upcoming', value: arriving },
      { label: 'Available Now', value: available },
    ]
  }, [bookings, tables])

  // ── Helpers ────────────────────────────────────────────

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'arriving': return '#C99C63'
      case 'seated': return '#E05D5D'
      case 'confirmed': return '#5D8FE0'
      case 'available': return '#5EEA7A'
      case 'completed': return '#8b949e'
      case 'no_show': return '#d73a49'
      default: return '#8b949e'
    }
  }

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'arriving': return 'rgba(201, 156, 99, 0.1)'
      case 'seated': return 'rgba(224, 93, 93, 0.1)'
      case 'confirmed': return 'rgba(93, 143, 224, 0.1)'
      case 'available': return 'rgba(94, 234, 122, 0.1)'
      default: return 'rgba(139, 148, 158, 0.1)'
    }
  }

  const getTableCurrentStatus = (table: TableData): string => {
    const now = new Date()
    const nowMin = now.getHours() * 60 + now.getMinutes()
    const booking = bookings.find(b => {
      if (String(b.tableId) !== String(table.id) && String(b.tableId) !== table.table_number) return false
      const [sh, sm] = b.startTime.split(':').map(Number)
      const [eh, em] = b.endTime.split(':').map(Number)
      return nowMin >= (sh * 60 + sm) && nowMin < (eh * 60 + em)
    })
    return booking ? booking.status : 'available'
  }

  // ── Calendar date navigation ───────────────────────────

  const shiftDate = (direction: number) => {
    const d = new Date(selectedDate + 'T00:00:00')
    d.setDate(d.getDate() + direction)
    setSelectedDate(dateToYMD(d))
  }

  // ── Loading State ──────────────────────────────────────

  if (isLoading && tables.length === 0) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F6F7F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={32} style={{ color: '#C99C63', animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  return (
    <div
      className="res-staff-container"
      style={{
      minHeight: '100vh',
      backgroundColor: '#F6F7F9',
      color: '#111827',
      fontFamily: 'Inter, system-ui, sans-serif',
      padding: '40px'
    }}>
      {/* Header Logo */}
      <div className="res-staff-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#111827' }}>{restaurant?.name || 'Restaurant'}</h1>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}><Settings size={20} /></button>
          <button onClick={logout} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}><LogOut size={20} /></button>
        </div>
      </div>

      {/* Stats row — computed from real data */}
      <div className="res-staff-stats-row" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '20px',
        marginBottom: '40px'
      }}>
        {stats.map((stat, idx) => (
          <div key={idx} style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            border: 'none',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)'
          }}>
            <div>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 8px 0' }}>{stat.label}</p>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#111827' }}>{stat.value}</h2>
            </div>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#f3f4f6',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CustomTableIcon />
            </div>
          </div>
        ))}
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '10px 16px', marginBottom: '16px', color: '#ef4444', fontSize: '0.8125rem' }}>
          {error}
        </div>
      )}

      {/* Content area */}
      <div className="res-staff-content" style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e5e7eb',
        padding: '0',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
      }}>
        {/* Tabs */}
        <div className="res-staff-tabs" style={{
          display: 'flex',
          gap: '24px',
          padding: '24px 32px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          {['Day View', 'Table View', 'Calendar View'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'none',
                border: 'none',
                color: activeTab === tab ? '#6B9E78' : '#9ca3af',
                fontSize: '0.875rem',
                fontWeight: activeTab === tab ? 600 : 500,
                cursor: 'pointer',
                padding: '0',
                position: 'relative',
                transition: 'color 0.2s'
              }}
            >
              {tab}
              {activeTab === tab && (
                <div style={{
                  position: 'absolute',
                  bottom: '-25px',
                  left: 0,
                  right: 0,
                  height: '2px',
                  backgroundColor: '#6B9E78'
                }} />
              )}
            </button>
          ))}
        </div>

        {/* ─── Day View ─────────────────────────────────── */}
        {activeTab === 'Day View' && (
          <>
            <div className="res-staff-day-header" style={{
              padding: '32px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 8px 0', color: '#111827' }}>{formatLongDate(selectedDate)}</h3>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
                  {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>{tables.length} tables total</p>
            </div>

            {tables.length === 0 ? (
              <p style={{ color: '#6b7280', textAlign: 'center', padding: '32px', fontSize: '0.875rem' }}>No tables configured. Add tables from the Setup Wizard.</p>
            ) : (
              <div className="res-staff-day-grid" style={{
                padding: '0 32px 32px 32px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px'
              }}>
                {tables.map(table => {
                  const currentStatus = getTableCurrentStatus(table)
                  return (
                    <div key={table.id} style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '24px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '16px'
                    }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        backgroundColor: getStatusColor(currentStatus),
                        borderRadius: '50%',
                        marginTop: '6px'
                      }} />
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 12px 0', color: '#111827' }}>Table {table.table_number}</h4>
                        <div style={{ display: 'flex', gap: '24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280' }}>
                            <Users size={16} />
                            <span style={{ fontSize: '0.8125rem' }}>Capacity: {table.capacity} seats</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280' }}>
                            <MapPin size={16} />
                            <span style={{ fontSize: '0.8125rem' }}>{table.area_name || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ─── Table View (Interactive Floor Plan) ────────────── */}
        {activeTab === 'Table View' && (
          <div style={{ padding: '24px' }}>
            {/* View Mode Toggle */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px',
            }}>
              <span style={{ color: '#8b949e', fontSize: '0.8125rem', fontWeight: 600, marginRight: '8px' }}>View:</span>
              {(['standard', 'merged', 'split'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '6px',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: viewMode === mode ? '1px solid #C99C63' : '1px solid #30363d',
                    backgroundColor: viewMode === mode ? 'rgba(201,156,99,0.15)' : 'transparent',
                    color: viewMode === mode ? '#C99C63' : '#8b949e',
                    textTransform: 'capitalize',
                    transition: 'all 0.2s',
                  }}
                >
                  {mode}
                </button>
              ))}
              <span style={{ flex: 1 }} />
              <span style={{ color: '#8b949e', fontSize: '0.75rem' }}>
                Hold Shift while dragging to snap to grid
              </span>
            </div>

            {tables.length === 0 ? (
              <p style={{ color: '#6b7280', textAlign: 'center', padding: '32px', fontSize: '0.875rem' }}>No tables found. Add tables from the Setup Wizard.</p>
            ) : (
              <FloorPlanCanvas
                tables={tables.map(t => ({
                  id: t.id,
                  tableNumber: t.table_number,
                  name: `Table ${t.table_number}`,
                  capacity: t.capacity,
                  area: t.area_name ? { id: t.area_name, name: t.area_name } : null,
                  status: t.status,
                  positionX: (t as any).positionX ?? (t as any).position_x ?? null,
                  positionY: (t as any).positionY ?? (t as any).position_y ?? null,
                  isMergeable: (t as any).isMergeable ?? (t as any).is_mergeable ?? false,
                  mergeGroupId: (t as any).mergeGroupId ?? (t as any).merge_group_id ?? null,
                  splitParentId: (t as any).splitParentId ?? (t as any).split_parent_id ?? null,
                  width: (t as any).width ?? 120,
                  height: (t as any).height ?? 90,
                } as FloorTable))}
                orgId={orgId!}
                viewMode={viewMode}
                getTableStatus={(_t) => {
                  const matchingTable = tables.find(tt => tt.id === _t.id)
                  return matchingTable ? getTableCurrentStatus(matchingTable) : 'available'
                }}
              />
            )}
          </div>
        )}

        {/* ─── Calendar View ─────────────────────────────── */}
        {activeTab === 'Calendar View' && (
          <div style={{ padding: '0' }}>
            {/* Day Selector Navigation */}
            <div className="res-staff-cal-nav" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '24px 32px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <div className="res-staff-cal-days" style={{ display: 'flex', gap: '8px' }}>
                {days.map(day => (
                  <button
                    key={day.date}
                    onClick={() => setSelectedDate(day.date)}
                    style={{
                      padding: '10px 24px',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: 'none',
                      backgroundColor: selectedDate === day.date ? '#EAF4EC' : 'transparent',
                      color: selectedDate === day.date ? '#6B9E78' : '#6b7280',
                      transition: 'all 0.2s'
                    }}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                padding: '10px 20px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: 500 }}>Bookings</span>
                <span style={{ color: '#111827', fontSize: '1.25rem', fontWeight: 700 }}>{bookings.length}</span>
              </div>
            </div>

            {/* Date Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '32px',
              padding: '32px'
            }}>
              <button onClick={() => shiftDate(-1)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><ChevronLeft size={24} /></button>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#111827' }}>{formatLongDate(selectedDate)}</h3>
              <button onClick={() => shiftDate(1)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><ChevronRight size={24} /></button>
            </div>

            {/* Loading overlay */}
            {isLoading && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
                <Loader2 size={24} style={{ color: '#C99C63', animation: 'spin 1s linear infinite' }} />
              </div>
            )}

            {!isLoading && (
              <div style={{ overflowX: 'auto', padding: '0 32px 32px 32px' }}>
                <div style={{
                  minWidth: '1100px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  overflow: 'hidden'
                }}>
                  {/* Time Header */}
                  <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
                    <div style={{
                      width: '160px',
                      borderRight: '1px solid #e5e7eb',
                      backgroundColor: '#f9fafb'
                    }} />
                    <div style={{ flex: 1, backgroundColor: '#ffffff' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(17, 1fr)', position: 'relative' }}>
                        {[13, 14, 15, 16, 17].map((hour, idx) => (
                          <div key={hour} style={{ gridColumn: 'span 1', display: 'contents' }}>
                            <div style={{
                              textAlign: 'center',
                              padding: '16px 0',
                              fontSize: '0.9375rem',
                              fontWeight: 700,
                              color: '#111827',
                              borderRight: '1px solid #e5e7eb'
                            }}>
                              {hour}
                            </div>
                            {idx < 4 && ['15', '30', '45'].map(min => (
                              <div key={`${hour}-${min}`} style={{
                                textAlign: 'center',
                                padding: '16px 0',
                                fontSize: '0.8125rem',
                                color: '#6b7280',
                                borderRight: '1px solid #e5e7eb'
                              }}>
                                {min}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Grid Content — grouped by area */}
                  {areaGroups.map(section => (
                    <div key={section.title}>
                      <div style={{
                        display: 'flex',
                        backgroundColor: '#f9fafb',
                        borderBottom: '1px solid #e5e7eb',
                        minHeight: '52px'
                      }}>
                        <div style={{
                          width: '160px',
                          borderRight: '1px solid #e5e7eb',
                          padding: '0 16px',
                          display: 'flex',
                          alignItems: 'center',
                          fontSize: '0.9375rem',
                          fontWeight: 700,
                          color: '#111827',
                          whiteSpace: 'nowrap'
                        }}>
                          {section.title}
                        </div>
                        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(17, 1fr)', position: 'relative' }}>
                          {Array.from({ length: 16 }).map((_, i) => (
                            <div key={i} style={{
                              gridColumnStart: i + 2,
                              borderLeft: '1px solid rgba(229, 231, 235, 0.6)',
                              height: '100%',
                              position: 'relative',
                              zIndex: 1
                            }} />
                          ))}
                        </div>
                      </div>

                      {section.tables.map((table) => (
                        <div key={table.id} style={{
                          display: 'flex',
                          borderBottom: '1px solid #e5e7eb',
                          minHeight: '80px'
                        }}>
                          {/* Two-column Sidebar */}
                          <div style={{
                            width: '160px',
                            borderRight: '1px solid #e5e7eb',
                            display: 'flex',
                            backgroundColor: '#ffffff'
                          }}>
                            <div style={{
                              flex: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.875rem',
                              fontWeight: 700,
                              color: '#111827'
                            }}>{table.table_number}</div>
                            <div style={{
                              flex: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.8125rem',
                              color: '#6b7280',
                              fontWeight: 600
                            }}>{table.capacity}</div>
                          </div>

                          {/* Booking Area */}
                          <div style={{ flex: 1, position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(17, 1fr)' }}>
                            {/* Vertical Column Lines */}
                            {Array.from({ length: 16 }).map((_, i) => (
                              <div key={i} style={{
                                gridColumnStart: i + 2,
                                borderLeft: '1px solid rgba(229, 231, 235, 0.6)',
                                height: '100%',
                                pointerEvents: 'none',
                                zIndex: 1
                              }} />
                            ))}

                            {/* Real Bookings */}
                            {bookings
                              .filter(b => String(b.tableId) === String(table.id) || String(b.tableId) === table.table_number)
                              .map(booking => {
                                const [sh, sm] = booking.startTime.split(':').map(Number)
                                const [eh, em] = booking.endTime.split(':').map(Number)
                                if (isNaN(sh) || isNaN(sm)) return null
                                const startTotalMin = sh * 60 + sm
                                const endTotalMin = eh * 60 + em
                                const baseTotalMin = 13 * 60
                                const startCol = (startTotalMin - baseTotalMin) / 15 + 1
                                const endCol = (endTotalMin - baseTotalMin) / 15 + 1

                                if (startCol < 1 || startCol > 17) return null

                                const isSeated = booking.status === 'seated'
                                const mainColor = isSeated ? '#5EEA7A' : '#C99C63'
                                const bgColor = isSeated ? 'rgba(94, 234, 122, 0.6)' : 'rgba(201, 156, 99, 0.6)'

                                return (
                                  <div key={booking.id} style={{
                                    position: 'absolute',
                                    top: '12px',
                                    bottom: '12px',
                                    left: `calc(${(startCol - 1) * 5.88}% + 4px)`,
                                    width: `calc(${(endCol - startCol) * 5.88}% - 8px)`,
                                    backgroundColor: bgColor,
                                    borderRadius: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '0 8px',
                                    gap: '10px',
                                    zIndex: 10
                                  }}>
                                    <div style={{
                                      backgroundColor: '#ffffff',
                                      borderRadius: '3px',
                                      padding: '2px 6px',
                                      fontSize: '0.75rem',
                                      fontWeight: 800,
                                      color: mainColor,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      minWidth: '22px'
                                    }}>
                                      {booking.partySize}
                                    </div>
                                    <span style={{
                                      fontSize: '0.8125rem',
                                      fontWeight: 600,
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      color: '#ffffff'
                                    }}>
                                      {booking.guestName}
                                    </span>
                                  </div>
                                )
                              })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
