import { useState, useEffect } from 'react'
import { X, Hash, Users, MapPin, LayoutGrid, Shapes, AlertCircle, Loader2, ArrowRight } from 'lucide-react'
import api, { ApiError } from '../../../lib/api'

interface TableData {
  id: string
  table_number: string
  capacity: number
  area_name?: string
  area_id?: string
  table_type?: string
  shape?: string
  status: string
}

interface Area {
  id: string
  name: string
}

interface AddEditTableModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  orgId?: string
  table?: TableData | null // null = add mode, populated = edit mode
}

export default function AddEditTableModal({
  isOpen,
  onClose,
  onSuccess,
  orgId,
  table,
}: AddEditTableModalProps) {
  const isEditMode = !!table
  const [form, setForm] = useState({
    tableNumber: '',
    capacity: 2,
    areaId: '',
    type: '',
    shape: 'rectangle' as string,
  })
  const [areas, setAreas] = useState<Area[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Populate form when editing
  useEffect(() => {
    if (table) {
      setForm({
        tableNumber: table.table_number || '',
        capacity: table.capacity || 2,
        areaId: table.area_id || '',
        type: table.table_type || '',
        shape: table.shape || 'rectangle',
      })
    } else {
      setForm({ tableNumber: '', capacity: 2, areaId: '', type: '', shape: 'rectangle' })
    }
    setError('')
  }, [table, isOpen])

  // Fetch areas on mount
  useEffect(() => {
    if (!orgId || !isOpen) return
    api.get<Area[]>(`/organizations/${orgId}/tables/areas`)
      .then((res) => setAreas(res.data || []))
      .catch(() => {})
  }, [orgId, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orgId) {
      setError('Restaurant context not found.')
      return
    }
    if (!form.tableNumber.trim()) {
      setError('Table number is required.')
      return
    }
    if (form.capacity < 1) {
      setError('Capacity must be at least 1.')
      return
    }

    setIsSubmitting(true)
    setError('')

    const payload: Record<string, any> = {
      tableNumber: form.tableNumber.trim(),
      capacity: form.capacity,
      shape: form.shape || undefined,
      type: form.type || undefined,
      areaId: form.areaId || undefined,
    }

    try {
      if (isEditMode && table) {
        await api.put(`/organizations/${orgId}/tables/${table.id}`, payload)
      } else {
        await api.post(`/organizations/${orgId}/tables`, payload)
      }
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : `Failed to ${isEditMode ? 'update' : 'create'} table.`)
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

          {/* Header */}
          <div className="relative px-12 pt-12 pb-10 border-b border-[#30363d]/30 overflow-hidden">
            <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 rounded-full blur-3xl opacity-60" style={{ backgroundColor: 'rgba(212,168,86,0.15)' }} />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full blur-3xl opacity-40" style={{ backgroundColor: 'rgba(74,124,89,0.1)' }} />

            <div className="relative flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] leading-none" style={{ backgroundColor: 'rgba(212,168,86,0.08)', border: '1px solid rgba(212,168,86,0.12)', color: 'var(--color-gold)' }}>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full" style={{ backgroundColor: 'rgba(212,168,86,0.75)' }}></span>
                    <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: 'var(--color-gold)' }}></span>
                  </span>
                  Table Setup
                </div>
                <h2 className="text-4xl font-bold text-white tracking-tight">
                  {isEditMode ? 'Edit Table' : 'Add Table'}
                </h2>
                <p style={{ color: 'var(--color-dark-text-secondary)' }} className="text-base mt-2">
                  {isEditMode ? 'Update this table\'s configuration.' : 'Configure a new table for your restaurant.'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 hover:text-white transition-all duration-300 cursor-pointer border border-white/10"
                style={{ color: 'var(--color-dark-text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="p-12">
            {error && (
              <div className="mb-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-400 flex items-start gap-4 animate-shake">
                <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
                  <AlertCircle size={20} className="text-red-500" strokeWidth={2.5} />
                </div>
                <div className="flex-1 pt-0.5">
                  <p className="font-semibold text-red-400 mb-1 leading-none uppercase tracking-wider text-[11px]">Error</p>
                  <p className="opacity-80 mt-1">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Table Number */}
              <div className="space-y-4">
                <label className="text-[11px] font-black text-gold uppercase tracking-[0.2em] pl-1 opacity-90 block">Table Number</label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 transition-all duration-300 group-focus-within:scale-110" style={{ zIndex: 10, color: 'var(--color-dark-text-muted)' }}>
                    <Hash size={22} strokeWidth={2.5} />
                  </div>
                  <input
                    type="text"
                    required
                    value={form.tableNumber}
                    onChange={(e) => setForm({ ...form, tableNumber: e.target.value })}
                    placeholder="e.g. 1, A1, VIP-1"
                    className="input-dark w-full bg-[#0d1117]/80 border-[#30363d] focus:border-gold/60 focus:ring-4 focus:ring-gold/10 transition-all duration-300"
                    style={{ paddingLeft: '60px', height: '64px', fontSize: '1.05rem', borderRadius: '16px' }}
                  />
                </div>
              </div>

              {/* Capacity */}
              <div className="space-y-4">
                <label className="text-[11px] font-black text-gold uppercase tracking-[0.2em] pl-1 opacity-90 block">Capacity</label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 transition-all duration-300 group-focus-within:scale-110" style={{ zIndex: 10, color: 'var(--color-dark-text-muted)' }}>
                    <Users size={22} strokeWidth={2.5} />
                  </div>
                  <input
                    type="number"
                    required
                    min={1}
                    max={50}
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 1 })}
                    placeholder="2"
                    className="input-dark w-full bg-[#0d1117]/80 border-[#30363d] focus:border-gold/60 focus:ring-4 focus:ring-gold/10 transition-all duration-300"
                    style={{ paddingLeft: '60px', height: '64px', fontSize: '1.05rem', borderRadius: '16px' }}
                  />
                </div>
              </div>

              {/* Area */}
              <div className="space-y-4">
                <label className="text-[11px] font-black text-gold uppercase tracking-[0.2em] pl-1 opacity-90 block">Area (Optional)</label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 transition-all duration-300 group-focus-within:scale-110" style={{ zIndex: 10, color: 'var(--color-dark-text-muted)' }}>
                    <MapPin size={22} strokeWidth={2.5} />
                  </div>
                  <select
                    value={form.areaId}
                    onChange={(e) => setForm({ ...form, areaId: e.target.value })}
                    className="input-dark w-full bg-[#0d1117]/80 border-[#30363d] focus:border-gold/60 focus:ring-4 focus:ring-gold/10 transition-all duration-300 appearance-none cursor-pointer"
                    style={{ paddingLeft: '60px', height: '64px', fontSize: '1.05rem', borderRadius: '16px' }}
                  >
                    <option value="" className="bg-[#161B22]">No area assigned</option>
                    {areas.map((a) => (
                      <option key={a.id} value={a.id} className="bg-[#161B22]">{a.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Shape & Type Row */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-gold uppercase tracking-[0.2em] pl-1 opacity-90 block">Shape</label>
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 transition-all duration-300 group-focus-within:scale-110" style={{ zIndex: 10, color: 'var(--color-dark-text-muted)' }}>
                      <Shapes size={20} strokeWidth={2.5} />
                    </div>
                    <select
                      value={form.shape}
                      onChange={(e) => setForm({ ...form, shape: e.target.value })}
                      className="input-dark w-full bg-[#0d1117]/80 border-[#30363d] focus:border-gold/60 focus:ring-4 focus:ring-gold/10 transition-all duration-300 appearance-none cursor-pointer"
                      style={{ paddingLeft: '52px', height: '64px', fontSize: '1.05rem', borderRadius: '16px' }}
                    >
                      <option value="rectangle" className="bg-[#161B22]">Rectangle</option>
                      <option value="round" className="bg-[#161B22]">Round</option>
                      <option value="square" className="bg-[#161B22]">Square</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[11px] font-black text-gold uppercase tracking-[0.2em] pl-1 opacity-90 block">Type (Optional)</label>
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 transition-all duration-300 group-focus-within:scale-110" style={{ zIndex: 10, color: 'var(--color-dark-text-muted)' }}>
                      <LayoutGrid size={20} strokeWidth={2.5} />
                    </div>
                    <input
                      type="text"
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                      placeholder="e.g. Booth, Patio"
                      className="input-dark w-full bg-[#0d1117]/80 border-[#30363d] focus:border-gold/60 focus:ring-4 focus:ring-gold/10 transition-all duration-300"
                      style={{ paddingLeft: '52px', height: '64px', fontSize: '1.05rem', borderRadius: '16px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
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
                  style={{ flex: 1.5, height: '64px', background: 'linear-gradient(135deg, #d4a856 0%, #b88d3e 100%)', color: '#0B1517' }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={24} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      {isEditMode ? 'Save Changes' : 'Add Table'} <ArrowRight size={22} strokeWidth={2.5} />
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
