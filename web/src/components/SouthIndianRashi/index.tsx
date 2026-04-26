import type { ApiResponse } from '../../types'
import { SOUTH_GRID } from '../../constants/rashis'
import { PALETTE } from '../../constants/colors'
import { GridCell } from './GridCell'
import { GRAHA_FULL_DEV, LAGNA_DEV } from '../../constants/grahas'

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
    const devName = GRAHA_FULL_DEV[g.name] ?? g.name
    const label = g.is_retrograde ? `(${devName})` : devName
    rashiPlanets[g.rashi_idx].push(label)
  }

  const now = new Date(data.timestamp)
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
  const tzRaw   = data.timestamp.slice(19)                          // "+05:30"
  const tzStr   = tzRaw.replace(/([+-])0(\d)/, '$1$2')             // "+5:30"
  const latStr  = `${Math.abs(lat).toFixed(1)}°${lat >= 0 ? 'N' : 'S'}`
  const lonStr  = `${Math.abs(lon).toFixed(1)}°${lon >= 0 ? 'E' : 'W'}`

  // Tithi from Moon–Sun elongation
  const TITHI_NAMES_DEV = [
    'प्रतिपदा','द्वितीया','तृतीया','चतुर्थी','पंचमी',
    'षष्ठी','सप्तमी','अष्टमी','नवमी','दशमी',
    'एकादशी','द्वादशी','त्रयोदशी','चतुर्दशी','पूर्णिमा',
  ]
  const AMAVASYA_DEV = 'अमावस्या'
  const sunLon  = grahas.find(g => g.name === 'Surya')?.sidereal_lon ?? 0
  const moonLon = grahas.find(g => g.name === 'Chandra')?.sidereal_lon ?? 0
  const elong   = ((moonLon - sunLon + 360) % 360)
  const tithiNum = Math.ceil(elong / 12) || 1   // 1–30 (30 = Amavasya)
  const isShukla = tithiNum <= 15
  const tithiIdx = isShukla ? tithiNum - 1 : tithiNum - 16   // 0-indexed into TITHI_NAMES_DEV
  const tithiName = tithiNum === 30
    ? AMAVASYA_DEV
    : TITHI_NAMES_DEV[tithiIdx]
  const tithiStr = `${isShukla ? 'शुक्ल' : 'कृष्ण'} ${tithiName}`

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
      <span style={{ color: PALETTE.textPrimary, fontSize: '0.65rem', fontFamily: 'Inter, sans-serif', textAlign: 'center' }}>
        {latStr}, {lonStr}
      </span>
      <span style={{ color: PALETTE.textMuted, fontSize: '0.65rem', fontFamily: 'Inter, sans-serif' }}>
        {dateStr}
      </span>
      <span style={{ color: PALETTE.textMuted, fontSize: '0.65rem', fontFamily: 'Inter, sans-serif' }}>
        {timeStr} {tzStr}
      </span>
      <span style={{ color: PALETTE.gold, fontSize: '0.65rem', fontFamily: 'Noto Sans Devanagari, sans-serif', textAlign: 'center' }}>
        {tithiStr}
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
