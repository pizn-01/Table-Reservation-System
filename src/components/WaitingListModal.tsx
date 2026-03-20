import { useState } from 'react'
import { X, Calendar, Clock } from 'lucide-react'
import api, { ApiError } from '../lib/api'

interface WaitingListModalProps {
  isOpen: boolean
  onClose: () => void
  orgId?: string
  requestedDate?: string
  requestedTime?: string
  partySize?: number
}

export default function WaitingListModal({
  isOpen,
  onClose,
  orgId,
  requestedDate,
  requestedTime,
  partySize,
}: WaitingListModalProps) {
  const [form, setForm] = useState({
    date: requestedDate || new Date().toISOString().split('T')[0],
    time: requestedTime || '',
    partySize: String(partySize || 2),
    name: '',
    phone: '',
    email: '',
    notes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!orgId) {
      setError('Restaurant context not found.')
      return
    }
    if (!form.name.trim()) {
      setError('Please enter your name.')
      return
    }
    if (!form.email.trim() && !form.phone.trim()) {
      setError('Please provide email or phone so we can contact you.')
      return
    }

    setIsSubmitting(true)
    setError('')
    try {
      await api.post(`/organizations/${orgId}/waiting-list`, {
        customerName: form.name.trim(),
        customerPhone: form.phone.trim() || undefined,
        customerEmail: form.email.trim() || undefined,
        partySize: Number(form.partySize),
        requestedDate: form.date,
        requestedTime: form.time || undefined,
        notes: form.notes.trim() || undefined,
      })
      onClose()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to join waiting list.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-dark-card border border-dark-border rounded-2xl p-8 w-full max-w-lg animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Join Waiting List</h2>
          <button onClick={onClose} className="text-dark-text-secondary hover:text-white transition-colors cursor-pointer">
            <X size={22} />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gold mb-2">Date</label>
            <div className="relative">
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="input-dark pr-10"
              />
              <Calendar size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-text-secondary" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gold mb-2">Time</label>
            <div className="relative">
              <input
                type="text"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                placeholder="18:30"
                className="input-dark pr-10"
              />
              <Clock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-text-secondary" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gold mb-2">Party Size</label>
            <input
              type="number"
              min={1}
              value={form.partySize}
              onChange={(e) => setForm({ ...form, partySize: e.target.value })}
              className="input-dark"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gold mb-2">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-dark"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gold mb-2">Email (optional)</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input-dark"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gold mb-2">Phone (optional)</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="input-dark"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gold mb-2">Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="input-dark"
              rows={3}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-8">
          <button onClick={onClose} className="btn-outline">Cancel</button>
          <button onClick={handleSubmit} disabled={isSubmitting} className="btn-gold">
            {isSubmitting ? 'Submitting...' : 'Join'}
          </button>
        </div>
      </div>
    </div>
  )
}
