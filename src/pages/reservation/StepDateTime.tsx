import { useState, useEffect } from 'react'
import { Calendar, AlertCircle } from 'lucide-react'
import TimeSlotPicker from '../../components/TimeSlotPicker'
import GuestCounter from '../../components/GuestCounter'
import WaitingListModal from '../../components/WaitingListModal'
import { useAuth } from '../../context/AuthContext'
import api from '../../lib/api'
import type { ReservationData } from './ReservationWizard'

interface StepDateTimeProps {
  data: ReservationData
  updateData: (updates: Partial<ReservationData>) => void
}

const TIME_SLOTS = [
  '17:00', '17:30', '18:00', '18:30', '19:00',
  '19:30', '20:00', '20:30', '21:00', '21:30',
]

export default function StepDateTime({ data, updateData }: StepDateTimeProps) {
  const { restaurant } = useAuth()
  const orgId = restaurant?.id
  const [showWaitingList, setShowWaitingList] = useState(false)
  const [conflictSlots, setConflictSlots] = useState<string[]>([])

  // Fetch booked slots whenever date or guest count changes
  useEffect(() => {
    if (!orgId || !data.date) return
    const fetchConflicts = async () => {
      try {
        const dateParts = data.date.split('/')
        const isoDate = dateParts.length === 3 ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}` : data.date
        const res = await api.get<any[]>(`/organizations/${orgId}/reservations?date=${isoDate}`)
        const bookings = res.data || []

        // A slot is "conflicted" if it overlaps with an existing booking and ALL tables
        // of sufficient capacity are occupied during that window
        const booked: string[] = []
        for (const slot of TIME_SLOTS) {
          const [sh, sm] = slot.split(':').map(Number)
          const slotStart = sh * 60 + sm
          const slotEnd = slotStart + 30 // 30-min slot window

          const overlapping = bookings.filter((b: any) => {
            const startTime = (b.start_time || b.startTime || '').slice(0, 5)
            const endTime = (b.end_time || b.endTime || '').slice(0, 5)
            if (!startTime || !endTime) return false
            const [bsh, bsm] = startTime.split(':').map(Number)
            const [beh, bem] = endTime.split(':').map(Number)
            const bStart = bsh * 60 + bsm
            const bEnd = beh * 60 + bem
            return slotStart < bEnd && slotEnd > bStart && (b.status !== 'cancelled' && b.status !== 'no_show')
          })

          // If there are overlapping reservations for this slot, mark as conflict
          // This is a conservative approach — in production you'd cross-reference with table count
          if (overlapping.length > 0) {
            // Check if ALL available tables are taken during this slot
            // For now, mark as conflict if 80%+ of bookings overlap (conservative)
            // A more precise check would use the /tables/availability endpoint per slot
            // but that's N API calls. We mark it as a "warning" instead.
          }
        }

        // Use the availability endpoint to check each slot efficiently
        // We test a few key slots to mark fully-booked ones
        const conflicted: string[] = []
        await Promise.all(
          TIME_SLOTS.map(async (slot) => {
            try {
              const dateParts2 = data.date.split('/')
              const isoDate2 = dateParts2.length === 3 ? `${dateParts2[2]}-${dateParts2[1]}-${dateParts2[0]}` : data.date
              const avail = await api.get<any[]>(
                `/organizations/${orgId}/tables/availability?date=${isoDate2}&time=${slot}&partySize=${data.guests}`
              )
              if (avail.data && avail.data.length === 0) {
                conflicted.push(slot)
              }
            } catch {
              // If availability check fails, don't block the slot
            }
          })
        )
        setConflictSlots(conflicted)
      } catch {
        setConflictSlots([])
      }
    }
    fetchConflicts()
  }, [orgId, data.date, data.guests])

  const fullyBooked = conflictSlots.length === TIME_SLOTS.length

  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '24px', fontFamily: 'var(--font-sans)', marginTop: 0 }}>
        When would you like to dine?
      </h2>

      {fullyBooked && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626' }}>
            <AlertCircle size={16} />
            <span style={{ fontSize: '0.875rem', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>All time slots are fully booked.</span>
          </div>
          <button
            onClick={() => setShowWaitingList(true)}
            className="btn-gold"
            style={{ padding: '8px 16px', fontSize: '0.875rem' }}
          >
            Join Waiting List
          </button>
        </div>
      )}

      {/* Date */}
      <div style={{ marginBottom: '32px' }}>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#111827', marginBottom: '8px', fontFamily: 'var(--font-sans)' }}>
          Date
        </label>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={data.date}
            onChange={(e) => updateData({ date: e.target.value })}
            style={{
              padding: '12px 16px',
              paddingRight: '40px',
              width: '100%',
              boxSizing: 'border-box',
              backgroundColor: '#ffffff',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              color: '#111827',
              fontSize: '1rem',
              fontFamily: 'var(--font-sans)'
            }}
          />
          <Calendar size={18} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
        </div>
      </div>

      {/* Time Slots */}
      <div style={{ marginBottom: '32px' }}>
        <TimeSlotPicker
          slots={TIME_SLOTS}
          selectedSlot={data.time}
          onSelect={(slot) => updateData({ time: slot })}
          disabledSlots={conflictSlots}
          fullyBooked={fullyBooked}
        />
      </div>

      {/* Guest Counter */}
      <GuestCounter
        count={data.guests}
        onChange={(count) => updateData({ guests: count })}
      />

      <WaitingListModal
        isOpen={showWaitingList}
        onClose={() => setShowWaitingList(false)}
      />
    </div>
  )
}
