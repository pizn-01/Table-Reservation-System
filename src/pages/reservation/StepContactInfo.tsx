import type { ReservationData } from './ReservationWizard'

interface StepContactInfoProps {
  data: ReservationData
  updateData: (updates: Partial<ReservationData>) => void
}

export default function StepContactInfo({ data, updateData }: StepContactInfoProps) {
  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '4px', fontFamily: 'var(--font-sans)', marginTop: 0 }}>
        Contact Information
      </h2>
      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '24px', fontFamily: 'var(--font-sans)', marginTop: 0 }}>
        Please provide your details for the reservation
      </p>

      <div className="res-contact-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: '24px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827', marginBottom: '8px', fontFamily: 'var(--font-sans)' }}>
            First Name
          </label>
          <input
            type="text"
            value={data.firstName}
            onChange={(e) => updateData({ firstName: e.target.value })}
            placeholder="John"
            style={{ 
              width: '100%', 
              boxSizing: 'border-box',
              backgroundColor: '#ffffff',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              padding: '12px 16px',
              color: '#111827',
              fontSize: '1rem',
              fontFamily: 'var(--font-sans)'
            }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827', marginBottom: '8px', fontFamily: 'var(--font-sans)' }}>
            Last Name
          </label>
          <input
            type="text"
            value={data.lastName}
            onChange={(e) => updateData({ lastName: e.target.value })}
            placeholder="Doe"
            style={{ 
              width: '100%', 
              boxSizing: 'border-box',
              backgroundColor: '#ffffff',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              padding: '12px 16px',
              color: '#111827',
              fontSize: '1rem',
              fontFamily: 'var(--font-sans)'
            }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827', marginBottom: '8px', fontFamily: 'var(--font-sans)' }}>
            Email
          </label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => updateData({ email: e.target.value })}
            placeholder="johndoe@example.com"
            style={{ 
              width: '100%', 
              boxSizing: 'border-box',
              backgroundColor: '#ffffff',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              padding: '12px 16px',
              color: '#111827',
              fontSize: '1rem',
              fontFamily: 'var(--font-sans)'
            }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827', marginBottom: '8px', fontFamily: 'var(--font-sans)' }}>
            Phone Number
          </label>
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => updateData({ phone: e.target.value })}
            placeholder="+1 (555) 000-000"
            style={{ 
              width: '100%', 
              boxSizing: 'border-box',
              backgroundColor: '#ffffff',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              padding: '12px 16px',
              color: '#111827',
              fontSize: '1rem',
              fontFamily: 'var(--font-sans)'
            }}
          />
        </div>
      </div>

      <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column' }}>
        <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827', marginBottom: '8px', fontFamily: 'var(--font-sans)' }}>
          Special Request
        </label>
        <textarea
          value={data.specialRequest}
          onChange={(e) => updateData({ specialRequest: e.target.value })}
          placeholder="Lorem ipsum is simply dummy text"
          rows={5}
          style={{ 
            width: '100%', 
            boxSizing: 'border-box', 
            resize: 'none',
            backgroundColor: '#ffffff',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            padding: '12px 16px',
            color: '#111827',
            fontSize: '1rem',
            fontFamily: 'var(--font-sans)'
          }}
        />
      </div>
    </div>
  )
}
