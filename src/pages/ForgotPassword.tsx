import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import api, { ApiError } from '../lib/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setIsLoading(true)

    if (!email.trim()) {
      setError('Email is required.')
      setIsLoading(false)
      return
    }

    try {
      // Simulate API call to send reset link
      // Use skipAuth to avoid throwing on unauthorized
      const res = await api.post('/auth/forgot-password', { email }, { skipAuth: true })
      
      // We assume it's true, or handle failure nicely
      if (res.success || !res.error) {
        setSuccess(true)
      } else {
        setError(res.error || 'Failed to send reset link. Please try again.')
      }
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
    <div className="res-auth-container" style={{
      minHeight: '100vh',
      backgroundColor: '#0B1517',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 16px',
      position: 'relative',
      fontFamily: 'var(--font-sans)'
    }}>
      {/* Top Left Logo */}
      <div className="res-auth-logo" style={{ position: 'absolute', top: '40px', left: '40px' }}>
        <h1 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Logo</h1>
      </div>

      {/* Forgot Password Box */}
      <div className="res-auth-box" style={{
        width: '100%',
        maxWidth: '520px',
        backgroundColor: '#101A1C',
        borderRadius: '16px',
        padding: '32px 48px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        animation: 'slideUp 0.5s ease-out'
      }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#ffffff', textAlign: 'center', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
          Reset Password
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#8b949e', textAlign: 'center', margin: '0 0 20px 0', lineHeight: 1.4 }}>
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '10px 16px',
            marginBottom: '12px',
            color: '#ef4444',
            fontSize: '0.8125rem',
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            backgroundColor: 'rgba(94, 234, 122, 0.1)',
            border: '1px solid rgba(94, 234, 122, 0.3)',
            borderRadius: '8px',
            padding: '10px 16px',
            marginBottom: '12px',
            color: '#5EEA7A',
            fontSize: '0.8125rem',
          }}>
            If an account exists with this email, you will receive a password reset link shortly.
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Email Field */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#ffffff', margin: '0 0 4px 0' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter Email"
              disabled={isLoading || success}
              style={{
                width: '100%',
                height: '46px',
                backgroundColor: 'transparent',
                border: '1px solid #30363d',
                borderRadius: '8px',
                padding: '0 16px',
                color: '#ffffff',
                fontSize: '0.875rem',
                boxSizing: 'border-box',
                outline: 'none',
                fontFamily: 'inherit',
                opacity: (isLoading || success) ? 0.7 : 1
              }}
            />
          </div>

          {/* Submit Button */}
          <button type="submit" disabled={isLoading || success} style={{
            width: '100%',
            height: '46px',
            backgroundColor: (isLoading || success) ? '#8b7650' : '#C99C63',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.9375rem',
            fontWeight: 600,
            cursor: (isLoading || success) ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            transition: 'background-color 0.2s',
            opacity: (isLoading || success) ? 0.7 : 1,
          }}
          onMouseOver={(e) => !(isLoading || success) && (e.currentTarget.style.backgroundColor = '#b58b57')}
          onMouseOut={(e) => !(isLoading || success) && (e.currentTarget.style.backgroundColor = '#C99C63')}
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div style={{ textAlign: 'center', margin: '24px 0 0 0' }}>
          <Link to="/login" style={{ 
            color: '#8b949e', 
            textDecoration: 'none', 
            fontSize: '0.875rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'color 0.2s'
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = '#ffffff')}
          onMouseOut={(e) => (e.currentTarget.style.color = '#8b949e')}
          >
            <ArrowLeft size={16} />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}
