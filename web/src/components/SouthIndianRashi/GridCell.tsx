import { RASHI_SHORT } from '../../constants/rashis'
import { RASHI_COLORS } from '../../constants/colors'
import { PALETTE } from '../../constants/colors'

interface Props {
  rashiIdx: number
  planets: string[]       // abbreviations, retrograde already formatted as "(Me)"
  isLagna: boolean
}

export function GridCell({ rashiIdx, planets, isLagna }: Props) {
  const border = isLagna
    ? `2px solid ${PALETTE.gold}`
    : `1px solid ${PALETTE.goldFaint}`

  return (
    <div
      style={{
        background: PALETTE.cellBg,
        border,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80px',
        padding: '4px',
      }}
    >
      {/* Rashi short label — top right */}
      <span
        style={{
          position: 'absolute',
          top: 4,
          right: 6,
          fontSize: '0.65rem',
          color: RASHI_COLORS[rashiIdx],
          opacity: 0.8,
          fontFamily: 'Cinzel, serif',
        }}
      >
        {RASHI_SHORT[rashiIdx]}
      </span>

      {/* Planet abbreviations */}
      <span
        style={{
          fontSize: '0.9rem',
          fontWeight: 600,
          color: PALETTE.textPrimary,
          fontFamily: 'Cinzel, serif',
          textAlign: 'center',
          lineHeight: 1.6,
        }}
      >
        {planets.map((p, i) => (
          <span
            key={i}
            style={{
              display: 'inline-block',
              marginRight: i < planets.length - 1 ? '6px' : 0,
              fontStyle: p.startsWith('(') ? 'italic' : 'normal',
              color: p.startsWith('(') ? PALETTE.gold : PALETTE.textPrimary,
            }}
          >
            {p}
          </span>
        ))}
      </span>
    </div>
  )
}
