import { useState } from 'react'
import { X, User, Mail, Shield, AlertCircle, Loader2 } from 'lucide-react'
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
      <div className="relative w-full max-w-xl animate-scale-in">
        <div 
          className="glass-card shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden border-[#30363d]/50 bg-[#161B22]/95" 
          style={{ borderRadius: '28px' }}
        >
          
          {/* Header with Background Pattern/Gradient */}
          <div className="relative px-12 pt-12 pb-10 border-b border-[#30363d]/30 overflow-hidden">
            <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-gold/15 rounded-full blur-3xl opacity-60" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-green-primary/10 rounded-full blur-3xl opacity-40" />
            
            <div className="relative flex items-center justify-between">
              <div>
                <div className="inline-block px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-[10px] font-black uppercase tracking-widest mb-3">
                  New Member
                </div>
                <h2 className="text-4xl font-bold text-white tracking-tight">Invite Team</h2>
                <p className="text-dark-text-secondary text-base mt-2">Expand your restaurant's digital presence.</p>
              </div>
              <button 
                onClick={onClose} 
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-dark-text-secondary hover:text-white transition-all duration-300 cursor-pointer border border-white/10"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="p-12">
            {error && (
              <div className="mb-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-400 flex items-start gap-4 animate-shake">
                <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
                  <AlertCircle size={20} className="text-red-500" />
                </div>
                <div className="flex-1 pt-0.5">
                  {error}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="space-y-4">
                <label className="text-[11px] font-black text-gold uppercase tracking-[0.2em] pl-1 opacity-90 block">Staff Name</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-text-muted transition-all duration-300 group-focus-within:text-gold group-focus-within:scale-110" style={{ zIndex: 10 }}>
                    <User size={22} />
                  </div>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. John Doe"
                    className="input-dark w-full bg-[#0d1117]/80 border-[#30363d] focus:border-gold/60 focus:ring-4 focus:ring-gold/10 transition-all duration-300"
                    style={{ paddingLeft: '54px', height: '64px', fontSize: '1.05rem', borderRadius: '16px' }}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-black text-gold uppercase tracking-[0.2em] pl-1 opacity-90 block">Email Address</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-text-muted transition-all duration-300 group-focus-within:text-gold group-focus-within:scale-110" style={{ zIndex: 10 }}>
                    <Mail size={22} />
                  </div>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="staff@restaurant.com"
                    className="input-dark w-full bg-[#0d1117]/80 border-[#30363d] focus:border-gold/60 focus:ring-4 focus:ring-gold/10 transition-all duration-300"
                    style={{ paddingLeft: '54px', height: '64px', fontSize: '1.05rem', borderRadius: '16px' }}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-black text-gold uppercase tracking-[0.2em] pl-1 opacity-90 block">Access Level</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-text-muted transition-all duration-300 group-focus-within:text-gold group-focus-within:scale-110" style={{ zIndex: 10 }}>
                    <Shield size={22} />
                  </div>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="input-dark w-full bg-[#0d1117]/80 border-[#30363d] focus:border-gold/60 focus:ring-4 focus:ring-gold/10 transition-all duration-300 appearance-none cursor-pointer"
                    style={{ paddingLeft: '54px', height: '64px', fontSize: '1.05rem', borderRadius: '16px' }}
                  >
                    <option value="manager" className="bg-[#161B22]">Manager (Full Access)</option>
                    <option value="host" className="bg-[#161B22]">Host (Reservations & Tables)</option>
                    <option value="viewer" className="bg-[#161B22]">Viewer (Read-only)</option>
                  </select>
                </div>
              </div>

              <div className="pt-8" style={{ display: 'flex', gap: '20px' }}>
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="rounded-2xl border border-[#30363d] text-white font-bold uppercase tracking-wider hover:bg-white/5 transition-all duration-300 active:scale-[0.98]"
                  style={{ flex: 1, height: '64px' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="btn-gold rounded-2xl shadow-[0_20px_40px_-12px_rgba(212,168,86,0.3)] active:scale-[0.97] hover:scale-[1.01] transition-all duration-300 text-white font-black uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50"
                  style={{ flex: 1.5, height: '64px', background: 'linear-gradient(135deg, #d4a856 0%, #b88d3e 100%)' }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={24} className="animate-spin" />
                      <span>Sending...</span>
                    </>
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
