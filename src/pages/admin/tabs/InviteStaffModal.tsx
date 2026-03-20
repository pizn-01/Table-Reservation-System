import { useState } from 'react'
import { X, User, Mail, Shield, AlertCircle, Loader2, ArrowRight } from 'lucide-react'
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
          className="glass-card shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden border-[#30363d]/50 bg-[#161B22]/98" 
          style={{ borderRadius: '28px' }}
        >
          
          {/* Header - Unified with the card */}
          <div className="relative px-12 pt-16 pb-6 text-center overflow-hidden">
              <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 rounded-full blur-3xl opacity-60" style={{ backgroundColor: 'rgba(212,168,86,0.15)' }} />
              <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full blur-3xl opacity-40" style={{ backgroundColor: 'rgba(74,124,89,0.1)' }} />
            
              <button 
                onClick={onClose} 
                className="absolute right-8 top-8 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 hover:text-white transition-all duration-300 cursor-pointer border border-white/10 z-20"
                style={{ color: 'var(--color-dark-text-secondary)' }}
              >
                <X size={20} />
              </button>

              <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] leading-none mx-auto" style={{ backgroundColor: 'rgba(212,168,86,0.08)', border: '1px solid rgba(212,168,86,0.12)', color: 'var(--color-gold)' }}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full" style={{ backgroundColor: 'rgba(212,168,86,0.75)' }}></span>
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: 'var(--color-gold)' }}></span>
                </span>
                Staff Onboarding
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">Invite Team</h2>
              <p style={{ color: 'var(--color-dark-text-secondary)' }} className="text-lg max-w-md mx-auto mt-4">Expand your restaurant's digital presence.</p>
          </div>

          <div className="px-12 pb-12 pt-4">
            {error && (
              <div className="mb-10 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-400 flex items-start gap-4 animate-shake">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
                  <AlertCircle size={24} className="text-red-500" strokeWidth={2.5} />
                </div>
                <div className="flex-1 pt-1.5">
                  <p className="font-semibold text-red-400 mb-1 leading-none uppercase tracking-wider text-[11px]">Invitation Issue</p>
                  <p className="opacity-80 mt-1">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="space-y-4">
                <label className="text-[11px] font-black text-gold uppercase tracking-[0.2em] pl-1 opacity-90 block">Staff Name</label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 transition-all duration-300 group-focus-within:scale-110" style={{ color: 'var(--color-dark-text-muted)' }}>
                    <User size={22} strokeWidth={2.5} />
                  </div>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. John Doe"
                    className="input-dark w-full bg-[#0d1117]/80 border-[#30363d] focus:border-gold/60 focus:ring-4 focus:ring-gold/10 transition-all duration-300"
                    style={{ paddingLeft: '60px', height: '64px', fontSize: '1.05rem', borderRadius: '16px' }}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-black text-gold uppercase tracking-[0.2em] pl-1 opacity-90 block">Email Address</label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 transition-all duration-300 group-focus-within:scale-110" style={{ color: 'var(--color-dark-text-muted)' }}>
                    <Mail size={22} strokeWidth={2.5} />
                  </div>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="staff@restaurant.com"
                    className="input-dark w-full bg-[#0d1117]/80 border-[#30363d] focus:border-gold/60 focus:ring-4 focus:ring-gold/10 transition-all duration-300"
                    style={{ paddingLeft: '60px', height: '64px', fontSize: '1.05rem', borderRadius: '16px' }}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-black text-gold uppercase tracking-[0.2em] pl-1 opacity-90 block">Access Level</label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 transition-all duration-300 group-focus-within:scale-110" style={{ color: 'var(--color-dark-text-muted)' }}>
                    <Shield size={22} strokeWidth={2.5} />
                  </div>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="input-dark w-full bg-[#0d1117]/80 border-[#30363d] focus:border-gold/60 focus:ring-4 focus:ring-gold/10 transition-all duration-300 appearance-none cursor-pointer"
                    style={{ paddingLeft: '60px', height: '64px', fontSize: '1.05rem', borderRadius: '16px' }}
                  >
                    <option value="manager" className="bg-[#161B22]">Manager (Full Access)</option>
                    <option value="host" className="bg-[#161B22]">Host (Reservations & Tables)</option>
                    <option value="viewer" className="bg-[#161B22]">Viewer (Read-only)</option>
                  </select>
                </div>
              </div>

              <div className="pt-6" style={{ display: 'flex', gap: '20px' }}>
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
                  className="btn-gold rounded-2xl shadow-[0_20px_40px_-12px_rgba(212,168,86,0.3)] active:scale-[0.98] hover:scale-[1.01] transition-all duration-300 text-white font-black tracking-widest uppercase flex items-center justify-center gap-4 disabled:opacity-50"
                  style={{ flex: 1.5, height: '64px', background: 'linear-gradient(135deg, #d4a856 0%, #b88d3e 100%)', color: '#0B1517' }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={24} className="animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      Send Invite <ArrowRight size={22} strokeWidth={2.5} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

    </div>
  )
}
