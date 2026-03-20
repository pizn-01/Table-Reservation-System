import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { User, Lock, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import api, { ApiError } from '../lib/api'

export default function AcceptInvite() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  
  const [form, setForm] = useState({
    name: '',
    password: '',
    confirmPassword: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing invitation token. Please check your email link.')
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsSubmitting(true)
    setError('')
    try {
      await api.post('/auth/accept-invite', {
        token,
        name: form.name.trim(),
        password: form.password,
      })
      setSuccess(true)
      // Redirect to staff login after 3 seconds
      setTimeout(() => {
        navigate('/staff-login')
      }, 3000)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to accept invitation. The link may have expired.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0B1517] flex items-center justify-center p-4">
        <div className="glass-card max-w-md w-full p-10 text-center animate-scale-in">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-green-500" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Welcome to the Team!</h2>
          <p className="text-dark-text-secondary mb-8">
            Your account has been created successfully. Redirecting you to the login page...
          </p>
          <Link to="/staff-login" className="btn-gold block w-full py-3 flex items-center justify-center gap-2">
            Go to Login <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0B1517] flex items-center justify-center p-4 py-12 relative overflow-hidden">
      {/* Dynamic Background Blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-gold/5 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-green-primary/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 w-full max-w-xl animate-fade-in px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-[10px] font-black uppercase tracking-[0.2em] leading-none">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-gold"></span>
            </span>
            Staff Invite
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight leading-tight">Setup Your Account</h1>
          <p className="text-dark-text-secondary text-lg max-w-md mx-auto">Create your password to join the restaurant team and start managing reservations.</p>
        </div>

        <div className="glass-card shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] p-12 border-[#30363d]/50 bg-[#161B22]/95" style={{ borderRadius: '28px' }}>
          {error && (
            <div className="mb-10 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-400 flex items-start gap-4 animate-shake">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
                <AlertCircle size={24} className="text-red-500" />
              </div>
              <div className="flex-1 pt-1.5">
                <p className="font-semibold text-red-400 mb-1 leading-none uppercase tracking-wider text-[11px]">Registration Issue</p>
                <p className="opacity-80 mt-1">{error}</p>
              </div>
            </div>
          )}

          {!token ? (
            <div className="text-center py-6">
              <p className="text-dark-text-muted mb-8">This invitation link is invalid or has expired.</p>
              <Link to="/" className="btn-gold px-8 py-3 rounded-xl inline-flex items-center gap-2">
                Return to Home <ArrowRight size={18} />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="space-y-4">
                <label className="text-[11px] font-black text-gold uppercase tracking-[0.2em] pl-1 opacity-90 block">Your Full Name</label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-dark-text-muted transition-all duration-300 group-focus-within:text-gold group-focus-within:scale-110">
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
                <label className="text-[11px] font-black text-gold uppercase tracking-[0.2em] pl-1 opacity-90 block">Create Password</label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-dark-text-muted transition-all duration-300 group-focus-within:text-gold group-focus-within:scale-110">
                    <Lock size={22} strokeWidth={2.5} />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="At least 8 characters"
                    className="input-dark w-full bg-[#0d1117]/80 border-[#30363d] focus:border-gold/60 focus:ring-4 focus:ring-gold/10 transition-all duration-300"
                    style={{ paddingLeft: '60px', height: '64px', fontSize: '1.05rem', borderRadius: '16px' }}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-black text-gold uppercase tracking-[0.2em] pl-1 opacity-90 block">Confirm Password</label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-dark-text-muted transition-all duration-300 group-focus-within:text-gold group-focus-within:scale-110">
                    <Lock size={22} strokeWidth={2.5} />
                  </div>
                  <input
                    type="password"
                    required
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    placeholder="Repeat password"
                    className="input-dark w-full bg-[#0d1117]/80 border-[#30363d] focus:border-gold/60 focus:ring-4 focus:ring-gold/10 transition-all duration-300"
                    style={{ paddingLeft: '60px', height: '64px', fontSize: '1.05rem', borderRadius: '16px' }}
                  />
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-gold w-full h-[64px] rounded-2xl text-lg font-black tracking-widest uppercase shadow-[0_20px_40px_-12px_rgba(212,168,86,0.3)] active:scale-[0.98] hover:scale-[1.01] transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #d4a856 0%, #b88d3e 100%)', color: '#0B1517' }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={24} className="animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      Complete Setup <ArrowRight size={22} strokeWidth={2.5} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
        
        <p className="mt-12 text-center text-dark-text-secondary">
          Already have an account? <Link to="/staff-login" className="text-gold hover:text-white transition-all duration-300 font-bold border-b border-gold/20 hover:border-gold pb-1 ml-1">Sign in instead</Link>
        </p>
      </div>
    </div>
  )
}
