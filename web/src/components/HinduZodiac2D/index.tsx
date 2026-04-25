import { useRef, useState, useEffect, useCallback } from 'react'
import type { ApiResponse } from '../../types'
import { useD3Wheel, type BoundaryMode } from './useD3Wheel'
import { PALETTE } from '../../constants/colors'

interface Props {
  data: ApiResponse | null
}

const BTN: React.CSSProperties = {
  background: 'none',
  border: `1px solid ${PALETTE.goldFaint}`,
  borderRadius: 4,
  padding: '3px 10px',
  fontFamily: 'Inter, sans-serif',
  fontSize: '0.72rem',
  cursor: 'pointer',
  transition: 'all 0.15s',
}

const BTN_ON: React.CSSProperties = {
  ...BTN,
  background: PALETTE.gold,
  color: PALETTE.bg,
  borderColor: PALETTE.gold,
}

const BTN_OFF: React.CSSProperties = {
  ...BTN,
  color: PALETTE.textMuted,
}

export function HinduZodiac2D({ data }: Props) {
  const svgRef  = useRef<SVGSVGElement | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const [size, setSize]           = useState(0)
  const [tooltip, setTooltip]     = useState<string | null>(null)
  const [boundaries, setBoundaries] = useState<BoundaryMode>('rashi')
  const [showConst, setShowConst] = useState(true)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const obs = new ResizeObserver(([entry]) => {
      const s = Math.min(entry.contentRect.width, entry.contentRect.height)
      setSize(s > 0 ? s : entry.contentRect.width)
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const onHover = useCallback((label: string | null) => setTooltip(label), [])
  useD3Wheel(svgRef, data, size, onHover, boundaries, showConst)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '8px 0' }}>

      {/* Toggle controls */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* Boundary mode */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ fontSize: '0.68rem', color: PALETTE.textMuted, fontFamily: 'Inter, sans-serif' }}>Boundaries:</span>
          {(['rashi', 'nakshatra'] as BoundaryMode[]).map(m => (
            <button key={m} style={boundaries === m ? BTN_ON : BTN_OFF} onClick={() => setBoundaries(m)}>
              {m === 'rashi' ? 'Rashi' : 'Nakshatra'}
            </button>
          ))}
        </div>

        {/* Constellation toggle */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ fontSize: '0.68rem', color: PALETTE.textMuted, fontFamily: 'Inter, sans-serif' }}>Figures:</span>
          <button style={showConst ? BTN_ON : BTN_OFF} onClick={() => setShowConst(v => !v)}>
            {showConst ? 'On' : 'Off'}
          </button>
        </div>
      </div>

      {/* Wheel */}
      <div
        ref={wrapRef}
        style={{ width: '100%', maxWidth: '680px', aspectRatio: '1 / 1', position: 'relative' }}
      >
        <svg
          ref={svgRef}
          width={size || '100%'}
          height={size || '100%'}
          style={{ display: 'block', background: PALETTE.bg, borderRadius: 8 }}
        />
      </div>

      {/* Tooltip */}
      <div style={{
        minHeight: '22px',
        color: PALETTE.textPrimary,
        fontFamily: 'Cinzel, serif',
        fontSize: '0.8rem',
        opacity: tooltip ? 1 : 0,
        transition: 'opacity 0.15s',
      }}>
        {tooltip}
      </div>

      <p style={{ color: PALETTE.textMuted, fontSize: '0.7rem', fontFamily: 'Inter, sans-serif', margin: 0 }}>
        Hover or tap any dot · Sidereal (Lahiri)
      </p>
    </div>
  )
}
