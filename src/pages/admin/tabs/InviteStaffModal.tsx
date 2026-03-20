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
        className="absolute inset-0 bg-[#0B1517]/90 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose} 
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-lg animate-scale-in">
        <div className="glass-card shadow-2xl overflow-hidden border-[#30363d]/50 bg-[#161B22]/95" style={{ borderRadius: '24px' }}>
          
          {/* Header with Background Pattern/Gradient */}
          <div className="relative px-10 pt-10 pb-8 border-b border-[#30363d]/30 overflow-hidden">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-gold/10 rounded-full blur-3xl opacity-50" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-green-primary/5 rounded-full blur-3xl opacity-30" />
            
            <div className="relative flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white tracking-tight" style={{ marginBottom: '4px' }}>Invite Team Member</h2>
                <p className="text-dark-text-secondary text-base">Expand your restaurant staff and manage roles.</p>
              </div>
              <button 
                onClick={onClose} 
                className="p-2 rounded-full hover:bg-white/10 text-dark-text-secondary hover:text-white transition-all duration-200 cursor-pointer"
                style={{ position: 'absolute', top: '-10px', right: '-10px' }}
              >
                <X size={24} />
              </button>
            </div>
          </div>

          <div className="p-10">
            {error && (
              <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-3">
                <label className="text-xs font-bold text-gold uppercase tracking-[0.1em] opacity-80" style={{ display: 'block' }}>Staff Name</label>
                <div className="relative">
                  <div 
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-text-muted transition-colors duration-200 pointer-events-none"
                    style={{ zIndex: 10 }}
                  >
                    <User size={20} />
                  </div>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Enter full name"
                    className="input-dark bg-[#0d1117]/60 border-[#30363d] focus:border-gold/60 focus:ring-2 focus:ring-gold/10 transition-all duration-200"
                    style={{ paddingLeft: '48px', height: '52px', fontSize: '1rem' }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-gold uppercase tracking-[0.1em] opacity-80" style={{ display: 'block' }}>Email Address</label>
                <div className="relative">
                  <div 
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-text-muted transition-colors duration-200 pointer-events-none"
                    style={{ zIndex: 10 }}
                  >
                    <Mail size={20} />
                  </div>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="staff@example.com"
                    className="input-dark bg-[#0d1117]/60 border-[#30363d] focus:border-gold/60 focus:ring-2 focus:ring-gold/10 transition-all duration-200"
                    style={{ paddingLeft: '48px', height: '52px', fontSize: '1rem' }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-gold uppercase tracking-[0.1em] opacity-80" style={{ display: 'block' }}>Access Level</label>
                <div className="relative">
                  <div 
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-text-muted transition-colors duration-200 pointer-events-none"
                    style={{ zIndex: 10 }}
                  >
                    <Shield size={20} />
                  </div>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="input-dark bg-[#0d1117]/60 border-[#30363d] focus:border-gold/60 focus:ring-2 focus:ring-gold/10 transition-all duration-200 appearance-none cursor-pointer"
                    style={{ paddingLeft: '48px', height: '52px', fontSize: '1rem' }}
                  >
                    <option value="manager" className="bg-[#161B22]">Manager (Full Access)</option>
                    <option value="host" className="bg-[#161B22]">Host (Reservations & Tables)</option>
                    <option value="viewer" className="bg-[#161B22]">Viewer (Read-only)</option>
                  </select>
                </div>
              </div>

              <div className="pt-6" style={{ display: 'flex', gap: '16px' }}>
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="rounded-xl border border-[#30363d] text-white font-semibold hover:bg-white/5 transition-all duration-200 active:scale-[0.98]"
                  style={{ flex: 1, height: '52px' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="btn-gold rounded-xl shadow-xl shadow-gold/20 active:scale-[0.97] transition-all duration-200 text-white font-bold"
                  style={{ flex: 1.5, height: '52px' }}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
