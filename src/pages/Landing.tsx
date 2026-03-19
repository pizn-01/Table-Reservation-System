import { useNavigate } from 'react-router-dom'
import { Calendar, Clock } from 'lucide-react'
import Navbar from '../components/Navbar'
import { useState, useRef, useEffect } from 'react'
import api from '../lib/api'

import heroBg from '../assets/mask-group.png'

export default function Landing() {
  const navigate = useNavigate()
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [time, setTime] = useState('17:00')
  const [guests, setGuests] = useState('2')
  const dateRef = useRef<HTMLInputElement>(null)
  const timeRef = useRef<HTMLInputElement>(null)
  
  const [restaurantName, setRestaurantName] = useState('Welcome')
  const [description, setDescription] = useState('Experience authentic italian cuisine\nin an elegant atmosphere')

  useEffect(() => {
    // We fetch the first org or public default slug (e.g. 'blackstone' matching the logo)
    const fetchOrg = async () => {
      try {
        const res = await api.get<{ data: { name: string, description: string } }>('/public/blackstone/info')
        if (res.data?.data) {
          if (res.data.data.name) setRestaurantName(`Welcome to ${res.data.data.name}`)
          if (res.data.data.description) setDescription(res.data.data.description)
        }
      } catch (err) {
        // Fallback or ignore if slug not setup / table empty
      }
    }
    fetchOrg()
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar with solid dark background */}
      <div style={{ backgroundColor: '#0B1517' }}>
        <Navbar variant="public" />
      </div>

      {/* Hero Section with background image */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Background Image Overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.4)), url(${heroBg})`,
          }}
        />

        {/* Content */}
        <div
          className="res-hero-content-row"
          style={{
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            alignItems: 'stretch',
            padding: '0 64px',
            maxWidth: '1400px',
            margin: '0 auto',
            width: '100%',
            minHeight: 'calc(100vh - 72px)',
          }}
        >
          {/* Left Content — aligned toward bottom */}
          <div
            className="animate-fade-in res-hero-left"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <div>
              <h1
                className="res-hero-title"
                style={{
                  fontSize: '4.5rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  lineHeight: 1.1,
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {restaurantName}
              </h1>
              <p
                style={{
                  fontSize: '1.125rem',
                  color: '#d1d5db',
                  marginTop: '16px',
                  maxWidth: '28rem',
                  lineHeight: 1.6,
                  fontFamily: 'var(--font-sans)',
                  whiteSpace: 'pre-line' // respects \n in default string
                }}
              >
                {description}
              </p>
            </div>
          </div>

          {/* Right Reservation Card — vertically centered */}
          <div className="res-hero-card-wrapper" style={{ display: 'flex', alignItems: 'center' }}>
            <div
              className="animate-slide-up res-hero-card"
              style={{
                width: '430px',
                height: '430px',
                padding: '32px',
                animationDelay: '0.2s',
                backgroundColor: '#101A1C',
                border: '1px solid #30363d',
                borderRadius: '12px',
              }}
            >
              <h2
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  marginBottom: '24px',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Reserve your table
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      color: '#ffffff',
                      marginBottom: '6px',
                    }}
                  >
                    Date
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      ref={dateRef}
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="input-dark"
                      style={{ paddingRight: '40px', colorScheme: 'dark' }}
                    />
                    <Calendar
                      size={14}
                      onClick={() => dateRef.current?.showPicker()}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#8b949e',
                        cursor: 'pointer',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: '#ffffff',
                      marginBottom: '8px',
                    }}
                  >
                    Preferred Time
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      ref={timeRef}
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="input-dark"
                      style={{ paddingRight: '40px', colorScheme: 'dark' }}
                    />
                    <Clock
                      size={14}
                      onClick={() => timeRef.current?.showPicker()}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#8b949e',
                        cursor: 'pointer',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: '#ffffff',
                      marginBottom: '8px',
                    }}
                  >
                    No of Guests
                  </label>
                  <input
                    type="text"
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                    className="input-dark"
                  />
                </div>

                <button
                  onClick={() => navigate('/book-a-table')}
                  className="btn-gold"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '0.9rem',
                    marginTop: '6px',
                  }}
                >
                  Book Table
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
