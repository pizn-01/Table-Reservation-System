import { type ReactNode } from 'react'

interface StatsCardProps {
  label: string
  value: number | string
  icon: ReactNode
  variant?: 'dark' | 'light'
}

export default function StatsCard({ label, value, icon, variant = 'dark' }: StatsCardProps) {
  const isDark = variant === 'dark'

  return (
    <div
      className="res-stats-card glass-card shadow-lg"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: '16px',
        padding: '24px',
        border: `1px solid ${isDark ? 'rgba(48, 54, 61, 0.4)' : '#e5e7eb'}`,
        backgroundColor: isDark ? 'rgba(22, 27, 34, 0.6)' : '#ffffff',
        transition: 'all 0.3s ease-in-out',
        backdropFilter: 'blur(12px)'
      }}
    >
      <div>
        <p style={{
          fontSize: '0.65rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          color: isDark ? 'var(--color-gold)' : '#6b7280',
          opacity: 0.8,
          margin: 0
        }}>
          {label}
        </p>
        <p style={{
          fontSize: '1.75rem',
          fontWeight: 800,
          marginTop: '8px',
          marginBottom: 0,
          color: isDark ? '#ffffff' : '#1f2937',
          letterSpacing: '-0.02em'
        }}>
          {value}
        </p>
      </div>
      <div
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDark ? 'rgba(212, 168, 86, 0.1)' : '#f3f4f6',
          color: isDark ? 'var(--color-gold)' : '#9ca3af',
          border: isDark ? '1px solid rgba(212, 168, 86, 0.2)' : 'none'
        }}
      >
        {icon}
      </div>
    </div>
  )
}
