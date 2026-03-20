import { useState, useEffect, useRef, useMemo } from 'react'
import { Calendar, Info, Minus, Plus, ChefHat, Users, MapPin, Lock, Pencil, Clock, User, Mail, Phone } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api, { ApiError } from '../lib/api'

export default function PremiumReservation() {
  const navigate = useNavigate()
  const { restaurant } = useAuth()
  const orgId = restaurant?.id
  const [step, setStep] = useState(1);
  const [guests, setGuests] = useState(2)
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [contactInfo, setContactInfo] = useState({ firstName: '', lastName: '', email: '', phone: '', specialRequest: '' })
  const [dateVal, setDateVal] = useState(new Date().toISOString().split('T')[0])

  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null)
  const [bookedSlots, setBookedSlots] = useState<string[]>([])
  const [availableTables, setAvailableTables] = useState<Array<{
    id: string
    name: string
    capacity: number
    location: string
    type: string
    price: number
  }>>([])
  const dateRef = useRef<HTMLInputElement>(null)

  const SLOT_TIMES = ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30']

  // Fetch availability when date or guest count changes
  useEffect(() => {
    if (!orgId || !dateVal) return
    const fetchAvailability = async () => {
      try {
        const isoDate = dateVal.includes('/') 
          ? (() => { const p = dateVal.split('/'); return `${p[2]}-${p[1]}-${p[0]}`; })()
          : dateVal
        const conflicted: string[] = []
        await Promise.all(
          SLOT_TIMES.map(async (slot) => {
            try {
              const avail = await api.get<any[]>(
                `/organizations/${orgId}/tables/availability?date=${isoDate}&time=${slot}&partySize=${guests}`
              )
              if (avail.data && avail.data.length === 0) conflicted.push(slot)
            } catch { /* don't block */ }
          })
        )
        setBookedSlots(conflicted)
      } catch { setBookedSlots([]) }
    }
    fetchAvailability()
  }, [orgId, dateVal, guests])

  const timeSlots = SLOT_TIMES.map(t => ({
    time: t,
    status: bookedSlots.includes(t) ? 'booked' as const : 'available' as const,
  }))

  const predefinedGuests = [2, 4, 6, 8]

  useEffect(() => {
    if (!orgId || !dateVal || !selectedTime || step < 2) return
    const fetchTablesForSlot = async () => {
      try {
        const isoDate = dateVal.includes('/')
          ? (() => { const p = dateVal.split('/'); return `${p[2]}-${p[1]}-${p[0]}`; })()
          : dateVal
        const avail = await api.get<any[]>(
          `/organizations/${orgId}/tables/availability?date=${isoDate}&time=${selectedTime}&partySize=${guests}`
        )
        const mapped = (avail.data || []).map((t: any) => ({
          id: String(t.id),
          name: t.name || `Table ${t.tableNumber}`,
          capacity: t.capacity || guests,
          location: t.area?.name || 'Main Dining',
          type: t.type || 'Standard',
          price: 0,
        }))
        setAvailableTables(mapped)
        if (selectedTable && !mapped.some((t: any) => t.id === selectedTable)) {
          setSelectedTable(null)
        }
      } catch {
        setAvailableTables([])
      }
    }
    fetchTablesForSlot()
  }, [orgId, dateVal, selectedTime, guests, step, selectedTable])

  const tables = useMemo(() => {
    const grouped: Record<string, typeof availableTables> = {}
    for (const table of availableTables) {
      const key = table.location || 'Main Dining'
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(table)
    }
    return grouped
  }, [availableTables])

  const handleNext = async () => {
    setSubmitError('')

    if (step === 1) {
      if (!selectedTime || !dateVal) {
        setSubmitError('Please select a date and time')
        return
      }
    }
    if (step === 2) {
      if (!selectedTable) {
        setSubmitError('Please select a table')
        return
      }
    }
    if (step === 4) {
      if (!contactInfo.firstName.trim() || !contactInfo.email.trim() || !contactInfo.phone.trim()) {
        setSubmitError('Please provide your First Name, Email, and Phone Number')
        return
      }
    }

    if (step < 5) {
      setStep(step + 1)
    } else if (step === 5) {
      if (!orgId) { setSubmitError('No restaurant found.'); return }
      setIsSubmitting(true)
      setSubmitError('')
      try {
        const dateParts = dateVal.includes('/') ? dateVal.split('/') : null
        const reservationDate = dateParts ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}` : dateVal
        const [h, m] = (selectedTime || '17:00').split(':').map(Number)
        const end = new Date(2000, 0, 1, h, m + 90)
        const endTime = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`
        const selectedTableObj = Object.values(tables).flat().find(t => t.id === selectedTable)

        const payload = {
          tableId: selectedTable || undefined,
          reservationDate,
          startTime: selectedTime || '17:00',
          endTime,
          partySize: guests,
          guestFirstName: contactInfo.firstName,
          guestLastName: contactInfo.lastName || undefined,
          guestEmail: contactInfo.email,
          guestPhone: contactInfo.phone || undefined,
          specialRequests: contactInfo.specialRequest || undefined,
        }
        const result = await api.post(`/organizations/${orgId}/reservations`, payload)
        navigate('/premium-booking-confirmed', {
          state: { selectedTime, guests, tableName: selectedTableObj?.name, reservationId: result.data }
        })
      } catch (err) {
        setSubmitError(err instanceof ApiError ? err.message : 'Failed to create reservation.')
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
    else navigate(-1)
  }

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'Premium':
      case 'VIP':
      case 'Exclusive':
        return {
          bg: 'rgba(45, 122, 138, 0.15)',
          color: '#38bdf8'
        }
      default:
        return null
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0B1517',
      color: '#ffffff',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '40px 20px'
    }}>
      <style>{`
        input::placeholder, textarea::placeholder {
          color: rgba(255, 255, 255, 0.4) !important;
          opacity: 1 !important;
        }
      `}</style>
      {/* Header Area */}
      <div style={{ textAlign: 'center', marginBottom: '40px', maxWidth: '800px', width: '100%' }}>
        <div style={{ 
          width: '64px', 
          height: '64px', 
          backgroundColor: 'rgba(255, 255, 255, 0.05)', 
          borderRadius: '50%', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          margin: '0 auto 24px',
          color: '#8b949e'
        }}>
          <ChefHat size={32} />
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 16px 0' }}>Table Reservation</h1>
        <p style={{ fontSize: '1.125rem', color: '#8b949e', margin: 0 }}>Book your perfect dining experience in just a few steps.</p>
      </div>

      {/* Main Content Box */}
      <div style={{ maxWidth: '1000px', width: '100%' }}>
        
        {/* Progress Bar */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ffffff', fontSize: '0.875rem', marginBottom: '12px' }}>
            <span>Step {step > 4 ? 4 : step} of 4</span>
            <span style={{ fontSize: '0.875rem' }}>
              {step === 1 ? '16% Complete' : step === 2 ? '50% Complete' : step === 3 ? '66% Complete' : step === 4 ? '82% Complete' : '100% Complete'}
            </span>
          </div>
          <div style={{ width: '100%', height: '8px', backgroundColor: '#1A2325', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ 
              width: step === 1 ? '16%' : step === 2 ? '50%' : step === 3 ? '66%' : step === 4 ? '82%' : '100%', 
              height: '100%', 
              backgroundColor: '#4a9e6b', 
              borderRadius: '4px',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {/* Inner Card */}
        <div style={{
          backgroundColor: '#101A1C',
          borderRadius: '16px',
          padding: '40px',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          
          {/* STEP 1 CONTENT */}
          {step === 1 && (
            <>
              {/* Section 1: When would you like to dine? */}
              <div style={{ marginBottom: '48px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: '0 0 24px 0' }}>When would you like to dine?</h2>
                
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '8px' }}>Date</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      ref={dateRef}
                      type="date" 
                      value={dateVal}
                      onChange={(e) => setDateVal(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '16px',
                        paddingRight: '48px',
                        backgroundColor: 'transparent',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '1rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                        colorScheme: 'dark'
                      }} 
                    />
                    <Calendar 
                      size={20} 
                      onClick={() => dateRef.current?.showPicker()}
                      style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#8b949e', cursor: 'pointer' }} 
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '16px' }}>Preferred Time</label>
                  <div className="res-prem-time-grid" style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(5, 1fr)', 
                    gap: '12px',
                    position: 'relative'
                  }}>
                    {timeSlots.map((slot, index) => (
                      <div key={index} style={{ position: 'relative' }}>
                        <button 
                          onClick={() => slot.status !== 'booked' && setSelectedTime(slot.time)}
                          onMouseEnter={() => slot.status === 'booked' && setHoveredSlot(slot.time)}
                          onMouseLeave={() => setHoveredSlot(null)}
                          style={{
                            width: '100%',
                            padding: '12px 0',
                            backgroundColor: selectedTime === slot.time ? 'rgba(201, 156, 99, 0.1)' : 'transparent',
                            border: slot.status === 'booked' 
                              ? '1px solid #d73a49' 
                              : selectedTime === slot.time 
                                ? '1px solid #C99C63' 
                                : '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            color: slot.status === 'booked' 
                              ? '#d73a49' 
                              : selectedTime === slot.time 
                                ? '#C99C63' 
                                : '#ffffff',
                            fontSize: '1rem',
                            cursor: slot.status === 'booked' ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {slot.status === 'booked' && <Info size={16} />}
                          {slot.time}
                        </button>
                        
                        {/* Tooltip for booked slot */}
                        {slot.status === 'booked' && hoveredSlot === slot.time && (
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            marginTop: '12px',
                            backgroundColor: '#C99C63',
                            color: '#ffffff',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            whiteSpace: 'nowrap',
                            zIndex: 10,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                          }}>
                            <div style={{
                              position: 'absolute',
                              top: '-6px',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              borderLeft: '6px solid transparent',
                              borderRight: '6px solid transparent',
                              borderBottom: '6px solid #C99C63'
                            }} />
                            This time slot has just been<br/>booked by another guest.
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section 2: How many people will be dining? */}
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: '0 0 32px 0' }}>How many people will be dining?</h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ color: '#8b949e', marginBottom: '24px' }}>
                    <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                    <button 
                      onClick={() => setGuests(Math.max(1, guests - 1))}
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: '#4a9e6b',
                        border: 'none',
                        color: '#ffffff',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <Minus size={20} />
                    </button>
                    <div style={{
                      width: '160px',
                      height: '48px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center', // added to center the number
                      fontSize: '1rem',
                      color: '#ffffff',
                      boxSizing: 'border-box'
                    }}>
                      {guests}
                    </div>
                    <button 
                      onClick={() => setGuests(guests + 1)}
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: '#4a9e6b',
                        border: 'none',
                        color: '#ffffff',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <Plus size={20} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '16px' }}>
                    {predefinedGuests.map(num => (
                      <button 
                        key={num}
                        onClick={() => setGuests(num)}
                        style={{
                          width: '80px',
                          padding: '12px 0',
                          backgroundColor: guests === num ? '#4a9e6b' : 'transparent',
                          border: guests === num ? '1px solid #4a9e6b' : '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          color: '#ffffff',
                          fontSize: '1rem',
                          cursor: 'pointer'
                        }}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* STEP 2 CONTENT */}
          {step === 2 && (
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: '0 0 8px 0' }}>Choose Your Table</h2>
              <p style={{ fontSize: '1rem', color: '#8b949e', margin: '0 0 40px 0' }}>Select from our available tables</p>
              {Object.keys(tables).length === 0 && (
                <p style={{ color: '#d1d5db', marginBottom: '24px' }}>
                  No tables available for this time. Please pick a different slot.
                </p>
              )}

              {/* Render Categories */}
              {Object.entries(tables).map(([category, categoryTables], index) => (
                <div key={category} style={{ marginBottom: index === 2 ? 0 : '40px' }}>
                  {/* Category Divider */}
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
                    <span style={{ 
                      padding: '0 16px', 
                      color: '#C99C63', 
                      fontWeight: 500,
                      textTransform: 'capitalize' 
                    }}>
                      {category.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
                  </div>

                  {/* Table Grid */}
                  <div className="res-prem-table-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    {categoryTables.map(table => {
                      const badgeStyle = getBadgeStyle(table.type)
                      
                      return (
                        <div 
                          key={table.id} 
                          onClick={() => setSelectedTable(table.id)}
                          style={{
                            border: selectedTable === table.id ? '1px solid #C99C63' : '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                            padding: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '20px',
                            cursor: 'pointer',
                            backgroundColor: selectedTable === table.id ? 'rgba(201, 156, 99, 0.05)' : 'transparent',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            if (selectedTable !== table.id) {
                              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedTable !== table.id) {
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }
                          }}
                        >
                          {/* Table Icon */}
                          <div style={{
                            width: '64px',
                            height: '64px',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '50%',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            flexShrink: 0
                          }}>
                            <img 
                              src="/table.svg" 
                              alt="Table" 
                              style={{ width: '32px', height: '32px', filter: 'brightness(0) invert(1)' }} 
                            />
                          </div>

                          {/* Table Details */}
                          <div style={{ flex: 1 }}>
                            <div className="res-prem-table-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>{table.name}</h3>
                              {badgeStyle && (
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  backgroundColor: badgeStyle.bg,
                                  color: badgeStyle.color,
                                  padding: '4px 10px',
                                  borderRadius: '20px',
                                  fontSize: '0.75rem',
                                  fontWeight: 500
                                }}>
                                  <Lock size={12} />
                                  <span>{table.type} :${table.price}</span>
                                </div>
                              )}
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', color: '#8b949e', fontSize: '0.875rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Users size={16} />
                                <span>Capacity: {table.capacity} seats</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <MapPin size={16} />
                                <span>{table.location}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STEP 3 CONTENT */}
          {step === 3 && (
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: '0 0 8px 0' }}>Contact Information</h2>
              <p style={{ fontSize: '1rem', color: '#8b949e', margin: '0 0 40px 0' }}>Please provide your details for the reservation</p>

              <div className="res-prem-contact-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '8px' }}>First Name</label>
                  <input 
                    type="text"
                    placeholder="John"
                    value={contactInfo.firstName}
                    onChange={(e) => setContactInfo({ ...contactInfo, firstName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '16px',
                      backgroundColor: 'transparent',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '1rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '8px' }}>Last Name</label>
                  <input 
                    type="text"
                    placeholder="Doe"
                    value={contactInfo.lastName}
                    onChange={(e) => setContactInfo({ ...contactInfo, lastName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '16px',
                      backgroundColor: 'transparent',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '1rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '8px' }}>Email</label>
                  <input 
                    type="email"
                    placeholder="johndoe@example.com"
                    value={contactInfo.email}
                    onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '16px',
                      backgroundColor: 'transparent',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '1rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '8px' }}>Phone Number</label>
                  <input 
                    type="tel"
                    placeholder="+1 (555) 000-000"
                    value={contactInfo.phone}
                    onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '16px',
                      backgroundColor: 'transparent',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '1rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }} 
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '8px' }}>Special Request</label>
                <textarea 
                  placeholder="Any special requests or dietary requirements..."
                  value={contactInfo.specialRequest}
                  onChange={(e) => setContactInfo({ ...contactInfo, specialRequest: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '16px',
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '1rem',
                    outline: 'none',
                    minHeight: '160px',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }} 
                />
              </div>
            </div>
          )}

          {/* STEP 4 CONTENT */}
          {step === 4 && (
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: '0 0 8px 0' }}>Confirm Your Reservation</h2>
              <p style={{ fontSize: '1rem', color: '#8b949e', margin: '0 0 40px 0' }}>Please review your booking details</p>

              <div className="res-prem-review-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '24px' }}>
                {/* Table Card */}
                <div style={{
                  backgroundColor: '#161F21',
                  borderRadius: '12px',
                  padding: '24px',
                  position: 'relative'
                }}>
                  <div style={{ position: 'absolute', top: '24px', right: '24px', color: '#8b949e', cursor: 'pointer' }}>
                    <Pencil size={20} />
                  </div>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '50%',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      flexShrink: 0
                    }}>
                      <img src="/table.svg" alt="Table" style={{ width: '24px', height: '24px', filter: 'brightness(0) invert(1)' }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 8px 0' }}>Table</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <span style={{ fontSize: '0.875rem' }}>
                          {Object.values(tables).flat().find(t => t.id === selectedTable)?.name || 'Not selected'}
                        </span>
                        {Object.values(tables).flat().find(t => t.id === selectedTable) && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: 'rgba(45, 122, 138, 0.15)',
                            color: '#38bdf8',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: 500
                          }}>
                            <Lock size={12} />
                            <span>
                              {Object.values(tables).flat().find(t => t.id === selectedTable)?.type} :
                              ${Object.values(tables).flat().find(t => t.id === selectedTable)?.price}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="res-prem-details-row" style={{ display: 'flex', alignItems: 'center', gap: '24px', color: '#cfcfcf', fontSize: '0.875rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Users size={16} />
                          <span>Capacity: {Object.values(tables).flat().find(t => t.id === selectedTable)?.capacity || 0} seats</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <MapPin size={16} />
                          <span>{Object.values(tables).flat().find(t => t.id === selectedTable)?.location || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Party Size Card */}
                <div style={{
                  backgroundColor: '#161F21',
                  borderRadius: '12px',
                  padding: '24px',
                  position: 'relative'
                }}>
                  <div style={{ position: 'absolute', top: '24px', right: '24px', color: '#8b949e', cursor: 'pointer' }}>
                    <Pencil size={20} />
                  </div>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '50%',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      flexShrink: 0
                    }}>
                      <Users size={24} style={{ color: '#ffffff' }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 8px 0' }}>Party size</h3>
                      <span style={{ fontSize: '0.875rem' }}>{guests} Guests</span>
                    </div>
                  </div>
                </div>

                <div style={{
                  backgroundColor: '#161F21',
                  borderRadius: '12px',
                  padding: '20px 24px',
                  position: 'relative'
                }}>
                  <div style={{ position: 'absolute', top: '24px', right: '24px', color: '#8b949e', cursor: 'pointer' }}>
                    <Pencil size={20} />
                  </div>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '50%',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      flexShrink: 0
                    }}>
                      <Calendar size={24} style={{ color: '#ffffff' }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 8px 0' }}>Date & Time</h3>
                      <div className="res-prem-details-row" style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.875rem' }}>
                        <span>{new Date(`${dateVal}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={16} />
                          <span>{selectedTime || 'Not selected'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Information Card */}
                <div style={{
                  backgroundColor: '#161F21',
                  borderRadius: '12px',
                  padding: '20px 24px',
                  position: 'relative'
                }}>
                  <div style={{ position: 'absolute', top: '24px', right: '24px', color: '#8b949e', cursor: 'pointer' }}>
                    <Pencil size={20} />
                  </div>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '50%',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      flexShrink: 0
                    }}>
                      <User size={24} style={{ color: '#ffffff' }} />
                    </div>
                    <div style={{ width: '100%' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 12px 0' }}>Contact Information</h3>
                      <div className="res-prem-details-row" style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.875rem', marginBottom: '12px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Mail size={16} />
                          <span>{contactInfo.email || 'Not provided'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Phone size={16} />
                          <span>{contactInfo.phone || 'Not provided'}</span>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.875rem', margin: 0 }}>{contactInfo.specialRequest || 'No special request'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5 CONTENT (PAYMENT) */}
          {step === 5 && (
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: '0 0 8px 0' }}>Secure Your Reservation</h2>
              <p style={{ fontSize: '1rem', color: '#8b949e', margin: '0 0 40px 0' }}>Complete the payment to confirm your premium table booking.</p>

              <div className="res-prem-payment-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                
                {/* Left Column: Payment Methods */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <button style={{
                    backgroundColor: '#161F21',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '8px',
                    padding: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#ffffff',
                    fontSize: '1.25rem',
                    fontWeight: 600
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '8px' }}>
                      <path d="M16.59 13.78c-.28 1.4-1.38 2.51-3.15 3.07v-1.63c1.02-.38 1.7-1.14 1.83-2.07h-4V11.2h4.15v-.06c-.02-2.14 1.48-3.37 3.4-3.37.93 0 1.73.07 1.96.1v1.54h-1.34c-1.06 0-1.27.5-1.27 1.25v.54H20v1.94h-1.85c-.09 1.15-.36 1.77-.92 2.38z" display="none"/>
                      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09.105.15.22.285.342.41 1.01 1.056 2.196 2.053 3.414 2.053 1.14 0 1.814-.73 3.655-.73 1.838 0 2.454.73 3.672.73 1.266 0 2.332-.907 3.254-1.928.092-.102.18-.21.264-.32 1.163-1.69 1.638-3.328 1.666-3.414-.043-.016-3.21-1.229-3.235-4.908-.025-3.085 2.518-4.57 2.593-4.618-1.464-2.14-3.716-2.434-4.551-2.492-1.642-.142-3.272.99-4.103.99-1.296 0-2.583-.99-4.542-.99zm1.324-5.263c.961-.592 1.91-1.688 2.086-2.905.023-.162.035-.315.035-.453-1.085.044-2.415.722-3.205 1.512-.663.664-1.218 1.663-1.01 3.064-.002.016 1.144.137 2.094-.437z" />
                    </svg> Pay
                  </button>
                  <button style={{
                    backgroundColor: '#161F21',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '8px',
                    padding: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#ffffff',
                    fontSize: '1.25rem',
                    fontWeight: 500
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" style={{ marginRight: '8px' }}>
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg> Pay
                  </button>
                  <button style={{
                    backgroundColor: '#161F21',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '8px',
                    padding: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#ffffff',
                    fontSize: '1rem',
                    fontWeight: 600
                  }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 400, marginRight: '16px' }}>Pay with</span> 
                    <svg width="73" height="30" viewBox="0 0 73 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" clipRule="evenodd" d="M72.9266 17.3021H63.071C63.3034 19.6405 65.0275 20.3918 66.9839 20.3918C68.9893 20.3918 70.6034 19.9435 71.9362 19.2407V23.2633C70.2448 24.2277 68.3094 24.6903 66.3603 24.5961C61.457 24.5961 58.0087 21.567 58.0087 15.5331C58.0087 10.4564 60.9312 6.42165 65.7122 6.42165C70.5055 6.42165 73 10.3958 73 15.5089C73 15.9935 72.9511 17.0355 72.9266 17.3021ZM65.6878 10.4927C64.4283 10.4927 63.0343 11.3772 63.0343 13.6187H68.2312C68.2312 11.3772 66.9228 10.4927 65.6878 10.4927ZM50.0729 24.5961C48.3121 24.5961 47.236 23.8691 46.5268 23.336L46.5023 28.9459L41.4645 30V6.74879H46.0621L46.16 7.98465C47.2264 6.98238 48.6398 6.42304 50.1095 6.42165C53.6556 6.42165 56.9816 9.57189 56.9816 15.3877C56.9816 21.7246 53.6801 24.5961 50.0729 24.5961ZM48.9112 10.8441C47.7496 10.8441 47.0281 11.2561 46.5023 11.8255L46.5268 19.2407C47.0159 19.7738 47.7251 20.1858 48.9112 20.1858C50.7699 20.1858 52.0171 18.1866 52.0171 15.4968C52.0171 12.8918 50.7454 10.8441 48.9112 10.8441ZM34.5313 6.74879H39.5814V24.2447H34.5313V6.74879ZM34.5313 1.05412L39.5814 0V4.07108L34.5313 5.13732V1.06624V1.05412ZM29.2489 12.3829V24.2447H24.2111V6.74879H28.7353L28.8821 8.22698C30.1049 6.08239 32.636 6.51858 33.3085 6.74879V11.3409C32.6727 11.1349 30.5084 10.8199 29.2489 12.3829ZM18.7941 18.1018C18.7941 21.046 21.9734 20.1373 22.6092 19.8708V23.9418C21.9367 24.3053 20.7261 24.5961 19.0754 24.5961C18.3874 24.616 17.7025 24.497 17.0623 24.2463C16.4222 23.9957 15.8402 23.6186 15.3518 23.138C14.8634 22.6575 14.4788 22.0835 14.2213 21.451C13.9638 20.8185 13.8389 20.1407 13.8541 19.4588L13.8663 3.50162L18.7819 2.45961V6.74879H22.6214V11.0258H18.7941V18.1139V18.1018ZM12.7903 18.9499C12.7903 22.5485 9.96566 24.5961 5.78375 24.5961C3.90717 24.5947 2.05091 24.2112 0.330151 23.4693V18.7076C2.01759 19.6163 4.12077 20.2948 5.78375 20.2948C6.90871 20.2948 7.65461 20.004 7.65461 19.0832C7.65461 16.6842 0 17.5808 0 12.0557C0 8.52989 2.78794 6.42165 6.87203 6.42165C8.53501 6.42165 10.198 6.66397 11.8732 7.33037V12.0315C10.3251 11.2242 8.6088 10.7845 6.8598 10.7472C5.80821 10.7472 5.099 11.0501 5.099 11.8376C5.099 14.0792 12.7903 13.0129 12.7903 18.962V18.9499Z" fill="white"/>
                      <path d="M35.7196 29.8559V29.0562H36.0543V28.923H35.251V29.0562H35.5857V29.8559H35.7196ZM37.2594 29.8559V28.923H36.9916L36.7238 29.5893L36.456 28.923H36.1882V29.8559H36.3891V29.1229L36.6568 29.7226H36.8577L37.1255 29.1229V29.8559H37.2594Z" fill="#F79E1B"/>
                    </svg>
                  </button>

                  <div style={{ marginTop: '24px', color: '#8b949e', fontSize: '0.75rem', lineHeight: '1.6' }}>
                    <p style={{ margin: '0 0 8px 0' }}>All payments are securely processed through our trusted payment partners.</p>
                    <p style={{ margin: 0 }}>Your payment information is encrypted and never stored on our servers.</p>
                  </div>
                </div>

                {/* Right Column: Order Summary */}
                <div style={{
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '32px',
                  backgroundColor: 'transparent'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 500 }}>Date</span>
                      <span style={{ color: '#cfcfcf', fontSize: '0.875rem' }}>{new Date(`${dateVal}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 500 }}>Time</span>
                      <span style={{ color: '#cfcfcf', fontSize: '0.875rem' }}>{selectedTime || 'Not selected'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 500 }}>Guest</span>
                      <span style={{ color: '#cfcfcf', fontSize: '0.875rem' }}>{guests}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 500 }}>Table Type</span>
                      <span style={{ color: '#cfcfcf', fontSize: '0.875rem' }}>
                        {Object.values(tables).flat().find(t => t.id === selectedTable)?.name || 'Not selected'} ({Object.values(tables).flat().find(t => t.id === selectedTable)?.location || 'N/A'})
                      </span>
                    </div>

                    <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '8px 0' }}></div>

                    <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Charges</h3>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 500 }}>Table Deposit</span>
                      <span style={{ color: '#cfcfcf', fontSize: '0.875rem' }}>$20.00</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 500 }}>Service Fee</span>
                      <span style={{ color: '#cfcfcf', fontSize: '0.875rem' }}>$2.50</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600 }}>Total Payable Today</span>
                      <span style={{ color: '#cfcfcf', fontSize: '0.875rem' }}>$22.50</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation */}
        <div style={{ 
          marginTop: '32px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center'
        }}>
          <button 
            onClick={handleBack}
            style={{
              padding: '12px 32px',
              backgroundColor: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            Back
          </button>
          
          {/* Pagination Indicators */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {[1, 2, 3, 4].map(dot => (
              <div 
                key={dot} 
                style={{ 
                  width: (step === dot || (step === 5 && dot === 4)) ? '24px' : '6px', 
                  height: '6px', 
                  backgroundColor: (step === dot || (step === 5 && dot === 4)) ? '#C99C63' : 'rgba(255, 255, 255, 0.2)', 
                  borderRadius: (step === dot || (step === 5 && dot === 4)) ? '4px' : '50%',
                  transition: 'all 0.3s ease'
                }} 
              />
            ))}
          </div>

          <button 
            onClick={handleNext}
            style={{
              padding: '12px 32px',
              backgroundColor: '#C99C63',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {step === 5 ? (isSubmitting ? 'Processing...' : 'Pay And Confirm Reservation') : step === 4 ? 'Confirm Reservation' : step === 3 ? 'Review Booking' : 'Next'}
          </button>
        </div>

      </div>
    </div>
  )
}
