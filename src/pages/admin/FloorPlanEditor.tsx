import { useEffect, useState } from 'react'
import FloorPlanCanvas, { FloorTable } from '../../components/FloorPlanCanvas'
import api, { ApiError } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

export default function FloorPlanEditor() {
  const { restaurant, user } = useAuth()
  const orgId = restaurant?.id || ''

  const [tables, setTables] = useState<FloorTable[]>([])
  const [areas, setAreas] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<FloorTable | null>(null)
  const [editMode, setEditMode] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const lastSnapshotRef = ({} as any) as { current: FloorTable[] }

  useEffect(() => {
    if (!orgId) return
    loadData()
  }, [orgId])

  async function loadData() {
    setLoading(true)
    try {
      const [tRes, aRes] = await Promise.all([
        api.get<FloorTable[]>(`/organizations/${orgId}/tables`),
        api.get<{ id: string; name: string }[]>(`/organizations/${orgId}/areas`),
      ])
      if (tRes.success && tRes.data) setTables(tRes.data)
      if (aRes.success && aRes.data) setAreas(aRes.data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load floorplan')
    } finally {
      setLoading(false)
    }
  }

  // --- Area Management ---
  const [areaName, setAreaName] = useState('')
  const handleCreateArea = async () => {
    try {
      const res = await api.post(`/organizations/${orgId}/areas`, { name: areaName })
      if (res.success && res.data) {
        setAreas(prev => [...prev, res.data as { id: string; name: string }])
        setAreaName('')
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create area')
    }
  }

  const handleUpdateArea = async (id: string, name: string) => {
    try {
      const res = await api.put(`/organizations/${orgId}/areas/${id}`, { name })
      if (res.success && res.data) {
        setAreas(prev => prev.map(a => a.id === id ? (res.data as { id: string; name: string }) : a))
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update area')
    }
  }

  const handleDeleteArea = async (id: string) => {
    try {
      await api.delete(`/organizations/${orgId}/areas/${id}`)
      setAreas(prev => prev.filter(a => a.id !== id))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete area')
    }
  }

  // --- CSV Import / Export ---
  const handleImportCsv = async (file: File | null) => {
    if (!file) return
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`${(window as any).__API_BASE__ || ''}${''}/organizations/${orgId}/tables/import`, {
        method: 'POST',
        body: form,
        headers: {
          // let the browser set multipart boundaries
        },
      })
      const json = await res.json()
      if (json.success) {
        // reload tables
        await loadData()
      } else {
        setError(json.error || 'Import failed')
      }
    } catch (err) {
      setError('Import failed')
    }
  }

  const handleExportCsv = () => {
    const headers = ['Section', 'Table Name', 'Capacity']
    const rows = tables.map(t => [t.area?.name || '', `Table ${t.tableNumber}`, String(t.capacity)])
    const csv = [headers.join(','), ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `floorplan-${restaurant?.slug || orgId}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const handleTableClick = (table: FloorTable) => {
    if (!editMode) return
    setSelected(table)
  }

  const handleCreateTable = async () => {
    if (!orgId) return
    try {
      const payload = {
        tableNumber: String((tables.length || 0) + 1),
        capacity: 4,
        name: `Table ${tables.length + 1}`,
        positionX: 200,
        positionY: 200,
      }
      const res = await api.post(`/organizations/${orgId}/tables`, payload)
      if (res.success && res.data) {
        setTables(prev => [...prev, res.data as FloorTable])
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create table')
    }
  }

  const handleUpdateTable = async (patch: Partial<FloorTable>) => {
    if (!orgId || !selected) return
    try {
      const res = await api.put(`/organizations/${orgId}/tables/${selected.id}`, patch)
      if (res.success && res.data) {
        setTables(prev => prev.map(t => t.id === selected.id ? (res.data as FloorTable) : t))
        setSelected(res.data as FloorTable)
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update table')
    }
  }

  const handleDeleteTable = async (id: string) => {
    if (!orgId) return
    try {
      await api.delete(`/organizations/${orgId}/tables/${id}`)
      setTables(prev => prev.filter(t => t.id !== id))
      if (selected?.id === id) setSelected(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete table')
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Floor Plan Editor</h2>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button onClick={() => setEditMode(m => !m)} className="btn-outline">{editMode ? 'Disable Edit' : 'Enable Edit'}</button>
          {user?.role === 'manager' || user?.role === 'admin' ? (
            <button onClick={handleCreateTable} className="btn-gold">Add Table</button>
          ) : null}
        </div>
      </div>

      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 12 }}>
        <div style={{ minHeight: 600, borderRadius: 12, overflow: 'hidden' }}>
          <FloorPlanCanvas
            tables={tables}
            orgId={orgId}
            viewMode="standard"
            getTableStatus={() => 'available'}
            onTableClick={handleTableClick}
            onPositionsChange={(posMap) => {
              // Optimistically update local table models with new positions
              setTables(prev => {
                // keep a snapshot to allow rollback
                lastSnapshotRef.current = prev
                return prev.map(t => {
                  const p = posMap[t.id]
                  if (!p) return t
                  return { ...t, positionX: Math.round(p.x), positionY: Math.round(p.y) }
                })
              })
            }}
            onSaveStart={() => setSaving(true)}
            onSaveEnd={() => setSaving(false)}
            onSaveError={(err) => {
              setSaving(false)
              // rollback to last snapshot
              if (lastSnapshotRef.current) setTables(lastSnapshotRef.current)
              setError('Failed to persist positions — changes rolled back')
            }}
          />
        </div>

        <div className="glass-card" style={{ padding: 16, height: '100%', minHeight: 600 }}>
          {saving && <div style={{ marginBottom: 8, color: 'var(--color-gold)' }}>Saving positions...</div>}
          <h3>Table Properties</h3>
          {!selected ? (
            <p className="text-dark-text-secondary">Select a table on the canvas to edit its properties.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label className="text-[12px] font-bold">Name</label>
              <input value={selected.name} onChange={(e) => setSelected({ ...selected, name: e.target.value })} className="input-dark" />

              <label className="text-[12px] font-bold">Capacity</label>
              <input type="number" value={selected.capacity} onChange={(e) => setSelected({ ...selected, capacity: parseInt(e.target.value || '1', 10) })} className="input-dark" />

              <label className="text-[12px] font-bold">Area</label>
              <select value={selected.area?.id || ''} onChange={(e) => setSelected({ ...selected, area: e.target.value ? { id: e.target.value, name: areas.find(a => a.id === e.target.value)?.name || '' } : null })} className="input-dark">
                <option value="">(none)</option>
                {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>

              <label className="text-[12px] font-bold">Position X</label>
              <input type="number" value={selected.positionX ?? 0} onChange={(e) => setSelected({ ...selected, positionX: parseFloat(e.target.value || '0') })} className="input-dark" />

              <label className="text-[12px] font-bold">Position Y</label>
              <input type="number" value={selected.positionY ?? 0} onChange={(e) => setSelected({ ...selected, positionY: parseFloat(e.target.value || '0') })} className="input-dark" />

              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={() => selected && handleUpdateTable({ name: selected.name, capacity: selected.capacity, area: selected.area, positionX: selected.positionX ?? 0, positionY: selected.positionY ?? 0 } as any)} className="btn-gold">Save</button>
                <button onClick={() => selected && handleDeleteTable(selected.id)} className="btn-outline">Delete</button>
              </div>
            </div>
          )}

          <hr style={{ margin: '16px 0', borderColor: 'var(--color-dark-border)' }} />
          <h3>Areas</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input className="input-dark" value={areaName} onChange={e => setAreaName(e.target.value)} placeholder="New area name" />
            <button onClick={handleCreateArea} className="btn-gold">Create</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {areas.map(a => (
              <div key={a.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input defaultValue={a.name} onBlur={(e) => handleUpdateArea(a.id, e.currentTarget.value)} className="input-dark" />
                <button onClick={() => handleDeleteArea(a.id)} className="btn-outline">Delete</button>
              </div>
            ))}
          </div>

          <hr style={{ margin: '16px 0', borderColor: 'var(--color-dark-border)' }} />
          <h3>Import / Export</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="file" accept=".csv" onChange={e => handleImportCsv(e.target.files ? e.target.files[0] : null)} />
            <button onClick={handleExportCsv} className="btn-gold">Export CSV</button>
          </div>
        </div>
      </div>
    </div>
  )
}
