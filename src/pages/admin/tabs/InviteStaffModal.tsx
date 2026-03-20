import { useState } from 'react'
import { X, User, Mail, Shield } from 'lucide-react'
import api, { ApiError } from '../../../lib/api'

interface InviteStaffModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  orgId?: string
}

export default function InviteStaffModal({
  isOpen,
  onClose,
  onSuccess,
  orgId,
}: InviteStaffModalProps) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'host',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orgId) {
      setError('Restaurant context not found.')
      return
    }
    if (!form.name.trim() || !form.email.trim()) {
      setError('Please provide both name and email.')
      return
    }

    setIsSubmitting(true)
    setError('')
    try {
      await api.post(`/organizations/${orgId}/staff/invite`, {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        role: form.role,
      })
      onSuccess()
      onClose()
      setForm({ name: '', email: '', role: 'host' })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to send invitation.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-dark-card border border-dark-border rounded-2xl p-8 w-full max-w-md animate-scale-in shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Invite Staff Member</h2>
          <button onClick={onClose} className="text-dark-text-secondary hover:text-white transition-colors cursor-pointer">
            <X size={22} />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gold mb-2">Full Name</label>
            <div className="relative">
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Manager Name"
                className="input-dark pl-10"
              />
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-text-secondary" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gold mb-2">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="staff@example.com"
                className="input-dark pl-10"
              />
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-text-secondary" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gold mb-2">Role</label>
            <div className="relative">
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="input-dark pl-10 appearance-none"
              >
                <option value="manager">Manager</option>
                <option value="host">Host / Receptionist</option>
                <option value="viewer">Viewer Only</option>
              </select>
              <Shield size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-text-secondary" />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-gold min-w-[120px]">
              {isSubmitting ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
