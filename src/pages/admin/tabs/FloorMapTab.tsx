import { useState, useRef, useEffect } from 'react'
import { Upload, Download, Loader2 } from 'lucide-react'
import api, { ApiError, BASE_URL } from '../../../lib/api'

interface FloorMapTabProps {
  theme: 'dark' | 'light'
  orgId?: string
}

interface TableRow {
  id: string
  table_number: string
  capacity: number
  area_name?: string
  table_type?: string
}

export default function FloorMapTab({ theme, orgId }: FloorMapTabProps) {
  const isDark = theme === 'dark'
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [tables, setTables] = useState<TableRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [uploadMsg, setUploadMsg] = useState('')

  useEffect(() => {
    if (!orgId) return
    const fetchTables = async () => {
      setIsLoading(true)
      try {
        const res = await api.get<TableRow[]>(`/organizations/${orgId}/tables`)
        setTables(res.data || [])
      } catch { /* silent */ } finally {
        setIsLoading(false)
      }
    }
    fetchTables()
  }, [orgId])

  const handleUploadClick = () => fileInputRef.current?.click()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !orgId) return

    setIsUploading(true)
    setError('')
    setUploadMsg('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch(`${BASE_URL}/organizations/${orgId}/tables/import`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('trs_token')}` },
        body: formData,
      })
      const json = await response.json()
      if (!response.ok) throw new ApiError(json.error || 'Upload failed', response.status)

      setUploadMsg(`Successfully imported ${json.data?.count || ''} tables!`)
      // Refresh table list
      const res = await api.get<TableRow[]>(`/organizations/${orgId}/tables`)
      setTables(res.data || [])
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'CSV upload failed. Check your file format.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const displayData = tables.length > 0 ? tables : [
    { id: 's1', table_number: '#1', capacity: 2, area_name: 'Window', table_type: 'Window' },
    { id: 's2', table_number: '#2', capacity: 4, area_name: 'Main Dining', table_type: 'Main Dining' },
    { id: 's3', table_number: '#3', capacity: 2, area_name: 'Outdoor', table_type: 'Outdoor' },
  ]
  const isSampleData = tables.length === 0

  return (
    <div>
      <input type="file" accept=".csv" style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileChange} />

      {/* Upload Zone */}
      <div
        onClick={handleUploadClick}
        style={{
          border: `1px dashed ${isDark ? '#4b5563' : '#d1d5db'}`, borderRadius: '12px', padding: '48px',
          textAlign: 'center', cursor: isUploading ? 'not-allowed' : 'pointer', marginBottom: '32px',
          backgroundColor: isDark ? '#161B22' : '#ffffff', transition: 'border-color 0.2s',
          opacity: isUploading ? 0.6 : 1,
        }}
        onMouseOver={(e) => !isUploading && (e.currentTarget.style.borderColor = isDark ? '#ffffff' : '#6b7280')}
        onMouseOut={(e) => (e.currentTarget.style.borderColor = isDark ? '#4b5563' : '#d1d5db')}
      >
        {isUploading ? (
          <Loader2 size={24} style={{ margin: '0 auto 12px', color: '#C99C63', animation: 'spin 1s linear infinite' }} />
        ) : (
          <Upload size={24} style={{ margin: '0 auto 12px auto', color: isDark ? '#ffffff' : '#4b5563' }} />
        )}
        <p style={{ fontWeight: 600, fontSize: '0.875rem', color: isDark ? '#ffffff' : '#1f2937', margin: 0 }}>
          {isUploading ? 'Uploading...' : 'Upload CSV'}
        </p>
        <p style={{ fontSize: '0.75rem', marginTop: '4px', color: isDark ? '#8b949e' : '#6b7280', margin: '4px 0 0' }}>
          Table number, capacity, area, type
        </p>
      </div>

      {/* Feedback Messages */}
      {error && <div style={{ color: '#ef4444', fontSize: '0.8125rem', marginBottom: '16px', textAlign: 'center' }}>{error}</div>}
      {uploadMsg && <div style={{ color: '#5E8B6A', fontSize: '0.8125rem', marginBottom: '16px', textAlign: 'center' }}>{uploadMsg}</div>}

      {/* Table header */}
      <div className="res-admin-tab-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0, color: isDark ? '#ffffff' : '#1f2937' }}>
          {isSampleData ? 'Sample Sheet' : `Your Tables (${tables.length})`}
        </h3>
        <button style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
          backgroundColor: '#C99C63', color: '#ffffff', fontWeight: 500, borderRadius: '8px',
          border: 'none', fontSize: '0.875rem', cursor: 'pointer'
        }}>
          <Download size={16} /> Download
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
          <Loader2 size={24} style={{ color: '#C99C63', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div style={{ borderRadius: '12px', border: `1px solid ${isDark ? '#30363d' : '#e5e7eb'}`, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${isDark ? '#30363d' : '#e5e7eb'}`, backgroundColor: isDark ? '#101A1C' : '#f9fafb' }}>
                  {['Table', 'Capacity', 'Area', 'Type'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '16px 24px', fontWeight: 600, color: isDark ? '#ffffff' : '#4b5563' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayData.map((row) => (
                  <tr key={row.id}
                    style={{ borderBottom: `1px solid ${isDark ? '#30363d' : '#e5e7eb'}`, transition: 'background-color 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = isDark ? '#161B22' : '#f9fafb'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '16px 24px', color: isDark ? '#e6edf3' : '#1f2937' }}>{row.table_number}</td>
                    <td style={{ padding: '16px 24px', color: isDark ? '#e6edf3' : '#4b5563' }}>{row.capacity}</td>
                    <td style={{ padding: '16px 24px', color: isDark ? '#e6edf3' : '#4b5563' }}>{row.area_name || '—'}</td>
                    <td style={{ padding: '16px 24px', color: isDark ? '#e6edf3' : '#4b5563' }}>{row.table_type || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
