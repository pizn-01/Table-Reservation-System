import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, User, Phone } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../lib/api'

export default function CustomerSignUp() {
  const navigate = useNavigate()
  const { customerSignup } = useAuth()
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.firstName.trim()) {
      setError('First name is required')
      return
    }

    if (!form.email.trim()) {
      setError('Email is required')
      return
    }

    if (!form.password.trim()) {
      setError('Password is required (minimum 8 characters)')
      return
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setIsLoading(true)

    try {
      await customerSignup({
        firstName: form.firstName,
        lastName: form.lastName || undefined,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
      })
      setIsSubmitted(true)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0B1517',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      {/* Main Card */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '40px',
          width: '100%',
          maxWidth: '480px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'rgba(201, 156, 99, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <User size={28} strokeWidth={1.5} color="#C99C63" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: '0 0 8px 0' }}>
            Create Account
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
            Sign up to book your perfect dining experience
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '0.875rem',
            }}
          >
            {error}
          </div>
        )}

        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '10px 16px',
            marginBottom: '16px',
            color: '#ef4444',
            fontSize: '0.8125rem',
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        {isSubmitted ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: 'rgba(201, 156, 99, 0.1)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <Mail size={32} color="#C99C63" />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>
              Check your email
            </h2>
            <p style={{ color: '#4b5563', fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: '24px' }}>
              We've sent a verification link to <strong>{form.email}</strong>.<br/>
              Please click the link to activate your account.
            </p>
            <button
              onClick={() => navigate('/customer-login')}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#111827',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Back to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* First Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#111827', marginBottom: '6px' }}>
                First Name *
              </label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  placeholder="Enter first name"
                  style={{
                    width: '100%',
                    backgroundColor: '#f9fafb',
                    border: '1px solid #d1d5db',
                    borderRadius: '10px',
                    padding: '12px 16px 12px 40px',
                    color: '#111827',
                    fontSize: '0.9375rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#C99C63')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#d1d5db')}
                />
              </div>
            </div>

            {/* Last Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#111827', marginBottom: '6px' }}>
                Last Name (Optional)
              </label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  placeholder="Enter last name"
                  style={{
                    width: '100%',
                    backgroundColor: '#f9fafb',
                    border: '1px solid #d1d5db',
                    borderRadius: '10px',
                    padding: '12px 16px 12px 40px',
                    color: '#111827',
                    fontSize: '0.9375rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#C99C63')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#d1d5db')}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#111827', marginBottom: '6px' }}>
                Email *
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="your.email@example.com"
                  style={{
                    width: '100%',
                    backgroundColor: '#f9fafb',
                    border: '1px solid #d1d5db',
                    borderRadius: '10px',
                    padding: '12px 16px 12px 40px',
                    color: '#111827',
                    fontSize: '0.9375rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#C99C63')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#d1d5db')}
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#111827', marginBottom: '6px' }}>
                Phone (Optional)
              </label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+44 7700 900000"
                  style={{
                    width: '100%',
                    backgroundColor: '#f9fafb',
                    border: '1px solid #d1d5db',
                    borderRadius: '10px',
                    padding: '12px 16px 12px 40px',
                    color: '#111827',
                    fontSize: '0.9375rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#C99C63')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#d1d5db')}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#111827', marginBottom: '6px' }}>
                Password *
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="At least 8 characters"
                  style={{
                    width: '100%',
                    backgroundColor: '#f9fafb',
                    border: '1px solid #d1d5db',
                    borderRadius: '10px',
                    padding: '12px 40px 12px 40px',
                    color: '#111827',
                    fontSize: '0.9375rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#C99C63')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#d1d5db')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#9ca3af',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: isLoading ? '#9ca3af' : '#C99C63',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '0.9375rem',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                marginTop: '8px',
                transition: 'background-color 0.2s',
              }}
              onMouseOver={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#b58b57')}
              onMouseOut={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#C99C63')}
            >
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>
        )}

        {/* Footer */}
        <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.875rem', margin: '20px 0 0 0' }}>
          Already have an account?{' '}
          <Link to="/customer-login" style={{ color: '#C99C63', textDecoration: 'none', fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>

      {/* Bottom Info */}
      <div style={{ marginTop: '40px', textAlign: 'center', color: '#8b949e', fontSize: '0.8125rem' }}>
        <p style={{ margin: '0 0 8px 0' }}>By signing up, you agree to our Terms of Service</p>
        <p style={{ margin: 0 }}>Already a restaurant? <Link to="/signup" style={{ color: '#C99C63', textDecoration: 'none' }}>Set up your dining establishment</Link></p>
      </div>
    </div>
  )
}
