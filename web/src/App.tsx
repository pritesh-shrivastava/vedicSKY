import { useState } from 'react'
import type { Location } from './types'
import { usePositions } from './hooks/usePositions'
import { HinduZodiac2D } from './components/HinduZodiac2D'
import { SouthIndianRashi } from './components/SouthIndianRashi'
import { PALETTE } from './constants/colors'

const DEFAULT_LOCATION: Location = {
  lat: 23.1765,
  lon: 75.7885,
  alt: 490,
  tz:  'Asia/Kolkata',
}

type Tab = 'zodiac' | 'south'

export default function App() {
  const [loc, setLoc]   = useState<Location>(DEFAULT_LOCATION)
  const [tab, setTab]   = useState<Tab>('zodiac')
  const [open, setOpen] = useState(false)
  const state = usePositions(loc)

  return (
    <div style={{ minHeight: '100vh', background: PALETTE.bg, color: PALETTE.textPrimary, fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <header style={{ padding: '12px 16px', borderBottom: `1px solid ${PALETTE.goldFaint}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.2rem', fontWeight: 700, color: PALETTE.gold, margin: 0, letterSpacing: '0.08em' }}>
          Vedic Zodiac
        </h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {state.status === 'ok' && (
            <span style={{ fontSize: '0.65rem', color: PALETTE.textMuted }}>
              {(() => { const d = new Date(state.data.timestamp); return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}` })()}
            </span>
          )}
          <button
            onClick={() => setOpen(o => !o)}
            style={{ background: 'none', border: `1px solid ${PALETTE.goldFaint}`, borderRadius: 4, padding: '4px 8px', color: PALETTE.textMuted, cursor: 'pointer', fontSize: '0.75rem' }}
          >
            ⚙ Location
          </button>
        </div>
      </header>

      {/* Location panel */}
      {open && (
        <div style={{ background: PALETTE.surface, padding: '12px 16px', borderBottom: `1px solid ${PALETTE.goldFaint}`, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
          {[
            { label: 'Latitude',    key: 'lat' as const, type: 'number', step: '0.0001' },
            { label: 'Longitude',   key: 'lon' as const, type: 'number', step: '0.0001' },
            { label: 'Altitude (m)',key: 'alt' as const, type: 'number', step: '1'      },
            { label: 'Timezone',    key: 'tz'  as const, type: 'text',   step: undefined },
          ].map(({ label, key, type, step }) => (
            <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: '0.7rem', color: PALETTE.textMuted }}>
              {label}
              <input
                type={type}
                step={step}
                value={loc[key]}
                onChange={e => setLoc(l => ({ ...l, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                style={{ background: PALETTE.bg, border: `1px solid ${PALETTE.goldFaint}`, borderRadius: 3, padding: '3px 6px', color: PALETTE.textPrimary, width: key === 'tz' ? 140 : 90, fontFamily: 'Inter, sans-serif', fontSize: '0.8rem' }}
              />
            </label>
          ))}
          <button
            onClick={() => setOpen(false)}
            style={{ background: PALETTE.gold, border: 'none', borderRadius: 4, padding: '5px 14px', color: PALETTE.bg, cursor: 'pointer', fontFamily: 'Cinzel, serif', fontSize: '0.75rem', fontWeight: 600 }}
          >
            Apply
          </button>
        </div>
      )}

      {/* Tab bar */}
      <nav style={{ display: 'flex', borderBottom: `1px solid ${PALETTE.goldFaint}`, background: PALETTE.surface }}>
        {([['zodiac', 'Hindu Zodiac 2D'], ['south', 'South Indian Rashi']] as [Tab, string][]).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              flex: 1,
              padding: '10px 8px',
              background: 'none',
              border: 'none',
              borderBottom: tab === id ? `2px solid ${PALETTE.gold}` : '2px solid transparent',
              color: tab === id ? PALETTE.gold : PALETTE.textMuted,
              fontFamily: 'Cinzel, serif',
              fontSize: '0.75rem',
              cursor: 'pointer',
              fontWeight: tab === id ? 600 : 400,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main style={{ padding: '8px 0' }}>
        {state.status === 'loading' && <LoadingState />}
        {state.status === 'error'   && <ErrorState message={state.message} />}
        {state.status === 'ok' && (
          <>
            {tab === 'zodiac' && <HinduZodiac2D data={state.data} />}
            {tab === 'south'  && <SouthIndianRashi data={state.data} lat={loc.lat} lon={loc.lon} />}
          </>
        )}
      </main>
    </div>
  )
}

function LoadingState() {
  // Mirror the wheel's actual proportions:
  // RADIUS = size/2 - 20  →  r=180 in a 400×400 viewBox
  // R_ECLIPTIC = RADIUS * 0.72  →  r≈130
  // 12 rashi spokes at 30° intervals
  const cx = 200, cy = 200
  const R_OUTER    = 180
  const R_ECLIPTIC = 130
  const R_INNER    = 55
  const spokes = Array.from({ length: 12 }, (_, i) => {
    const rad = ((i * 30 - 90) * Math.PI) / 180
    return {
      x2: cx + R_ECLIPTIC * Math.cos(rad),
      y2: cy + R_ECLIPTIC * Math.sin(rad),
    }
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
      <svg
        viewBox="0 0 400 400"
        style={{
          width: 'min(60vw, 360px)',
          height: 'min(60vw, 360px)',
          animation: 'wheel-pulse 2.4s ease-in-out infinite',
        }}
      >
        {/* Outer boundary ring */}
        <circle cx={cx} cy={cy} r={R_OUTER} fill="none" stroke="rgba(201,168,76,0.12)" strokeWidth={1} />

        {/* Rashi spokes from centre to ecliptic */}
        {spokes.map((s, i) => (
          <line key={i} x1={cx} y1={cy} x2={s.x2} y2={s.y2}
            stroke="rgba(255,255,255,0.07)" strokeWidth={0.8} />
        ))}

        {/* Ecliptic ring */}
        <circle cx={cx} cy={cy} r={R_ECLIPTIC} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={0.8} />

        {/* Inner decoration ring */}
        <circle cx={cx} cy={cy} r={R_INNER} fill="none" stroke="rgba(201,168,76,0.08)" strokeWidth={0.6} />

        {/* Centre dot */}
        <circle cx={cx} cy={cy} r={3} fill="rgba(201,168,76,0.2)" />
      </svg>
      <span style={{ fontFamily: 'Cinzel, serif', color: PALETTE.textMuted, fontSize: '0.85rem', letterSpacing: '0.1em' }}>
        Calculating positions…
      </span>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12 }}>
      <span style={{ fontFamily: 'Cinzel, serif', color: PALETTE.gold, fontSize: '0.9rem' }}>
        Could not reach server. Retrying in 60s.
      </span>
      <span style={{ fontFamily: 'Inter, sans-serif', color: PALETTE.textMuted, fontSize: '0.7rem' }}>
        {message}
      </span>
    </div>
  )
}
