import type { ApiResponse } from '../../types'
import { SOUTH_GRID } from '../../constants/rashis'
import { PALETTE } from '../../constants/colors'
import { GridCell } from './GridCell'

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

  rashiPlanets[lagna.rashi_idx].push('Asc')

  for (const g of grahas) {
    const abbr = g.is_retrograde ? `(${g.abbr})` : g.abbr
    rashiPlanets[g.rashi_idx].push(abbr)
  }

  const now = new Date(data.timestamp)
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
  const tzStr   = data.timestamp.slice(19)   // "+05:30" portion
  const latStr  = `${Math.abs(lat).toFixed(4)}°${lat >= 0 ? 'N' : 'S'}`
  const lonStr  = `${Math.abs(lon).toFixed(4)}°${lon >= 0 ? 'E' : 'W'}`

  // Render a 4×4 CSS grid
  // Outer cells are at grid positions; inner 2×2 (cols 1-2, rows 1-2) is the centre
  const cells: React.ReactNode[] = []

  for (let row = 3; row >= 0; row--) {
    for (let col = 0; col <= 3; col++) {
      const key = `${col},${row}`
      const rashiIdx = SOUTH_GRID[key]

      if (rashiIdx === undefined) {
        // Inner 2×2 — only render once at top-left of the block (col=1,row=2)
        if (col === 1 && row === 2) {
          cells.push(
            <div
              key="centre"
              style={{
                gridColumn: '2 / 4',
                gridRow: '2 / 4',  // rows are flipped because we go row=3 down to 0
                background: '#0a0d1a',
                border: `1px solid ${PALETTE.goldFaint}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                padding: '8px',
              }}
            >
              <span style={{ color: PALETTE.textPrimary, fontSize: '0.75rem', fontFamily: 'Inter, sans-serif' }}>
                {latStr}, {lonStr}
              </span>
              <span style={{ color: PALETTE.textMuted, fontSize: '0.75rem', fontFamily: 'Inter, sans-serif' }}>
                {dateStr}
              </span>
              <span style={{ color: PALETTE.textMuted, fontSize: '0.75rem', fontFamily: 'Inter, sans-serif' }}>
                {timeStr} {tzStr}
              </span>
            </div>
          )
        }
        // Skip the other inner cells — they're covered by the spanning div
        continue
      }

      cells.push(
        <GridCell
          key={key}
          rashiIdx={rashiIdx}
          planets={rashiPlanets[rashiIdx]}
          isLagna={rashiIdx === lagna.rashi_idx}
        />
      )
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '16px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(80px, 140px))',
          gridTemplateRows:    'repeat(4, minmax(80px, 120px))',
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
