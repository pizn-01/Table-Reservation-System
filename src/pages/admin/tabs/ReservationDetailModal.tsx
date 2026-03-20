import { X, Calendar, Clock, Users, MapPin, MessageSquare, FileText } from 'lucide-react'
import StatusBadge from '../../../components/StatusBadge'

interface Reservation {
  id: string
  guestFirstName: string
  guestLastName?: string
  guestEmail?: string
  guestPhone?: string
  reservationDate?: string
  table?: {
    tableNumber?: string
    name?: string
    area?: string
  } | null
  startTime: string
  endTime?: string
  partySize: number
  status: string
  source?: string
  specialRequests?: string
  internalNotes?: string
  confirmedAt?: string
  seatedAt?: string
  completedAt?: string
  cancelledAt?: string
  cancellationReason?: string
  createdAt?: string
}

interface ReservationDetailModalProps {
  isOpen: boolean
  onClose: () => void
  reservation: Reservation | null
}

export default function ReservationDetailModal({ isOpen, onClose, reservation }: ReservationDetailModalProps) {
  if (!isOpen || !reservation) return null

  const r = reservation
  const guestName = [r.guestFirstName, r.guestLastName].filter(Boolean).join(' ') || 'Guest'
  const formatTime = (t?: string) => t?.slice(0, 5) || '—'
  const formatDate = (d?: string) => {
    if (!d) return '—'
    try {
      return new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    } catch { return d }
  }
  const formatTimestamp = (ts?: string) => {
    if (!ts) return null
    try {
      return new Date(ts).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    } catch { return ts }
  }

  const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 0', borderBottom: '1px solid rgba(48,54,61,0.3)' }}>
      <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(212,168,86,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={18} style={{ color: '#C99C63' }} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#8b949e' }}>{label}</p>
        <p style={{ margin: '4px 0 0', fontSize: '0.95rem', fontWeight: 500, color: '#e6edf3' }}>{value}</p>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#0B1517]/90 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg animate-scale-in">
        <div
          className="glass-card shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden border-[#30363d]/50 bg-[#161B22]/95"
          style={{ borderRadius: '28px', maxHeight: '85vh', overflowY: 'auto' }}
        >
          {/* Header */}
          <div className="relative px-10 pt-10 pb-8 border-b border-[#30363d]/30 overflow-hidden">
            <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 rounded-full blur-3xl opacity-60" style={{ backgroundColor: 'rgba(212,168,86,0.15)' }} />

            <div className="relative flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] leading-none" style={{ backgroundColor: 'rgba(212,168,86,0.08)', border: '1px solid rgba(212,168,86,0.12)', color: 'var(--color-gold)' }}>
                  Reservation Detail
                </div>
                <h2 className="text-3xl font-bold text-white tracking-tight">{guestName}</h2>
                <div style={{ marginTop: '10px' }}>
                  <StatusBadge status={r.status as any} />
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 hover:text-white transition-all duration-300 cursor-pointer border border-white/10"
                style={{ color: 'var(--color-dark-text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="px-10 py-8" style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            <InfoRow icon={Calendar} label="Date" value={formatDate(r.reservationDate)} />
            <InfoRow icon={Clock} label="Time" value={`${formatTime(r.startTime)} – ${formatTime(r.endTime)}`} />
            <InfoRow icon={Users} label="Party Size" value={`${r.partySize} guests`} />
            <InfoRow icon={MapPin} label="Table" value={r.table?.name || r.table?.tableNumber || 'Not assigned'} />

            {r.guestEmail && (
              <InfoRow icon={MessageSquare} label="Email" value={r.guestEmail} />
            )}
            {r.guestPhone && (
              <InfoRow icon={MessageSquare} label="Phone" value={r.guestPhone} />
            )}
            {r.specialRequests && (
              <InfoRow icon={FileText} label="Special Requests" value={r.specialRequests} />
            )}
            {r.internalNotes && (
              <InfoRow icon={FileText} label="Internal Notes" value={r.internalNotes} />
            )}

            {/* Source & ID */}
            <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
              <div style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(48,54,61,0.4)' }}>
                <p style={{ margin: 0, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#8b949e' }}>Source</p>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', fontWeight: 500, color: '#e6edf3', textTransform: 'capitalize' }}>{r.source || '—'}</p>
              </div>
              <div style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(48,54,61,0.4)' }}>
                <p style={{ margin: 0, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#8b949e' }}>Confirmation</p>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', fontWeight: 500, color: '#C99C63', fontFamily: 'monospace' }}>{r.id?.split('-')[0]?.toUpperCase() || '—'}</p>
              </div>
            </div>

            {/* Timestamps */}
            {(r.confirmedAt || r.seatedAt || r.completedAt || r.cancelledAt) && (
              <div style={{ marginTop: '20px', padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(48,54,61,0.3)' }}>
                <p style={{ margin: '0 0 10px', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#8b949e' }}>Timeline</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: '#8b949e' }}>
                  {r.createdAt && <span>Created: {formatTimestamp(r.createdAt)}</span>}
                  {r.confirmedAt && <span>Confirmed: {formatTimestamp(r.confirmedAt)}</span>}
                  {r.seatedAt && <span>Seated: {formatTimestamp(r.seatedAt)}</span>}
                  {r.completedAt && <span>Completed: {formatTimestamp(r.completedAt)}</span>}
                  {r.cancelledAt && <span>Cancelled: {formatTimestamp(r.cancelledAt)}</span>}
                </div>
                {r.cancellationReason && (
                  <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#ef4444' }}>Reason: {r.cancellationReason}</p>
                )}
              </div>
            )}
          </div>

          {/* Close Button */}
          <div className="px-10 pb-10">
            <button
              onClick={onClose}
              className="w-full rounded-2xl border border-[#30363d] text-white font-bold uppercase tracking-wider hover:bg-white/5 transition-all duration-300 active:scale-[0.98]"
              style={{ height: '56px' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
