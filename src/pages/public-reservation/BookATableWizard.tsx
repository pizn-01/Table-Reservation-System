import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DarkProgressBar from '../../components/DarkProgressBar'
import UserStepDateTime from '../user-reservation/UserStepDateTime'
import UserStepTableSelect from '../user-reservation/UserStepTableSelect'
import UserStepContactInfo from '../user-reservation/UserStepContactInfo'
import UserStepConfirmReview from '../user-reservation/UserStepConfirmReview'
import api, { ApiError } from '../../lib/api'

export interface ReservationData {
  date: string
  time: string
  guests: number
  tableId: string | null
  tableName: string
  tableCapacity: number
  tableLocation: string
  firstName: string
  lastName: string
  email: string
  phone: string
  specialRequest: string
  paymentMethod: string | null
}

const initialData: ReservationData = {
  date: new Date().toISOString().split('T')[0],
  time: '',
  guests: 2,
  tableId: null,
  tableName: '',
  tableCapacity: 0,
  tableLocation: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  specialRequest: '',
  paymentMethod: null,
}

const TOTAL_STEPS = 4

export default function BookATableWizard() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [data, setData] = useState<ReservationData>(initialData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // TODO: Make this configurable via URL param or env variable
  const restaurantSlug = 'default'

  const updateData = (updates: Partial<ReservationData>) => {
    setData((prev) => ({ ...prev, ...updates }))
  }

  const nextStep = async () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1)
    } else {
      // Final step — submit reservation to backend
      setIsSubmitting(true)
      setSubmitError('')

      try {
        // Parse date — native picker gives YYYY-MM-DD, legacy gives DD/MM/YYYY
        const reservationDate = data.date.includes('/') 
          ? (() => { const p = data.date.split('/'); return `${p[2]}-${p[1]}-${p[0]}`; })()
          : data.date

        // Calculate end time (90 min default duration)
        const [hours, mins] = data.time.split(':').map(Number)
        const endDate = new Date(2000, 0, 1, hours, mins + 90)
        const endTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`

        const payload = {
          tableId: data.tableId || undefined,
          reservationDate,
          startTime: data.time,
          endTime,
          partySize: data.guests,
          guestFirstName: data.firstName,
          guestLastName: data.lastName || undefined,
          guestEmail: data.email,
          guestPhone: data.phone || undefined,
          specialRequests: data.specialRequest || undefined,
        }

        const result = await api.post(`/public/${restaurantSlug}/reserve`, payload, { skipAuth: true })
        navigate('/public-booking-confirmed', { state: { ...data, reservationId: result.data } })
      } catch (err) {
        if (err instanceof ApiError) {
          setSubmitError(err.message)
        } else {
          setSubmitError('Failed to confirm reservation. Please try again.')
        }
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    } else {
      navigate('/')
    }
  }

  const percentage = Math.round((currentStep / TOTAL_STEPS) * 100)

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <UserStepDateTime data={data} updateData={updateData} />
      case 2:
        return <UserStepTableSelect data={data} updateData={updateData} />
      case 3:
        return <UserStepContactInfo data={data} updateData={updateData} />
      case 4:
        return <UserStepConfirmReview data={data} onEdit={(step: number) => setCurrentStep(step)} />
      default:
        return null
    }
  }

  const getNextLabel = () => {
    switch (currentStep) {
      case 3: return 'Review Booking'
      case 4: return 'Confirm Reservation'
      default: return 'Next'
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0B1517', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', paddingTop: '40px', paddingBottom: '24px', paddingLeft: '16px', paddingRight: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '9999px', backgroundColor: 'rgba(94, 139, 106, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: '#6B9E78' }}>
              <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
              <line x1="6" y1="17" x2="18" y2="17" />
            </svg>
          </div>
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>Table Reservation</h1>
        <p style={{ color: '#8b949e', fontSize: '0.875rem', marginTop: '4px' }}>
          Book your perfect dining experience in just a few steps.
        </p>
      </div>

      {/* Main Container */}
      <div className="res-wizard-container" style={{ width: '100%', maxWidth: '896px', margin: '0 auto', display: 'flex', flexDirection: 'column', flex: 1, padding: '0 32px' }}>
        {/* Progress Bar */}
        <div style={{ marginBottom: '0' }}>
          <DarkProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} percentage={percentage} />
        </div>

        {/* Step Content */}
        <div style={{ flex: 1, paddingBottom: '16px', paddingTop: '8px' }}>
          <div className="animate-fade-in res-wizard-step-content" style={{ 
            backgroundColor: '#101A1C', 
            border: '1px solid #30363d', 
            borderRadius: '16px', 
            padding: '40px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
          }}>
            {submitError && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '10px 16px',
                marginBottom: '16px',
                color: '#ef4444',
                fontSize: '0.8125rem',
              }}>
                {submitError}
              </div>
            )}
            {renderStep()}
          </div>
        </div>

        {/* Navigation */}
        <div style={{ padding: '24px 0', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              onClick={prevStep}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                border: '1px solid #30363d',
                backgroundColor: 'transparent',
                color: '#ffffff',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.2)'
              }}
            >
              Back
            </button>

            {/* Step dots */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    borderRadius: '9999px',
                    transition: 'all 0.3s ease',
                    width: i + 1 === currentStep ? '24px' : '8px',
                    height: '8px',
                    backgroundColor: i + 1 === currentStep ? '#6B9E78' : i + 1 < currentStep ? '#6B9E78' : '#30363d'
                  }}
                />
              ))}
            </div>

            <button
              onClick={nextStep}
              disabled={isSubmitting}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 600,
                border: 'none',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                backgroundColor: isSubmitting ? '#8b7650' : '#C99C63',
                color: '#ffffff',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.2)',
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? 'Submitting...' : getNextLabel()}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
