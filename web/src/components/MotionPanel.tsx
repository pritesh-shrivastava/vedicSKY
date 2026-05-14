import type { MotionResponse } from '../types'
import { PALETTE, PLANET_COLOR } from '../constants/colors'

interface Props {
  data: MotionResponse | null
  timeZone: string
}

const GRAHA_ORDER = ['Surya', 'Chandra', 'Mangala', 'Budha', 'Guru', 'Shukra', 'Shani']

export function MotionPanel({ data, timeZone }: Props) {
  if (!data) return null

  const dates = data.samples.map(sample => {
    const d = new Date(sample.timestamp)
    return new Intl.DateTimeFormat('en-IN', {
      timeZone,
      day: '2-digit',
      month: 'short',
    }).format(d)
  })

  return (
    <section style={{
      background: PALETTE.surface,
      borderTop: `1px solid ${PALETTE.goldFaint}`,
      padding: '14px 12px 18px',
      marginTop: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
        <div>
          <h2 style={{ margin: 0, color: PALETTE.gold, fontFamily: 'Cinzel, serif', fontSize: '0.88rem', letterSpacing: '0.06em' }}>
            Motion bands
          </h2>
          <p style={{ margin: '4px 0 0', color: PALETTE.textMuted, fontFamily: 'Inter, sans-serif', fontSize: '0.72rem' }}>
            Daily direct / retrograde strip for the 7 classical planets.
          </p>
        </div>
        <span style={{ color: PALETTE.textMuted, fontFamily: 'Inter, sans-serif', fontSize: '0.68rem' }}>
          {dates[0]} → {dates[dates.length - 1]}
        </span>
      </div>

      <div style={{ display: 'grid', gap: 6 }}>
        {GRAHA_ORDER.map(name => {
          const rowSamples = data.samples.map(sample => sample.grahas.find(g => g.name === name))
          const current = rowSamples[rowSamples.length - 1]
          return (
            <div key={name} style={{ display: 'grid', gridTemplateColumns: `92px repeat(${data.samples.length}, minmax(16px, 1fr))`, alignItems: 'center', gap: 6 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ color: PLANET_COLOR[name] ?? PALETTE.textPrimary, fontFamily: 'Cinzel, serif', fontSize: '0.78rem' }}>
                  {name}
                </span>
                <span style={{ color: PALETTE.textMuted, fontFamily: 'Inter, sans-serif', fontSize: '0.65rem' }}>
                  {current ? `${current.speed.toFixed(3)}°/d` : '—'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${data.samples.length}, minmax(14px, 1fr))`, gap: 4 }}>
                {rowSamples.map((g, idx) => {
                  if (!g) return <span key={idx} />
                  const active = g.is_retrograde
                  return (
                    <div
                      key={idx}
                      title={`${dates[idx]} · ${g.nakshatra_en} · ${g.speed.toFixed(3)}°/d`}
                      style={{
                        height: 18,
                        borderRadius: 999,
                        border: `1px solid ${active ? 'rgba(255,107,107,0.55)' : 'rgba(201,168,76,0.28)'}`,
                        background: active ? 'rgba(255,107,107,0.18)' : 'rgba(201,168,76,0.12)',
                        color: active ? '#ffb1b1' : PALETTE.gold,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '0.62rem',
                        fontWeight: 700,
                      }}
                    >
                      {active ? 'R' : '•'}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
