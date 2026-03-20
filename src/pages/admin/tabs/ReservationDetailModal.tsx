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
      <div style={{ width: '44px', height: '44px', borderRadius: '14px', backgroundColor: 'rgba(212,168,86,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(212,168,86,0.1)' }}>
        <Icon size={20} strokeWidth={2.5} style={{ color: '#C99C63' }} />
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

      {/* Modal Container */}
      <div className="relative w-full max-w-lg animate-scale-in">
        <div
          className="glass-card shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden border-[#30363d]/50 bg-[#161B22]/98"
          style={{ borderRadius: '28px', maxHeight: '85vh', overflowY: 'auto' }}
        >
          {/* Header */}
          <div className="relative px-12 pt-16 pb-8 text-center overflow-hidden">
            <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 rounded-full blur-3xl opacity-60" style={{ backgroundColor: 'rgba(212,168,86,0.15)' }} />
            
            <button
              onClick={onClose}
              className="absolute right-8 top-8 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 hover:text-white transition-all duration-300 cursor-pointer border border-white/10 z-20"
              style={{ color: 'var(--color-dark-text-secondary)' }}
            >
              <X size={20} />
            </button>

            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] leading-none mx-auto" style={{ backgroundColor: 'rgba(212,168,86,0.08)', border: '1px solid rgba(212,168,86,0.12)', color: 'var(--color-gold)' }}>
              Reservation Details
            </div>
            <h2 className="text-4xl font-bold text-white tracking-tight leading-tight">{guestName}</h2>
            <div className="flex justify-center mt-4">
              <StatusBadge status={r.status as any} />
            </div>
          </div>

          <div className="px-12 pb-10" style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
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
            <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
              <div style={{ flex: 1, padding: '16px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(48,54,61,0.3)' }}>
                <p style={{ margin: 0, fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#8b949e' }}>Source</p>
                <p style={{ margin: '6px 0 0', fontSize: '0.9rem', fontWeight: 600, color: '#e6edf3', textTransform: 'capitalize' }}>{r.source || '—'}</p>
              </div>
              <div style={{ flex: 1, padding: '16px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(48,54,61,0.3)' }}>
                <p style={{ margin: 0, fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#8b949e' }}>Ref Code</p>
                <p style={{ margin: '6px 0 0', fontSize: '0.9rem', fontWeight: 700, color: '#C99C63', fontFamily: 'var(--font-mono)' }}>{r.id?.split('-')[0]?.toUpperCase() || '—'}</p>
              </div>
            </div>

            {/* Timestamps */}
            {(r.confirmedAt || r.seatedAt || r.completedAt || r.cancelledAt) && (
              <div style={{ marginTop: '24px', padding: '20px', borderRadius: '16px', backgroundColor: 'rgba(212,168,86,0.03)', border: '1px solid rgba(212,168,86,0.08)' }}>
                <p style={{ margin: '0 0 12px', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--color-gold)', opacity: 0.8 }}>Timeline</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8125rem', color: '#8b949e' }}>
                  {r.createdAt && <div className="flex justify-between items-center"><span>Created</span> <span className="text-[#e6edf3] font-medium">{formatTimestamp(r.createdAt)}</span></div>}
                  {r.confirmedAt && <div className="flex justify-between items-center"><span>Confirmed</span> <span className="text-[#e6edf3] font-medium">{formatTimestamp(r.confirmedAt)}</span></div>}
                  {r.seatedAt && <div className="flex justify-between items-center"><span>Seated</span> <span className="text-[#e6edf3] font-medium">{formatTimestamp(r.seatedAt)}</span></div>}
                  {r.completedAt && <div className="flex justify-between items-center"><span>Completed</span> <span className="text-[#e6edf3] font-medium">{formatTimestamp(r.completedAt)}</span></div>}
                  {r.cancelledAt && <div className="flex justify-between items-center"><span>Cancelled</span> <span className="text-[#e6edf3] font-medium">{formatTimestamp(r.cancelledAt)}</span></div>}
                </div>
                {r.cancellationReason && (
                  <div className="mt-4 pt-3 border-t border-red-500/10">
                    <p style={{ margin: 0, fontSize: '0.8125rem', color: '#ef4444' }}><span className="font-bold uppercase text-[10px] tracking-wider mr-2 opacity-70">Reason:</span> {r.cancellationReason}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="px-12 pb-12">
            <button
              onClick={onClose}
              className="w-full rounded-2xl border border-[#30363d] text-white font-bold uppercase tracking-wider hover:bg-white/10 transition-all duration-300 active:scale-[0.98] bg-white/5"
              style={{ height: '60px' }}
            >
              Close Details
            </button>
          </div>
        </div>
      </div>
    </div>

  )
}
