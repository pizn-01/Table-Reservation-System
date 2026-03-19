import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ProgressBar from '../../components/ProgressBar'
import StepDateTime from './StepDateTime'
import StepTableSelect from './StepTableSelect'
import StepContactInfo from './StepContactInfo'
import StepPayment from './StepPayment'
import StepConfirmReview from './StepConfirmReview'
import { useAuth } from '../../context/AuthContext'
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
  date: '18/02/2026',
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

export default function ReservationWizard() {
  const navigate = useNavigate()
  const { restaurant } = useAuth()
  const orgId = restaurant?.id
  const [currentStep, setCurrentStep] = useState(1)
  const [data, setData] = useState<ReservationData>(initialData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const updateData = (updates: Partial<ReservationData>) => {
    setData((prev) => ({ ...prev, ...updates }))
  }

  const nextStep = async () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1)
    } else {
      if (!orgId) { setSubmitError('No restaurant found.'); return }
      setIsSubmitting(true)
      setSubmitError('')
      try {
        const dateParts = data.date.split('/')
        const reservationDate = dateParts.length === 3 ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}` : data.date
        const [h, m] = data.time.split(':').map(Number)
        const end = new Date(2000, 0, 1, h, m + 90)
        const endTime = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`

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
        const result = await api.post(`/organizations/${orgId}/reservations`, payload)
        navigate('/booking-confirmed', { state: { ...data, reservationId: result.data } })
      } catch (err) {
        setSubmitError(err instanceof ApiError ? err.message : 'Failed to create reservation.')
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
        return <StepDateTime data={data} updateData={updateData} />
      case 2:
        return <StepTableSelect data={data} updateData={updateData} />
      case 3:
        return <StepContactInfo data={data} updateData={updateData} />
      case 4:
        return <StepConfirmReview data={data} onEdit={(step: number) => setCurrentStep(step)} />
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
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F9FA', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-sans)' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', paddingTop: '40px', paddingBottom: '24px', paddingLeft: '16px', paddingRight: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '9999px', backgroundColor: '#EAF4EC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: '#5E8B6A' }}>
              <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
              <line x1="6" y1="17" x2="18" y2="17" />
            </svg>
          </div>
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', margin: 0 }}>Table Reservation</h1>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '4px' }}>
          Book your perfect dining experience in just a few steps.
        </p>
      </div>

      {/* Main Container */}
      <div style={{ width: '100%', maxWidth: '896px', margin: '0 auto', display: 'flex', flexDirection: 'column', flex: 1, padding: '0 32px' }}>
        {/* Progress Bar inside the main container but outside the box if needed. The screenshot shows the progress bar above the dark card. */}
        <div style={{ marginBottom: '0' }}>
          <ProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} percentage={percentage} />
        </div>

        {/* Step Content */}
        <div style={{ flex: 1, paddingBottom: '16px', paddingTop: '8px' }}>
          <div className="animate-fade-in" style={{ 
            backgroundColor: '#ffffff', 
            border: '1px solid #e5e7eb', 
            borderRadius: '16px', 
            padding: '40px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
          }}>
            {submitError && (
              <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '10px 16px', marginBottom: '16px', color: '#ef4444', fontSize: '0.8125rem' }}>
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
                border: '1px solid #d1d5db',
                backgroundColor: '#ffffff',
                color: '#111827',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
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
                    backgroundColor: i + 1 === currentStep ? '#5E8B6A' : i + 1 < currentStep ? '#5E8B6A' : '#e5e7eb'
                  }}
                />
              ))}
            </div>

            <button
              onClick={nextStep}
              disabled={isSubmitting}
              className="btn-gold"
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 600,
                border: 'none',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                backgroundColor: isSubmitting ? '#8b7650' : '#C99C63',
                color: '#ffffff',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
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
