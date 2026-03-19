import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import ProgressBar from '../../components/ProgressBar'
import { X, Upload, Download, ChefHat } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api, { ApiError } from '../../lib/api'

const TOTAL_STEPS = 4

export default function SetupWizard() {
  const navigate = useNavigate()
  const { restaurant, setRestaurant } = useAuth()
  const orgId = restaurant?.id
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1: Restaurant Details
  const [details, setDetails] = useState({
    address: '',
    description: 'Experience authentic cuisine in an elegant atmosphere',
    openingTime: '17:00',
    closingTime: '22:00',
  })

  // Step 3: Table Rules
  const [rules, setRules] = useState({
    mergeable: false,
    walkIns: false,
  })

  // Step 4: Team
  const [teamEmail, setTeamEmail] = useState('')
  const [teamRole, setTeamRole] = useState('manager')
  const [invitedMembers, setInvitedMembers] = useState<{ email: string; role: string }[]>([])
  const [inviteStatus, setInviteStatus] = useState<Record<string, 'pending' | 'sent' | 'error'>>({})

  const percentage = Math.round((currentStep / TOTAL_STEPS) * 100)

  // ─── Step Handlers ──────────────────────────────────────

  const saveStep = async (): Promise<boolean> => {
    if (!orgId) {
      setError('Restaurant not found. Please sign up again.')
      return false
    }

    setIsLoading(true)
    setError('')

    try {
      switch (currentStep) {
        case 1: {
          // Save restaurant details
          await api.put(`/organizations/${orgId}`, {
            address: details.address,
            description: details.description,
            openingTime: details.openingTime,
            closingTime: details.closingTime,
          })
          await api.patch(`/organizations/${orgId}/setup`, { setupStep: 1 })
          break
        }
        case 2: {
          // Floor map — CSV already uploaded or tables manually added
          await api.patch(`/organizations/${orgId}/setup`, { setupStep: 2 })
          break
        }
        case 3: {
          // Save table rules
          await api.put(`/organizations/${orgId}`, {
            allowMergeableTables: rules.mergeable,
            allowWalkIns: rules.walkIns,
          })
          await api.patch(`/organizations/${orgId}/setup`, { setupStep: 3 })
          break
        }
        case 4: {
          // Send any remaining invites, then mark setup complete
          for (const member of invitedMembers) {
            if (inviteStatus[member.email] === 'sent') continue
            try {
              await api.post(`/organizations/${orgId}/staff/invite`, {
                email: member.email,
                name: member.email.split('@')[0],
                role: member.role.toLowerCase(),
              })
              setInviteStatus((prev) => ({ ...prev, [member.email]: 'sent' }))
            } catch {
              setInviteStatus((prev) => ({ ...prev, [member.email]: 'error' }))
            }
          }
          // Mark setup as complete
          await api.patch(`/organizations/${orgId}/setup`, { setupStep: 4 })
          // Update local restaurant state
          if (restaurant) {
            setRestaurant({ ...restaurant, setupCompleted: true })
          }
          break
        }
      }
      return true
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save. Please try again.')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const nextStep = async () => {
    const saved = await saveStep()
    if (!saved) return

    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1)
    } else {
      navigate('/admin')
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setError('')
      setCurrentStep(currentStep - 1)
    }
  }

  // ─── CSV Upload ─────────────────────────────────────────

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !orgId) return

    setIsLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/organizations/${orgId}/tables/import`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('trs_token')}`,
          },
          body: formData,
        }
      )
      const json = await response.json()
      if (!response.ok) throw new ApiError(json.error || 'Upload failed', response.status)
      setError('')
      alert(`Successfully imported ${json.data?.count || 'your'} tables!`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'CSV upload failed. Check your file format.')
    } finally {
      setIsLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // ─── Team Management ────────────────────────────────────

  const addMember = () => {
    if (!teamEmail || invitedMembers.some((m) => m.email === teamEmail)) return
    setInvitedMembers([...invitedMembers, { email: teamEmail, role: teamRole }])
    setInviteStatus((prev) => ({ ...prev, [teamEmail]: 'pending' }))
    setTeamEmail('')
  }

  const removeMember = (index: number) => {
    const removed = invitedMembers[index]
    setInvitedMembers(invitedMembers.filter((_, i) => i !== index))
    if (removed) {
      setInviteStatus((prev) => {
        const next = { ...prev }
        delete next[removed.email]
        return next
      })
    }
  }

  // ─── Render Steps ───────────────────────────────────────

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>Restaurant Details</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '12px' }}>Address</label>
                <input
                  type="text"
                  value={details.address}
                  onChange={(e) => setDetails({ ...details, address: e.target.value })}
                  placeholder="123 Main Street, London"
                  style={{ width: '100%', backgroundColor: '#ffffff', border: '1px solid #d1d5db', borderRadius: '10px', padding: '16px 20px', color: '#111827', fontSize: '1rem', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '12px' }}>Opening Time</label>
                  <input
                    type="text"
                    value={details.openingTime}
                    onChange={(e) => setDetails({ ...details, openingTime: e.target.value })}
                    style={{ width: '100%', backgroundColor: '#ffffff', border: '1px solid #d1d5db', borderRadius: '10px', padding: '16px 20px', color: '#111827', fontSize: '1.125rem', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '12px' }}>Closing Time</label>
                  <input
                    type="text"
                    value={details.closingTime}
                    onChange={(e) => setDetails({ ...details, closingTime: e.target.value })}
                    style={{ width: '100%', backgroundColor: '#ffffff', border: '1px solid #d1d5db', borderRadius: '10px', padding: '16px 20px', color: '#111827', fontSize: '1.125rem', outline: 'none' }}
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '24px' }}>Floor Map Setup</h2>
            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleCsvUpload} style={{ display: 'none' }} />
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed #9ca3af', borderRadius: '12px', padding: '48px',
                textAlign: 'center', cursor: 'pointer', marginBottom: '24px', backgroundColor: 'transparent'
              }}
            >
              <Upload size={24} style={{ color: '#6b7280', margin: '0 auto 12px' }} />
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>Upload CSV</p>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>Table number, capacity, area, type</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', flex: 1 }}>Sample Sheet</h3>
              <button style={{
                backgroundColor: '#C99C63', color: '#ffffff', border: 'none', borderRadius: '8px',
                padding: '8px 16px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <Download size={14} /> Download
              </button>
            </div>
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #d1d5db', borderRadius: '12px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  {['Table', 'Capacity', 'Area', 'Type'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#111827' }}>{h}</th>
                  ))}
                </tr>
                </thead>
                <tbody>
                  {[
                    { t: '#1', c: '1-2', a: 'Window', ty: 'Window' },
                    { t: '#2', c: '3-4', a: 'Main Dining', ty: 'Main Dining' },
                    { t: '#3', c: '1-2', a: 'Outdoor', ty: 'Outdoor' },
                  ].map(r => (
                    <tr key={r.t} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '14px 16px', color: '#6b7280' }}>{r.t}</td>
                      <td style={{ padding: '14px 16px', color: '#6b7280' }}>{r.c}</td>
                      <td style={{ padding: '14px 16px', color: '#6b7280' }}>{r.a}</td>
                      <td style={{ padding: '14px 16px', color: '#6b7280' }}>{r.ty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )

      case 3:
        return (
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '24px' }}>Table Rules</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { key: 'mergeable' as const, title: 'Mergeable Tables', desc: 'Allow combining adjacent tables for large parties' },
                { key: 'walkIns' as const, title: 'Walk-ins Allowed', desc: 'Allow staff to seat guests without reservations' },
              ].map((rule) => (
                <div key={rule.key} style={{
                  border: '1px solid #d1d5db', borderRadius: '12px', padding: '20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff'
                }}>
                  <div>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>{rule.title}</h3>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>{rule.desc}</p>
                  </div>
                  <button
                    onClick={() => setRules({ ...rules, [rule.key]: !rules[rule.key] })}
                    style={{
                      width: '44px', height: '24px', borderRadius: '999px',
                      backgroundColor: rules[rule.key] ? '#5E8B6A' : '#d1d5db',
                      border: 'none', position: 'relative', cursor: 'pointer', transition: 'background-color 0.2s'
                    }}
                  >
                    <div style={{
                      width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#ffffff',
                      position: 'absolute', top: '2px', left: rules[rule.key] ? '22px' : '2px', transition: 'left 0.2s'
                    }} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )

      case 4:
        return (
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '24px' }}>Invite Your Team</h2>
            <div style={{ display: 'flex', alignItems: 'end', gap: '12px', marginBottom: '24px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>Team Member Email</label>
                <input
                  type="email"
                  value={teamEmail}
                  onChange={(e) => setTeamEmail(e.target.value)}
                  placeholder="john@example.com"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMember())}
                  style={{ width: '100%', backgroundColor: '#ffffff', border: '1px solid #d1d5db', borderRadius: '10px', padding: '12px 16px', color: '#111827', fontSize: '0.875rem', outline: 'none' }}
                />
              </div>
              <div style={{ width: '200px' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>Role</label>
                <select
                  value={teamRole}
                  onChange={(e) => setTeamRole(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#ffffff', border: '1px solid #d1d5db', borderRadius: '10px', padding: '12px 16px', color: '#111827', fontSize: '0.875rem', outline: 'none', appearance: 'none' }}
                >
                  <option value="manager">Manager</option>
                  <option value="host">Host</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <button
                onClick={addMember}
                style={{ backgroundColor: '#C99C63', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '12px 24px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}
              >
                Add
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {invitedMembers.map((member, i) => {
                const status = inviteStatus[member.email]
                return (
                  <div key={i} style={{
                    border: '1px solid #d1d5db', borderRadius: '12px', padding: '16px 20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#EAF4EC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5E8B6A' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>
                      <span style={{ fontSize: '0.875rem', color: '#111827' }}>{member.email}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{
                        fontSize: '0.75rem', fontWeight: 500, padding: '4px 12px', borderRadius: '999px',
                        backgroundColor: status === 'sent' ? 'rgba(94,139,106,0.15)' : status === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(201,156,99,0.15)',
                        color: status === 'sent' ? '#5E8B6A' : status === 'error' ? '#f87171' : '#C99C63'
                      }}>
                        {status === 'sent' ? '✓ Sent' : status === 'error' ? 'Failed' : member.role}
                      </span>
                      <button
                        onClick={() => removeMember(i)}
                        style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '4px' }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                )
              })}
              {invitedMembers.length === 0 && (
                <p style={{ color: '#9ca3af', fontSize: '0.875rem', textAlign: 'center', padding: '24px 0' }}>
                  No team members added yet. You can skip this step and add them later.
                </p>
              )}
            </div>
          </div>
        )
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#EFF3F8', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Navbar variant="setup" theme="light" />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 16px' }}>
        {/* Chef Hat Icon */}
        <div style={{ width: '72px', height: '72px', borderRadius: '9999px', backgroundColor: '#E0EAE2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '32px', marginBottom: '16px' }}>
          <ChefHat size={36} style={{ color: '#5E8B6A' }} strokeWidth={1.5} />
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', marginTop: '0', marginBottom: '32px', textAlign: 'center' }}>
          Restaurant Setup
        </h1>

        {/* Progress Bar */}
        <div style={{ width: '100%', maxWidth: '900px', marginBottom: '24px' }}>
          <ProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} percentage={percentage} />
        </div>

        {/* Main Step Content Card */}
        <div style={{ width: '100%', maxWidth: '900px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '40px', marginBottom: '24px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
          {error && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '10px 16px', marginBottom: '16px', color: '#ef4444', fontSize: '0.8125rem' }}>
              {error}
            </div>
          )}
          {renderStep()}
        </div>

        {/* Footer Navigation */}
        <div style={{ width: '100%', maxWidth: '900px', paddingBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              style={{
                backgroundColor: '#ffffff', color: currentStep === 1 ? '#d1d5db' : '#111827',
                border: '1px solid #d1d5db', borderRadius: '8px', padding: '12px 24px',
                fontSize: '1rem', fontWeight: 600, cursor: currentStep === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Back
            </button>

            {/* Pagination Dots */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div key={i} style={{
                  width: i + 1 === currentStep ? '24px' : '8px', height: '8px', borderRadius: '999px',
                  backgroundColor: i + 1 === currentStep ? '#C99C63' : i + 1 < currentStep ? '#5E8B6A' : '#d1d5db',
                  transition: 'all 0.3s ease'
                }} />
              ))}
            </div>

            <button
              onClick={nextStep}
              disabled={isLoading}
              style={{
                backgroundColor: isLoading ? '#8b7650' : '#C99C63', color: '#ffffff',
                border: 'none', borderRadius: '8px', padding: '12px 48px',
                fontSize: '1rem', fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? 'Saving...' : currentStep === TOTAL_STEPS ? 'Complete Setup' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
