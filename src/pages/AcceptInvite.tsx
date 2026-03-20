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
    <div className="min-h-screen bg-[#0B1517] flex items-center justify-center p-4 py-12">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gold/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-green-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg animate-fade-in">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">Setup Your Account</h1>
          <p className="text-dark-text-secondary text-lg">You've been invited to join the restaurant staff</p>
        </div>

        <div className="glass-card shadow-2xl p-10 border-[#30363d]/50 bg-[#161B22]/80">
          {error && (
            <div className="mb-8 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-4 text-sm text-red-400 flex items-start gap-3">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {!token ? (
            <div className="text-center py-4">
              <Link to="/" className="btn-outline inline-block">Return Home</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gold uppercase tracking-[0.15em] ml-1">Your Full Name</label>
                <div className="relative group">
                  <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-text-muted transition-colors group-focus-within:text-gold" />
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Enter your name"
                    className="input-dark pl-12 bg-[#0d1117]/60 border-[#30363d] focus:border-gold/60 focus:ring-2 focus:ring-gold/10 h-14"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gold uppercase tracking-[0.15em] ml-1">Create Password</label>
                <div className="relative group">
                  <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-text-muted transition-colors group-focus-within:text-gold" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Min. 8 characters"
                    className="input-dark pl-12 bg-[#0d1117]/60 border-[#30363d] focus:border-gold/60 focus:ring-2 focus:ring-gold/10 h-14"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gold uppercase tracking-[0.15em] ml-1">Confirm Password</label>
                <div className="relative group">
                  <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-text-muted transition-colors group-focus-within:text-gold" />
                  <input
                    type="password"
                    required
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    placeholder="Repeat password"
                    className="input-dark pl-12 bg-[#0d1117]/60 border-[#30363d] focus:border-gold/60 focus:ring-2 focus:ring-gold/10 h-14"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-gold w-full py-4 rounded-xl text-lg font-bold shadow-xl shadow-gold/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={24} className="animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      Complete Setup <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
        
        <p className="mt-8 text-center text-dark-text-secondary">
          Already have an account? <Link to="/staff-login" className="text-gold hover:text-gold-light transition-colors font-semibold border-b border-gold/30">Sign in instead</Link>
        </p>
      </div>
    </div>
  )
}
