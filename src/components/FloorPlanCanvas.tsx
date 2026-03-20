import { useState, useRef, useCallback, useEffect, type ReactElement } from 'react'
import api from '../lib/api'

// ─── Types ──────────────────────────────────────────────

export interface FloorTable {
  id: string
  tableNumber: string
  name: string
  capacity: number
  minCapacity?: number
  area?: { id: string; name: string } | null
  shape?: string
  type?: string
  isMergeable?: boolean
  mergeGroupId?: string | null
  splitParentId?: string | null
  positionX: number | null
  positionY: number | null
  width?: number
  height?: number
  status?: string
}

export interface FloorPlanCanvasProps {
  tables: FloorTable[]
  orgId: string
  viewMode: 'standard' | 'merged' | 'split'
  getTableStatus: (table: FloorTable) => string
  onTableClick?: (table: FloorTable) => void
  onPositionsChange?: (positions: Record<string, { x: number; y: number }>) => void
  onSaveStart?: () => void
  onSaveEnd?: (result?: { updated: number } | null) => void
  onSaveError?: (err: any) => void
}

// ─── Constants ──────────────────────────────────────────

const CANVAS_WIDTH = 1100
const CANVAS_HEIGHT = 850
const TABLE_W = 120
const TABLE_H = 90
const MERGED_TABLE_W = 180
const MERGED_TABLE_H = 130
const SPLIT_TABLE_W = 80
const SPLIT_TABLE_H = 65
const CHAIR_PAD = 18
const GRID_SIZE = 20

// ─── Status Colors ──────────────────────────────────────

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  arriving: { color: '#C99C63', bg: 'rgba(201,156,99,0.25)' },
  arriving_soon: { color: '#C99C63', bg: 'rgba(201,156,99,0.25)' },
  seated: { color: '#E5484D', bg: 'rgba(229,72,77,0.2)' },
  confirmed: { color: '#00B5CE', bg: 'rgba(0,181,206,0.2)' },
  available: { color: '#6B9E78', bg: 'rgba(107,158,120,0.2)' },
  pending: { color: '#d29922', bg: 'rgba(210,153,34,0.2)' },
  cancelled: { color: '#8b949e', bg: 'rgba(139,148,158,0.2)' },
  'no-show': { color: '#8b949e', bg: 'rgba(139,148,158,0.2)' },
}

const getStatusStyle = (status: string) =>
  STATUS_COLORS[status?.toLowerCase()] || STATUS_COLORS.available

// ─── Area Layout ────────────────────────────────────────

interface AreaZone {
  name: string
  x: number
  y: number
  w: number
  h: number
}

const AREA_ZONES: AreaZone[] = [
  { name: 'Window', x: 0, y: 0, w: 160, h: 720 },
  { name: 'Main Dining', x: 180, y: 0, w: 580, h: 720 },
  { name: 'Private', x: 780, y: 0, w: 320, h: 720 },
]

const LANDMARKS = [
  { label: 'Entrance', x: 20, y: 730 },
  { label: 'Reception', x: 220, y: 700 },
  { label: 'Stairway', x: 180, y: 800 },
]

// ─── Helpers ────────────────────────────────────────────

function autoLayoutTables(tables: FloorTable[]): FloorTable[] {
  const areaNames = [...new Set(tables.map(t => t.area?.name || 'Other'))]
  const areaZoneMap: Record<string, AreaZone> = {}

  // Map area names to zones by position order
  areaNames.forEach((name, i) => {
    const matchedZone = AREA_ZONES.find(z => z.name.toLowerCase() === name.toLowerCase())
    areaZoneMap[name] = matchedZone || {
      name,
      x: 180 + (i * 200),
      y: 0,
      w: 400,
      h: 700,
    }
  })

  // Track positions within each area
  const areaCounters: Record<string, { col: number; row: number }> = {}

  return tables.map(t => {
    if (t.positionX != null && t.positionY != null) return t // Already positioned

    const areaName = t.area?.name || 'Other'
    const zone = areaZoneMap[areaName]
    if (!areaCounters[areaName]) areaCounters[areaName] = { col: 0, row: 0 }
    const counter = areaCounters[areaName]

    const cols = Math.max(1, Math.floor((zone.w - 20) / (TABLE_W + 30)))
    const x = zone.x + 20 + counter.col * (TABLE_W + 30)
    const y = zone.y + 50 + counter.row * (TABLE_H + 50)

    counter.col++
    if (counter.col >= cols) {
      counter.col = 0
      counter.row++
    }

    return { ...t, positionX: x, positionY: y }
  })
}

function getMergedGroups(tables: FloorTable[]): Map<string, FloorTable[]> {
  const groups = new Map<string, FloorTable[]>()
  for (const t of tables) {
    if (t.mergeGroupId) {
      const arr = groups.get(t.mergeGroupId) || []
      arr.push(t)
      groups.set(t.mergeGroupId, arr)
    }
  }
  return groups
}

// ─── Chair SVG ──────────────────────────────────────────

function ChairRow({ dir, count, cx, cy, w, h }: { dir: 'top' | 'bottom' | 'left' | 'right'; count: number; cx: number; cy: number; w: number; h: number }) {
  const chairs = []
  const CHAIR_SIZE = 10
  const GAP = 6

  if (dir === 'top' || dir === 'bottom') {
    const totalW = count * CHAIR_SIZE + (count - 1) * GAP
    const startX = cx + (w - totalW) / 2
    const y = dir === 'top' ? cy - CHAIR_PAD : cy + h + CHAIR_PAD - CHAIR_SIZE
    for (let i = 0; i < count; i++) {
      chairs.push(
        <rect
          key={`${dir}-${i}`}
          x={startX + i * (CHAIR_SIZE + GAP)}
          y={y}
          width={CHAIR_SIZE}
          height={CHAIR_SIZE}
          rx={3}
          fill="#30363d"
          opacity={0.6}
        />
      )
    }
  } else {
    const totalH = count * CHAIR_SIZE + (count - 1) * GAP
    const startY = cy + (h - totalH) / 2
    const x = dir === 'left' ? cx - CHAIR_PAD : cx + w + CHAIR_PAD - CHAIR_SIZE
    for (let i = 0; i < count; i++) {
      chairs.push(
        <rect
          key={`${dir}-${i}`}
          x={x}
          y={startY + i * (CHAIR_SIZE + GAP)}
          width={CHAIR_SIZE}
          height={CHAIR_SIZE}
          rx={3}
          fill="#30363d"
          opacity={0.6}
        />
      )
    }
  }

  return <>{chairs}</>
}

// ─── Table Card Component ───────────────────────────────

interface TableCardProps {
  table: FloorTable
  x: number
  y: number
  w: number
  h: number
  status: string
  isDragging: boolean
  label?: string
  capacityLabel?: string
  onPointerDown: (e: React.PointerEvent, tableId: string) => void
  onClick?: () => void
}

function TableCard({ table, x, y, w, h, status, isDragging, label, capacityLabel, onPointerDown, onClick }: TableCardProps) {
  const statusStyle = getStatusStyle(status)
  const chairCount = Math.max(1, Math.ceil(table.capacity / 4))

  return (
    <g
      transform={`translate(${x},${y})`}
      style={{ cursor: isDragging ? 'grabbing' : 'grab', transition: isDragging ? 'none' : 'transform 0.15s ease' }}
      onPointerDown={(e) => onPointerDown(e, table.id)}
      onClick={onClick}
    >
      {/* Chair indicators */}
      <ChairRow dir="top" count={chairCount} cx={0} cy={0} w={w} h={h} />
      <ChairRow dir="bottom" count={chairCount} cx={0} cy={0} w={w} h={h} />
      <ChairRow dir="left" count={Math.max(1, chairCount - 1)} cx={0} cy={0} w={w} h={h} />
      <ChairRow dir="right" count={Math.max(1, chairCount - 1)} cx={0} cy={0} w={w} h={h} />

      {/* Table body */}
      <rect
        x={0}
        y={0}
        width={w}
        height={h}
        rx={8}
        fill="#161b22"
        stroke={isDragging ? '#C99C63' : '#30363d'}
        strokeWidth={isDragging ? 2 : 1}
      />

      {/* Status badge */}
      <rect
        x={w / 2 - 30}
        y={8}
        width={60}
        height={18}
        rx={9}
        fill={statusStyle.bg}
      />
      <text
        x={w / 2}
        y={20}
        textAnchor="middle"
        fill={statusStyle.color}
        fontSize="9"
        fontWeight="600"
        fontFamily="Inter, system-ui, sans-serif"
        style={{ textTransform: 'capitalize' }}
      >
        {status}
      </text>

      {/* Table name */}
      <text
        x={w / 2}
        y={h / 2 + 4}
        textAnchor="middle"
        fill="#ffffff"
        fontSize={w > 100 ? '13' : '11'}
        fontWeight="700"
        fontFamily="Inter, system-ui, sans-serif"
      >
        {label || `Table ${table.tableNumber}`}
      </text>

      {/* Capacity */}
      <text
        x={w / 2}
        y={h - 10}
        textAnchor="middle"
        fill="#8b949e"
        fontSize="10"
        fontFamily="Inter, system-ui, sans-serif"
      >
        {capacityLabel || `Capacity ${table.capacity}`}
      </text>
    </g>
  )
}

// ─── Main Component ─────────────────────────────────────

export default function FloorPlanCanvas({
  tables,
  orgId,
  viewMode,
  getTableStatus,
  onTableClick,
  onPositionsChange,
  onSaveStart,
  onSaveEnd,
  onSaveError,
}: FloorPlanCanvasProps) {
  // Local positions state for drag-and-drop
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({})
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const svgRef = useRef<SVGSVGElement>(null)
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Initialize positions from tables data
  useEffect(() => {
    const laid = autoLayoutTables(tables)
    const posMap: Record<string, { x: number; y: number }> = {}
    laid.forEach(t => {
      posMap[t.id] = { x: t.positionX ?? 0, y: t.positionY ?? 0 }
    })
    setPositions(posMap)
    if (typeof onPositionsChange === 'function') onPositionsChange(posMap)
  }, [tables])

  // Debounced save to backend
  const savePositions = useCallback((posMap: Record<string, { x: number; y: number }>) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(async () => {
      const posArray = Object.entries(posMap).map(([id, pos]) => ({
        id,
        positionX: Math.round(pos.x),
        positionY: Math.round(pos.y),
      }))
      try {
        if (typeof onSaveStart === 'function') onSaveStart()
        const res = await api.patch(`/organizations/${orgId}/tables/positions`, { positions: posArray })
        if (typeof onSaveEnd === 'function') onSaveEnd((res.data as { updated: number } | null) || null)
      } catch (err) {
        console.error('Failed to save table positions:', err)
        if (typeof onSaveError === 'function') onSaveError(err)
      }
    }, 800)
  }, [orgId])

  // Pointer handlers
  const handlePointerDown = useCallback((e: React.PointerEvent, tableId: string) => {
    e.preventDefault()
    e.stopPropagation()
    const svg = svgRef.current
    if (!svg) return

    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const svgPt = pt.matrixTransform(svg.getScreenCTM()?.inverse())

    const pos = positions[tableId] || { x: 0, y: 0 }
    setDragOffset({ x: svgPt.x - pos.x, y: svgPt.y - pos.y })
    setDraggingId(tableId)
    ;(e.target as Element).setPointerCapture(e.pointerId)
  }, [positions])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingId) return
    const svg = svgRef.current
    if (!svg) return

    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const svgPt = pt.matrixTransform(svg.getScreenCTM()?.inverse())

    let newX = svgPt.x - dragOffset.x
    let newY = svgPt.y - dragOffset.y

    // Snap to grid
    if (e.shiftKey) {
      newX = Math.round(newX / GRID_SIZE) * GRID_SIZE
      newY = Math.round(newY / GRID_SIZE) * GRID_SIZE
    }

    // Clamp to canvas
    newX = Math.max(0, Math.min(CANVAS_WIDTH - TABLE_W, newX))
    newY = Math.max(0, Math.min(CANVAS_HEIGHT - TABLE_H, newY))

    setPositions(prev => ({
      ...prev,
      [draggingId]: { x: newX, y: newY },
    }))
    // Notify parent of live position changes for optimistic updates
    // (capture latest positions synchronously by reading svgRef current state)
    try {
      if (typeof onPositionsChange === 'function') {
        // Construct updated map
        const updated = { ...positions, [draggingId]: { x: newX, y: newY } }
        onPositionsChange(updated)
      }
    } catch {}
  }, [draggingId, dragOffset])

  const handlePointerUp = useCallback(() => {
    if (draggingId) {
      setDraggingId(null)
      savePositions(positions)
      if (typeof onPositionsChange === 'function') onPositionsChange(positions)
    }
  }, [draggingId, positions, savePositions])

  // ─── Build Render Lists ────────────────────────────────

  const renderTables = () => {
    if (viewMode === 'merged') {
      return renderMergedView()
    } else if (viewMode === 'split') {
      return renderSplitView()
    }
    return renderStandardView()
  }

  const renderStandardView = () => {
    return tables.map(table => {
      const pos = positions[table.id] || { x: 0, y: 0 }
      return (
        <TableCard
          key={table.id}
          table={table}
          x={pos.x}
          y={pos.y}
          w={TABLE_W}
          h={TABLE_H}
          status={getTableStatus(table)}
          isDragging={draggingId === table.id}
          onPointerDown={handlePointerDown}
          onClick={() => onTableClick?.(table)}
        />
      )
    })
  }

  const renderMergedView = () => {
    const mergedGroups = getMergedGroups(tables)
    const mergedIds = new Set<string>()
    const elements: ReactElement[] = []

    // Render merged groups
    mergedGroups.forEach((group, groupId) => {
      group.forEach(t => mergedIds.add(t.id))
      const totalCap = group.reduce((sum, t) => sum + t.capacity, 0)
      const primary = group[0]
      const pos = positions[primary.id] || { x: 0, y: 0 }
      const mergedTable = { ...primary, capacity: totalCap }

      elements.push(
        <TableCard
          key={`merge-${groupId}`}
          table={mergedTable}
          x={pos.x}
          y={pos.y}
          w={MERGED_TABLE_W}
          h={MERGED_TABLE_H}
          status={getTableStatus(primary)}
          isDragging={draggingId === primary.id}
          label={`Table ${group.map(t => t.tableNumber).join('-')}`}
          capacityLabel={`Capacity ${totalCap}`}
          onPointerDown={handlePointerDown}
          onClick={() => onTableClick?.(primary)}
        />
      )
    })

    // Render non-merged tables
    tables.filter(t => !mergedIds.has(t.id)).forEach(table => {
      const pos = positions[table.id] || { x: 0, y: 0 }
      elements.push(
        <TableCard
          key={table.id}
          table={table}
          x={pos.x}
          y={pos.y}
          w={TABLE_W}
          h={TABLE_H}
          status={getTableStatus(table)}
          isDragging={draggingId === table.id}
          onPointerDown={handlePointerDown}
          onClick={() => onTableClick?.(table)}
        />
      )
    })

    return elements
  }

  const renderSplitView = () => {
    const elements: ReactElement[] = []
    const splitParents = new Set(tables.filter(t => t.splitParentId).map(t => t.splitParentId!))

    tables.forEach(table => {
      const pos = positions[table.id] || { x: 0, y: 0 }

      if (table.splitParentId) {
        // This IS a split sub-table — render small
        elements.push(
          <TableCard
            key={table.id}
            table={table}
            x={pos.x}
            y={pos.y}
            w={SPLIT_TABLE_W}
            h={SPLIT_TABLE_H}
            status={getTableStatus(table)}
            isDragging={draggingId === table.id}
            label={table.tableNumber}
            capacityLabel={`${table.capacity}`}
            onPointerDown={handlePointerDown}
            onClick={() => onTableClick?.(table)}
          />
        )
      } else if (!splitParents.has(table.id)) {
        // Not a parent of any split, render normally
        elements.push(
          <TableCard
            key={table.id}
            table={table}
            x={pos.x}
            y={pos.y}
            w={TABLE_W}
            h={TABLE_H}
            status={getTableStatus(table)}
            isDragging={draggingId === table.id}
            onPointerDown={handlePointerDown}
            onClick={() => onTableClick?.(table)}
          />
        )
      }
      // Split parents are hidden in split view (their children replace them)
    })

    return elements
  }

  // ─── Render ────────────────────────────────────────────

  return (
    <div style={{ position: 'relative', width: '100%', overflow: 'auto' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
        width="100%"
        style={{
          backgroundColor: '#0B1517',
          borderRadius: '12px',
          minHeight: '600px',
          touchAction: 'none',
          userSelect: 'none',
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Area Zone Labels */}
        {AREA_ZONES.map(zone => (
          <g key={zone.name}>
            <rect
              x={zone.x}
              y={zone.y}
              width={zone.w}
              height={zone.h}
              fill="none"
              stroke="#1e2a2d"
              strokeWidth={1}
              strokeDasharray="4 4"
              rx={8}
            />
            <text
              x={zone.x + 15}
              y={22}
              fill="#C99C63"
              fontSize="13"
              fontWeight="700"
              fontFamily="Inter, system-ui, sans-serif"
              style={{ textTransform: 'uppercase' }}
            >
              {zone.name}
            </text>
          </g>
        ))}

        {/* Landmarks */}
        {LANDMARKS.map(lm => (
          <text
            key={lm.label}
            x={lm.x}
            y={lm.y}
            fill="#8b949e"
            fontSize="11"
            fontFamily="Inter, system-ui, sans-serif"
          >
            {lm.label}
          </text>
        ))}

        {/* Tables */}
        {renderTables()}
      </svg>
    </div>
  )
}
