import { useMemo, useState } from 'react'
import type { Location } from './types'
import { usePositions } from './hooks/usePositions'
import { useMotion } from './hooks/useMotion'
import { HinduZodiac2D } from './components/HinduZodiac2D'
import { SouthIndianRashi } from './components/SouthIndianRashi'
import { MotionPanel } from './components/MotionPanel'
import { PALETTE } from './constants/colors'

const DEFAULT_LOCATION: Location = {
  lat: 23.1765,
  lon: 75.7885,
  alt: 490,
  tz: 'Asia/Kolkata',
}

type Tab = 'zodiac' | 'south'

function formatForInput(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`
}

function formatInZone(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso))
}

export default function App() {
  const [loc, setLoc] = useState<Location>(DEFAULT_LOCATION)
  const [tab, setTab] = useState<Tab>('zodiac')
  const [open, setOpen] = useState(false)
  const [scrubValue, setScrubValue] = useState('')
  const [geoStatus, setGeoStatus] = useState<string | null>(null)

  const liveTime = scrubValue || null
  const state = usePositions(loc, liveTime)
  const currentIso = state.status === 'ok' ? state.data.timestamp : null
  const motion = useMotion(loc, currentIso, 7, 24)

  const timeLabel = useMemo(() => {
    if (!currentIso) return null
    return formatInZone(currentIso, loc.tz)
  }, [currentIso, loc.tz])

  const setCurrentTime = () => setScrubValue(formatForInput(new Date(), loc.tz))
  const clearTime = () => setScrubValue('')

  const handleGeo = () => {
    if (!navigator.geolocation) {
      setGeoStatus('Geolocation not supported in this browser')
      return
    }
    setGeoStatus('Requesting location…')
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLoc(prev => ({
          ...prev,
          lat: Number(pos.coords.latitude.toFixed(4)),
          lon: Number(pos.coords.longitude.toFixed(4)),
          alt: Number((pos.coords.altitude ?? prev.alt).toFixed(1)),
        }))
        setGeoStatus('Location updated')
      },
      err => setGeoStatus(err.message || 'Could not read location'),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: PALETTE.bg, color: PALETTE.textPrimary, fontFamily: 'Inter, sans-serif' }}>
      <header style={{ padding: '10px 14px', borderBottom: `1px solid ${PALETTE.goldFaint}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, position: 'sticky', top: 0, zIndex: 20, backdropFilter: 'blur(8px)', background: 'rgba(5,6,15,0.92)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.08rem', fontWeight: 700, color: PALETTE.gold, margin: 0, letterSpacing: '0.08em' }}>
            Vedic Skyview
          </h1>
          <span style={{ fontSize: '0.68rem', color: PALETTE.textMuted }}>
            {state.status === 'ok' ? `Now · ${timeLabel}` : 'Fetching sky positions…'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {state.status === 'ok' && (
            <span style={{ fontSize: '0.65rem', color: PALETTE.textMuted, whiteSpace: 'nowrap' }}>
              {new Date(state.data.timestamp).toLocaleTimeString('en-IN', { timeZone: loc.tz, hour: '2-digit', minute: '2-digit', hour12: false })}
            </span>
          )}
          <button
            onClick={() => setOpen(o => !o)}
            style={{ background: 'none', border: `1px solid ${PALETTE.goldFaint}`, borderRadius: 4, padding: '10px 12px', minHeight: '44px', color: PALETTE.textMuted, cursor: 'pointer', fontSize: '0.75rem' }}
          >
            ⚙ Location
          </button>
        </div>
      </header>

      {open && (
        <div style={{ background: PALETTE.surface, padding: '12px 14px 14px', borderBottom: `1px solid ${PALETTE.goldFaint}`, display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
            {[
              { label: 'Latitude', key: 'lat' as const, type: 'number', step: '0.0001' },
              { label: 'Longitude', key: 'lon' as const, type: 'number', step: '0.0001' },
              { label: 'Altitude (m)', key: 'alt' as const, type: 'number', step: '1' },
              { label: 'Timezone', key: 'tz' as const, type: 'text', step: undefined },
            ].map(({ label, key, type, step }) => (
              <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: '0.7rem', color: PALETTE.textMuted }}>
                {label}
                <input
                  type={type}
                  step={step}
                  value={loc[key]}
                  onChange={e => setLoc(l => ({ ...l, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                  style={{ background: PALETTE.bg, border: `1px solid ${PALETTE.goldFaint}`, borderRadius: 3, padding: '4px 6px', color: PALETTE.textPrimary, width: key === 'tz' ? 152 : 94, fontFamily: 'Inter, sans-serif', fontSize: '0.8rem' }}
                />
              </label>
            ))}
            <button
              onClick={handleGeo}
              style={{ background: 'none', border: `1px solid ${PALETTE.goldFaint}`, borderRadius: 4, padding: '10px 12px', minHeight: '44px', color: PALETTE.textMuted, cursor: 'pointer', fontSize: '0.75rem' }}
            >
              Use my location
            </button>
            <button
              onClick={() => setOpen(false)}
              style={{ background: PALETTE.gold, border: 'none', borderRadius: 4, padding: '10px 14px', minHeight: '44px', color: PALETTE.bg, cursor: 'pointer', fontFamily: 'Cinzel, serif', fontSize: '0.75rem', fontWeight: 600 }}
            >
              Apply
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: PALETTE.textMuted }}>Time scrubber:</span>
            <button
              onClick={clearTime}
              style={{ background: !scrubValue ? PALETTE.gold : 'none', border: `1px solid ${PALETTE.goldFaint}`, borderRadius: 4, padding: '8px 10px', minHeight: '40px', color: !scrubValue ? PALETTE.bg : PALETTE.textMuted, cursor: 'pointer', fontSize: '0.72rem' }}
            >
              Live
            </button>
            <button
              onClick={setCurrentTime}
              style={{ background: 'none', border: `1px solid ${PALETTE.goldFaint}`, borderRadius: 4, padding: '8px 10px', minHeight: '40px', color: PALETTE.textMuted, cursor: 'pointer', fontSize: '0.72rem' }}
            >
              Now
            </button>
            <input
              type="datetime-local"
              value={scrubValue}
              onChange={e => setScrubValue(e.target.value)}
              style={{ background: PALETTE.bg, border: `1px solid ${PALETTE.goldFaint}`, borderRadius: 4, padding: '8px 10px', color: PALETTE.textPrimary, fontFamily: 'Inter, sans-serif', fontSize: '0.8rem' }}
            />
            <span style={{ color: PALETTE.textMuted, fontSize: '0.68rem' }}>
              {scrubValue ? `Pinned to ${scrubValue}` : 'Auto-refreshing live positions every 60s'}
            </span>
          </div>

          {geoStatus && (
            <div style={{ color: PALETTE.textMuted, fontSize: '0.72rem' }}>
              {geoStatus}
            </div>
          )}
        </div>
      )}

      <nav style={{ display: 'flex', borderBottom: `1px solid ${PALETTE.goldFaint}`, background: PALETTE.surface }}>
        {([['zodiac', 'Hindu Zodiac 2D'], ['south', 'South Indian Rashi']] as [Tab, string][]).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              flex: 1,
              padding: '11px 8px',
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

      <main style={{ padding: '10px 0 18px', display: 'grid', gap: 12 }}>
        {state.status === 'loading' && <LoadingState />}
        {state.status === 'error' && <ErrorState message={state.message} />}
        {state.status === 'ok' && (
          <>
            {tab === 'zodiac' && <HinduZodiac2D data={state.data} />}
            {tab === 'south' && <SouthIndianRashi data={state.data} lat={loc.lat} lon={loc.lon} timeZone={loc.tz} />}
            {motion.status === 'ok' && <MotionPanel data={motion.data} timeZone={loc.tz} />}
            {motion.status === 'loading' && state.status === 'ok' && (
              <div style={{ padding: '0 14px', color: PALETTE.textMuted, fontSize: '0.72rem' }}>Loading motion bands…</div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

function LoadingState() {
  const cx = 200, cy = 200
  const R_OUTER = 180
  const R_ECLIPTIC = 130
  const R_INNER = 55
  const spokes = Array.from({ length: 12 }, (_, i) => {
    const rad = ((i * 30 - 90) * Math.PI) / 180
    return {
      x2: cx + R_ECLIPTIC * Math.cos(rad),
      y2: cy + R_ECLIPTIC * Math.sin(rad),
    }
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '56vh', gap: 16, padding: '0 14px' }}>
      <svg viewBox="0 0 400 400" style={{ width: 'min(60vw, 360px)', height: 'min(60vw, 360px)', animation: 'wheel-pulse 2.4s ease-in-out infinite' }}>
        <circle cx={cx} cy={cy} r={R_OUTER} fill="none" stroke="rgba(201,168,76,0.12)" strokeWidth={1} />
        {spokes.map((s, i) => (
          <line key={i} x1={cx} y1={cy} x2={s.x2} y2={s.y2} stroke="rgba(255,255,255,0.07)" strokeWidth={0.8} />
        ))}
        <circle cx={cx} cy={cy} r={R_ECLIPTIC} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={0.8} />
        <circle cx={cx} cy={cy} r={R_INNER} fill="none" stroke="rgba(201,168,76,0.08)" strokeWidth={0.6} />
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '56vh', gap: 12, padding: '0 14px' }}>
      <span style={{ fontFamily: 'Cinzel, serif', color: PALETTE.gold, fontSize: '0.9rem' }}>
        Could not reach server. Retrying in 60s.
      </span>
      <span style={{ fontFamily: 'Inter, sans-serif', color: PALETTE.textMuted, fontSize: '0.7rem' }}>
        {message}
      </span>
    </div>
  )
}
