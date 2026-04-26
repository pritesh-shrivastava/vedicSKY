import type { ApiResponse } from '../../types'
import { SOUTH_GRID } from '../../constants/rashis'
import { PALETTE } from '../../constants/colors'
import { GridCell } from './GridCell'
import { GRAHA_ABBR_DEV, LAGNA_DEV } from '../../constants/grahas'

interface Props {
  data: ApiResponse
  lat: number
  lon: number
}

export function SouthIndianRashi({ data, lat, lon }: Props) {
  const { lagna, grahas } = data

  // Build planet list per rashi
  const rashiPlanets: Record<number, string[]> = {}
  for (let i = 0; i < 12; i++) rashiPlanets[i] = []

  rashiPlanets[lagna.rashi_idx].push(LAGNA_DEV)

  for (const g of grahas) {
    const devAbbr = GRAHA_ABBR_DEV[g.name] ?? g.abbr
    const label = g.is_retrograde ? `(${devAbbr})` : devAbbr
    rashiPlanets[g.rashi_idx].push(label)
  }

  const now = new Date(data.timestamp)
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
  const tzStr   = data.timestamp.slice(19)   // "+05:30" portion
  const latStr  = `${Math.abs(lat).toFixed(4)}°${lat >= 0 ? 'N' : 'S'}`
  const lonStr  = `${Math.abs(lon).toFixed(4)}°${lon >= 0 ? 'E' : 'W'}`

  // Build cells with explicit grid positions — no auto-placement ambiguity
  // row=3 (top) → CSS row 1; row=0 (bottom) → CSS row 4
  // col=0 (left) → CSS col 1; col=3 (right) → CSS col 4
  const cells: React.ReactNode[] = Object.entries(SOUTH_GRID).map(([key, rashiIdx]) => {
    const [col, row] = key.split(',').map(Number)
    const cssCol = col + 1
    const cssRow = 4 - row
    return (
      <GridCell
        key={key}
        rashiIdx={rashiIdx}
        planets={rashiPlanets[rashiIdx]}
        isLagna={rashiIdx === lagna.rashi_idx}
        gridCol={cssCol}
        gridRow={cssRow}
      />
    )
  })

  // Centre 2×2 block — explicit placement, no auto-flow involvement
  cells.push(
    <div
      key="centre"
      style={{
        gridColumn: '2 / 4',
        gridRow: '2 / 4',
        background: '#0a0d1a',
        border: `1px solid ${PALETTE.goldFaint}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2px',
        padding: '6px',
      }}
    >
      <span style={{ color: PALETTE.textPrimary, fontSize: '0.7rem', fontFamily: 'Inter, sans-serif', textAlign: 'center' }}>
        {latStr}, {lonStr}
      </span>
      <span style={{ color: PALETTE.textMuted, fontSize: '0.7rem', fontFamily: 'Inter, sans-serif' }}>
        {dateStr}
      </span>
      <span style={{ color: PALETTE.textMuted, fontSize: '0.7rem', fontFamily: 'Inter, sans-serif' }}>
        {timeStr} {tzStr}
      </span>
    </div>
  )

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '8px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(60px, 140px))',
          gridTemplateRows:    'repeat(4, minmax(60px, 120px))',
          gap: 0,
          maxWidth: '560px',
          width: '100%',
        }}
      >
        {cells}
      </div>
    </div>
  )
}
