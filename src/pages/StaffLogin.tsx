import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../lib/api'

export default function StaffLogin() {
  const navigate = useNavigate()
  const { staffLogin } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await staffLogin(email, password)
      navigate('/staff/tables')
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
      backgroundColor: '#F6F7F9', // Light gray background matching 23.png
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 16px',
      position: 'relative',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {/* Top Left Logo */}
      <div className="res-auth-logo" style={{ position: 'absolute', top: '40px', left: '40px' }}>
        <h1 style={{ color: '#111827', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Logo</h1>
      </div>

      {/* Login Box */}
      <div className="res-auth-box" style={{
        width: '100%',
        maxWidth: '480px', // slightly less wide
        backgroundColor: '#ffffff', // White login box
        borderRadius: '16px',
        padding: '32px 40px', // balanced padding
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        border: 'none', // No border in 23.png
        boxShadow: '0 4px 40px -10px rgba(0, 0, 0, 0.05)' // Very subtle, diffuse shadow
      }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#111827', textAlign: 'center', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
          Welcome Back!
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', textAlign: 'center', margin: '0 0 24px 0', lineHeight: 1.4 }}>
          Log in to access your account and manage everything in one place.
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Email Field */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#111827', margin: '0 0 6px 0' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter Email"
              style={{
                width: '100%',
                height: '46px',
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '0 16px',
                color: '#111827',
                fontSize: '0.875rem',
                boxSizing: 'border-box',
                outline: 'none',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => e.target.style.borderColor = '#C99C63'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#111827', margin: '0 0 6px 0' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Password"
                style={{
                  width: '100%',
                  height: '46px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '0 48px 0 16px',
                  color: '#111827',
                  fontSize: '0.875rem',
                  boxSizing: 'border-box',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => e.target.style.borderColor = '#C99C63'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
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
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0
                }}
              >
                {showPassword ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
              </button>
            </div>
          </div>

          {/* Forgot Password */}
          <div style={{ textAlign: 'right', marginBottom: '24px' }}>
            <a href="#" style={{ fontSize: '0.8125rem', color: '#4A9E6B', textDecoration: 'none', fontWeight: 500 }}>
              Forgot Password?
            </a>
          </div>

          {/* Sign In Button */}
          <button type="submit" disabled={isLoading} style={{
            width: '100%',
            height: '46px',
            backgroundColor: isLoading ? '#8b7650' : '#C99C63',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.9375rem',
            fontWeight: 600,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            transition: 'background-color 0.2s',
            opacity: isLoading ? 0.7 : 1,
          }}
          onMouseOver={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#b58b57')}
          onMouseOut={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#C99C63')}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
