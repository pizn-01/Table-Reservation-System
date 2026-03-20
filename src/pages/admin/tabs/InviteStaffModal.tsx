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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#0B1517]/80 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose} 
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-md animate-scale-in">
        <div className="glass-card shadow-2xl overflow-hidden border-[#30363d]/50 bg-[#161B22]/90">
          
          {/* Header with Background Pattern/Gradient */}
          <div className="relative px-8 pt-8 pb-6 border-b border-[#30363d]/30 overflow-hidden">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-gold/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-green-primary/5 rounded-full blur-3xl" />
            
            <div className="relative flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Invite Team Member</h2>
                <p className="text-dark-text-secondary text-sm mt-1">Grow your restaurant staff</p>
              </div>
              <button 
                onClick={onClose} 
                className="p-2 rounded-full hover:bg-white/10 text-dark-text-secondary hover:text-white transition-all duration-200 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gold uppercase tracking-wider ml-1">Staff Name</label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-text-muted group-focus-within:text-gold transition-colors duration-200">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Enter full name"
                    className="input-dark pl-11 bg-[#0d1117]/50 border-[#30363d] focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all duration-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gold uppercase tracking-wider ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-text-muted group-focus-within:text-gold transition-colors duration-200">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="staff@example.com"
                    className="input-dark pl-11 bg-[#0d1117]/50 border-[#30363d] focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all duration-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gold uppercase tracking-wider ml-1">Access Level</label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-text-muted group-focus-within:text-gold transition-colors duration-200">
                    <Shield size={18} />
                  </div>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="input-dark pl-11 bg-[#0d1117]/50 border-[#30363d] focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all duration-200 appearance-none"
                  >
                    <option value="manager" className="bg-[#161B22]">Manager (Full Access)</option>
                    <option value="host" className="bg-[#161B22]">Host (Reservations & Tables)</option>
                    <option value="viewer" className="bg-[#161B22]">Viewer (Read-only)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center gap-4">
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="flex-1 py-3 px-6 rounded-xl border border-[#30363d] text-white font-medium hover:bg-white/5 transition-all duration-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="flex-1 btn-gold py-3 px-6 rounded-xl shadow-lg shadow-gold/10 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sending...</span>
                    </div>
                  ) : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
