import { useState } from 'react'
import { Users, MapPin, Coffee, Settings, LogOut, ChevronLeft, ChevronRight } from 'lucide-react'

interface TableData {
  id: number
  name: string
  capacity: number
  location: string
  status: 'available' | 'seated' | 'confirmed' | 'arriving'
}

const calendarBookings = [
  // Window Section (Table 1-4)
  { id: 1, tableId: '1', name: 'Uston & Co', guests: 8, start: '13:00', end: '14:00', status: 'confirmed' },
  { id: 2, tableId: '1', name: 'Mike Porter', guests: 6, start: '15:00', end: '16:00', status: 'confirmed' },
  { id: 3, tableId: '1', name: 'Beth Rose', guests: 6, start: '16:00', end: '17:00', status: 'confirmed' },
  { id: 4, tableId: '3', name: 'Amy Dogan', guests: 4, start: '13:00', end: '14:00', status: 'seated' },
  { id: 5, tableId: '3', name: 'Susan Reach', guests: 4, start: '15:00', end: '16:00', status: 'confirmed' },

  // Main Dining Section (Table 5-7)
  { id: 6, tableId: '5', name: 'Amy Dogan', guests: 4, start: '13:45', end: '14:45', status: 'confirmed' },
  { id: 7, tableId: '5', name: 'Beth Reach', guests: 4, start: '16:15', end: '17:15', status: 'seated' },
  { id: 8, tableId: '6', name: 'Susan Reach', guests: 4, start: '15:45', end: '16:45', status: 'confirmed' },
  { id: 9, tableId: '7', name: 'Jon Lane', guests: 4, start: '14:15', end: '15:15', status: 'confirmed' },
  { id: 10, tableId: '7', name: 'Maggie Slate', guests: 4, start: '15:45', end: '16:45', status: 'seated' },
  { id: 11, tableId: '7', name: 'Tonny Timber', guests: 8, start: '17:15', end: '18:15', status: 'confirmed' },

  // Outdoor Section (Table 8-12)
  { id: 12, tableId: '9', name: 'Jon Lane', guests: 4, start: '13:45', end: '14:45', status: 'confirmed' },
  { id: 13, tableId: '9', name: 'Maggie Slate', guests: 4, start: '15:45', end: '16:45', status: 'seated' },
  { id: 14, tableId: '9', name: 'Tonny Timber', guests: 8, start: '17:15', end: '18:15', status: 'confirmed' },
  { id: 15, tableId: '10', name: 'Maggie Slate', guests: 4, start: '14:45', end: '15:45', status: 'confirmed' },
  { id: 16, tableId: '10', name: 'Tonny Timber', guests: 8, start: '16:45', end: '17:45', status: 'seated' },
  { id: 17, tableId: '10', name: 'Tonny Timber', guests: 8, start: '18:15', end: '19:15', status: 'confirmed' },
  { id: 18, tableId: '11', name: 'Amy Dogan', guests: 4, start: '13:00', end: '14:00', status: 'confirmed' },
  { id: 19, tableId: '11', name: 'Susan Reach', guests: 4, start: '15:45', end: '16:45', status: 'confirmed' },
  { id: 20, tableId: '12', name: 'Tonny Timber', guests: 8, start: '17:15', end: '18:15', status: 'seated' }
]

const calendarGridMetrics = [14, 16, 18, 18, 22, 22, 20, 20, 8, 4, 4, 4, 0, 0, 0, 0, 16]

const dayViewTables: TableData[] = [
  { id: 1, name: 'Table 1', capacity: 2, location: 'By the window', status: 'available' },
  { id: 2, name: 'Table 2', capacity: 2, location: 'Center area', status: 'available' },
  { id: 3, name: 'Table 3', capacity: 4, location: 'Private corner', status: 'available' },
  { id: 4, name: 'Table 4', capacity: 2, location: 'Center area', status: 'available' },
  { id: 5, name: 'Table 5', capacity: 4, location: 'Private corner', status: 'available' },
  { id: 6, name: 'Table 6', capacity: 2, location: 'Center area', status: 'available' },
  { id: 7, name: 'Table 7', capacity: 4, location: 'Private corner', status: 'available' },
  { id: 8, name: 'Table 8', capacity: 2, location: 'Center area', status: 'available' },
]

const tableViewSections = [
  {
    title: 'Window',
    tables: [
      { id: '1', name: 'Table 1', capacity: 8, status: 'confirmed' },
      { id: '2', name: 'Table 2', capacity: 2, status: 'available' },
      { id: '3', name: 'Table 3', capacity: 4, status: 'seated' },
      { id: '4', name: 'Table 4', capacity: 4, status: 'available' },
    ]
  },
  {
    title: 'Main Dining',
    tables: [
      { id: '5', name: 'Table 5', capacity: 2, status: 'confirmed' },
      { id: '6', name: 'Table 6', capacity: 6, status: 'confirmed' },
      { id: '7', name: 'Table 7', capacity: 4, status: 'confirmed' },
      { id: '8', name: 'Table 8', capacity: 2, status: 'available' },
    ]
  },
  {
    title: 'Outdoor',
    tables: [
      { id: '9', name: 'Table 9', capacity: 4, status: 'confirmed' },
      { id: '10', name: 'Table 10', capacity: 4, status: 'confirmed' },
      { id: '11', name: 'Table 11', capacity: 4, status: 'confirmed' },
      { id: '12', name: 'Table 12', capacity: 2, status: 'confirmed' },
    ]
  }
]

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

export default function StaffTableManagement() {
  const [activeTab, setActiveTab] = useState('Day View')
  const [activeDay, setActiveDay] = useState('Today')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'arriving': return '#C99C63'
      case 'seated': return '#E05D5D'
      case 'confirmed': return '#5D8FE0'
      case 'available': return '#5EEA7A'
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
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#111827' }}>Logo</h1>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}><Settings size={20} /></button>
          <button style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}><LogOut size={20} /></button>
        </div>
      </div>

      {/* Stats row */}
      <div className="res-staff-stats-row" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '20px',
        marginBottom: '40px'
      }}>
        {[
          { label: 'Arriving', value: 3 },
          { label: 'Seated', value: 3 },
          { label: 'Confirmed', value: 2 },
          { label: 'Available', value: 4 }
        ].map((stat, idx) => (
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

        {activeTab === 'Day View' && (
          <>
            {/* Detailed Header */}
            <div className="res-staff-day-header" style={{
              padding: '32px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 8px 0', color: '#111827' }}>Thursday, February 17, 2026</h3>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>at 12:00</p>
              </div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>8 tables available</p>
            </div>

            {/* Table Grid (Day View) */}
            <div className="res-staff-day-grid" style={{
              padding: '0 32px 32px 32px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px'
            }}>
              {dayViewTables.map(table => (
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
                    backgroundColor: getStatusColor(table.status),
                    borderRadius: '50%',
                    marginTop: '6px'
                  }} />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 12px 0', color: '#111827' }}>{table.name}</h4>
                    <div style={{ display: 'flex', gap: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280' }}>
                        <Users size={16} />
                        <span style={{ fontSize: '0.8125rem' }}>Capacity: {table.capacity} seats</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280' }}>
                        <MapPin size={16} />
                        <span style={{ fontSize: '0.8125rem' }}>{table.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'Table View' && (
          <div style={{ padding: '32px' }}>
            {tableViewSections.map((section, sIdx) => (
              <div key={section.title} style={{ marginBottom: sIdx === tableViewSections.length - 1 ? 0 : '60px' }}>
                {/* Section Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
                  <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
                  <span style={{ color: '#C99C63', fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {section.title}
                  </span>
                  <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
                </div>

                {/* Table Grid (Floor Map Style) */}
                <div className="res-staff-floor-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '40px',
                  rowGap: '60px'
                }}>
                  {section.tables.map(table => (
                    <div key={table.id} style={{ position: 'relative', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {/* Cross (Chairs) */}
                      {/* Horizontal bar (always one) */}
                      <div style={{
                        position: 'absolute',
                        width: '240px',
                        height: '40px',
                        backgroundColor: '#f3f4f6',
                        border: '1px solid #e5e7eb',
                        boxSizing: 'border-box',
                        borderRadius: '8px'
                      }} />
                      
                      {/* Vertical bars (one for standard, two for Main Dining) */}
                      {section.title === 'Main Dining' ? (
                        <>
                          <div style={{
                            position: 'absolute',
                            width: '40px',
                            height: '190px',
                            backgroundColor: '#f3f4f6',
                            border: '1px solid #e5e7eb',
                            boxSizing: 'border-box',
                            borderRadius: '8px',
                            transform: 'translateX(-35px)'
                          }} />
                          <div style={{
                            position: 'absolute',
                            width: '40px',
                            height: '190px',
                            backgroundColor: '#f3f4f6',
                            border: '1px solid #e5e7eb',
                            boxSizing: 'border-box',
                            borderRadius: '8px',
                            transform: 'translateX(35px)'
                          }} />
                        </>
                      ) : (
                        <div style={{
                          position: 'absolute',
                          width: '40px',
                          height: '190px',
                          backgroundColor: '#f3f4f6',
                          border: '1px solid #e5e7eb',
                          boxSizing: 'border-box',
                          borderRadius: '8px'
                        }} />
                      )}

                      {/* Main Table Card */}
                      <div style={{
                        position: 'relative',
                        width: '135px',
                        height: '100px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '12px',
                        zIndex: 1
                      }}>
                        {/* Status Badge */}
                        <div style={{
                          backgroundColor: getStatusBg(table.status),
                          color: getStatusColor(table.status),
                          fontSize: '0.6875rem',
                          padding: '4px 12px',
                          borderRadius: '100px',
                          marginBottom: '8px',
                          fontWeight: 600,
                          textTransform: 'capitalize'
                        }}>
                          {table.status}
                        </div>
                        <h5 style={{ fontSize: '1rem', fontWeight: 700, margin: '2px 0 4px 0', color: '#111827' }}>{table.name}</h5>
                        <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: 0 }}>Capacity {table.capacity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

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
                {['Today', 'Tomorrow', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                  <button
                    key={day}
                    onClick={() => setActiveDay(day)}
                    style={{
                      padding: '10px 24px',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: 'none',
                      backgroundColor: activeDay === day ? '#EAF4EC' : 'transparent',
                      color: activeDay === day ? '#6B9E78' : '#6b7280',
                      transition: 'all 0.2s'
                    }}
                  >
                    {day}
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
                <span style={{ color: '#111827', fontSize: '1.25rem', fontWeight: 700 }}>27</span>
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
              <button style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><ChevronLeft size={24} /></button>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#111827' }}>Tuesday, 24 February 2026</h3>
              <button style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><ChevronRight size={24} /></button>
            </div>

            {/* Timeline Grid */}
            <div style={{ overflowX: 'auto', padding: '0 32px 32px 32px' }}>
              <div style={{
                minWidth: '1100px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                overflow: 'hidden'
              }}>
                {/* Time & Metrics Header Container */}
                <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
                  {/* Single Unified Sidebar Box Above Section Titles */}
                  <div style={{ 
                    width: '160px', 
                    borderRight: '1px solid #e5e7eb',
                    backgroundColor: '#f9fafb'
                  }} />

                  {/* Right Side Header Area (Time + Metrics) */}
                  <div style={{ flex: 1, backgroundColor: '#ffffff' }}>
                    {/* Time Slots (Row 1) */}
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

                    {/* Metrics (Row 2) */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(17, 1fr)', position: 'relative' }}>

                      {calendarGridMetrics.map((val, idx) => (
                        <div key={idx} style={{ 
                          textAlign: 'center',
                          padding: '12px 0',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#4A9E6B',
                          borderRight: '1px solid #e5e7eb',
                          position: 'relative',
                          zIndex: 1
                        }}>
                          {val}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Grid Content */}
                {tableViewSections.map(section => (
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
                        {/* Two-column Sidebar (ID and Capacity) */}
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
                          }}>{table.id}</div>
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

                          {/* Vertical Column Divider Lines */}
                          {Array.from({ length: 16 }).map((_, i) => (
                            <div key={i} style={{ 
                              gridColumnStart: i + 2, 
                              borderLeft: '1px solid rgba(229, 231, 235, 0.6)',
                              height: '100%',
                              pointerEvents: 'none',
                              zIndex: 1
                            }} />
                          ))}
                          
                          {/* Bookings */}
                          {calendarBookings
                            .filter(booking => String(booking.tableId) === String(table.id))
                            .map(booking => {
                              const startTotalMin = parseInt(booking.start.split(':')[0]) * 60 + parseInt(booking.start.split(':')[1])
                              const baseTotalMin = 13 * 60
                              const startCol = ((startTotalMin - baseTotalMin) / 15) + 1
                              const endTotalMin = parseInt(booking.end.split(':')[0]) * 60 + parseInt(booking.end.split(':')[1])
                              const endCol = ((endTotalMin - baseTotalMin) / 15) + 1
                              
                              if (startCol < 1 || startCol > 17) return null;

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
                                    {booking.guests}
                                  </div>
                                  <span style={{ 
                                    fontSize: '0.8125rem', 
                                    fontWeight: 600, 
                                    whiteSpace: 'nowrap', 
                                    overflow: 'hidden', 
                                    textOverflow: 'ellipsis',
                                    color: '#ffffff'
                                  }}>
                                    {booking.name}
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
          </div>
        )}
      </div>
    </div>
  )
}
