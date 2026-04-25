import { useEffect } from 'react'
import * as d3 from 'd3'
import type { RefObject } from 'react'
import type { ApiResponse } from '../../types'
import { RASHI_SHORT } from '../../constants/rashis'
import { RASHI_COLORS } from '../../constants/colors'
import { PLANET_COLOR } from '../../constants/colors'
import { NAKSHATRA_YOGA_TARAS, NAK_NAMES, CONSTELLATION_DATA } from '../../constants/stars'

const NAK_SPAN = 360 / 27

// Sidereal longitude → SVG angle in degrees
// lon=0 (Aries) → 270° → top of SVG. Clockwise.
const lonToAngle = (lon: number): number => (lon - 90 + 360) % 360

// Polar → SVG cartesian
const toXY = (cx: number, cy: number, r: number, angleDeg: number) => ({
  x: cx + r * Math.cos((angleDeg * Math.PI) / 180),
  y: cy + r * Math.sin((angleDeg * Math.PI) / 180),
})

export type BoundaryMode = 'rashi' | 'nakshatra'

export function useD3Wheel(
  svgRef: RefObject<SVGSVGElement | null>,
  data: ApiResponse | null,
  size: number,
  onHover: (label: string | null) => void,
  boundaries: BoundaryMode = 'rashi',
  showConstellations: boolean = true,
) {
  useEffect(() => {
    if (!svgRef.current || size < 100) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()   // clear before each redraw

    const cx = size / 2
    const cy = size / 2
    const RADIUS      = size / 2 - 20
    const R_ECLIPTIC  = RADIUS * 0.72   // THE single ecliptic circle — everything anchors here
    const ECL_LAT_SCALE = 1.5
    const R_LABEL_OUT = R_ECLIPTIC + Math.max(14, size * 0.038)  // rashi names outside circle
    const R_DEG_OUT   = R_ECLIPTIC + Math.max(10, size * 0.026)  // degree labels outside circle

    // ── defs: glow filter ────────────────────────────────────────────────
    const defs = svg.append('defs')
    defs.append('filter').attr('id', 'glow')
      .call(f => {
        f.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur')
        const merge = f.append('feMerge')
        merge.append('feMergeNode').attr('in', 'blur')
        merge.append('feMergeNode').attr('in', 'SourceGraphic')
      })

    // ── starfield ────────────────────────────────────────────────────────
    const starGroup = svg.append('g').attr('class', 'starfield')
    const rng = d3.randomLcg(42)  // seeded so stars don't move on re-render
    for (let i = 0; i < 180; i++) {
      const angle = rng() * 360
      const r     = rng() * (R_ECLIPTIC - 10) + 10
      const pt    = toXY(cx, cy, r, angle)
      starGroup.append('circle')
        .attr('cx', pt.x).attr('cy', pt.y)
        .attr('r',  rng() * 0.8 + 0.3)
        .attr('fill', 'white')
        .attr('opacity', rng() * 0.35 + 0.08)
    }

    // ── THE ecliptic circle — single reference ring ───────────────────────
    svg.append('circle')
      .attr('cx', cx).attr('cy', cy).attr('r', R_ECLIPTIC)
      .attr('fill', 'none')
      .attr('stroke', 'rgba(255,255,255,0.3)')
      .attr('stroke-width', 0.8)

    // ── nakshatra divisions (conditional) ─────────────────────────────────
    if (boundaries === 'nakshatra') {
      const nakGroup = svg.append('g').attr('class', 'nakshatra-ring')
      for (let i = 0; i < 27; i++) {
        const lon = i * NAK_SPAN
        const a0  = lonToAngle(lon)
        nakGroup.append('line')
          .attr('x1', cx).attr('y1', cy)
          .attr('x2', toXY(cx, cy, R_ECLIPTIC, a0).x)
          .attr('y2', toXY(cx, cy, R_ECLIPTIC, a0).y)
          .attr('stroke', 'rgba(255,255,255,0.12)')
          .attr('stroke-width', 0.5)

        const midA  = lonToAngle(lon + NAK_SPAN / 2)
        const midPt = toXY(cx, cy, R_ECLIPTIC - Math.max(10, size * 0.025), midA)
        nakGroup.append('text')
          .attr('x', midPt.x).attr('y', midPt.y)
          .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
          .attr('font-size', Math.max(5, size * 0.013))
          .attr('fill', 'rgba(255,255,255,0.28)')
          .attr('font-family', 'Cinzel, serif')
          .attr('transform', `rotate(${midA + 90},${midPt.x},${midPt.y})`)
          .text(NAK_NAMES[i].slice(0, 4))
      }
    }

    // ── rashi divisions + labels ──────────────────────────────────────────
    const rashiGroup = svg.append('g').attr('class', 'rashi-ring')
    for (let i = 0; i < 12; i++) {
      const lon = i * 30
      const a   = lonToAngle(lon)

      // Rashi spoke to ecliptic circle (conditional)
      if (boundaries === 'rashi') {
        const ep = toXY(cx, cy, R_ECLIPTIC, a)
        rashiGroup.append('line')
          .attr('x1', cx).attr('y1', cy)
          .attr('x2', ep.x).attr('y2', ep.y)
          .attr('stroke', 'rgba(255,255,255,0.18)')
          .attr('stroke-width', 0.5)
      }

      // Small dot ON the ecliptic circle at each 30° point
      const dotPt = toXY(cx, cy, R_ECLIPTIC, a)
      rashiGroup.append('circle')
        .attr('cx', dotPt.x).attr('cy', dotPt.y)
        .attr('r', Math.max(2, size * 0.004))
        .attr('fill', 'rgba(255,255,255,0.6)')

      // Degree label just outside the ecliptic circle
      const degPt = toXY(cx, cy, R_DEG_OUT, a)
      rashiGroup.append('text')
        .attr('x', degPt.x).attr('y', degPt.y)
        .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
        .attr('font-size', Math.max(7, size * 0.016))
        .attr('fill', 'rgba(255,255,255,0.55)')
        .attr('font-family', 'Inter, sans-serif')
        .text(`${lon}°`)

      // Rashi label further outside
      const midA  = lonToAngle(lon + 15)
      const midPt = toXY(cx, cy, R_LABEL_OUT, midA)
      rashiGroup.append('text')
        .attr('x', midPt.x).attr('y', midPt.y)
        .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
        .attr('font-size', Math.max(8, size * 0.021))
        .attr('fill', RASHI_COLORS[i])
        .attr('font-family', 'Cinzel, serif')
        .attr('font-weight', '600')
        .text(RASHI_SHORT[i])
    }

    // ── reference lines: 0° Aries + Ascendant ────────────────────────────
    const refGroup = svg.append('g').attr('class', 'ref-lines')

    // 0° Aries line — faint white diameter
    const ariesA = lonToAngle(0)
    const ariesP = toXY(cx, cy, R_ECLIPTIC, ariesA)
    const ariesOpp = toXY(cx, cy, R_ECLIPTIC, (ariesA + 180) % 360)
    refGroup.append('line')
      .attr('x1', ariesOpp.x).attr('y1', ariesOpp.y)
      .attr('x2', ariesP.x).attr('y2', ariesP.y)
      .attr('stroke', 'rgba(255,255,255,0.15)')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4')

    if (data) {
      const lagnaA  = lonToAngle(data.lagna.sidereal_lon)
      const lagnaP  = toXY(cx, cy, R_ECLIPTIC, lagnaA)
      const lagnaOpp = toXY(cx, cy, R_ECLIPTIC, (lagnaA + 180) % 360)
      refGroup.append('line')
        .attr('x1', lagnaOpp.x).attr('y1', lagnaOpp.y)
        .attr('x2', lagnaP.x).attr('y2', lagnaP.y)
        .attr('stroke', PLANET_COLOR.Lagna)
        .attr('stroke-width', 1.5)
        .attr('opacity', 0.85)
      refGroup.append('text')
        .attr('x', lagnaP.x).attr('y', lagnaP.y)
        .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
        .attr('font-size', Math.max(7, size * 0.018))
        .attr('fill', PLANET_COLOR.Lagna)
        .attr('font-family', 'Cinzel, serif')
        .attr('dy', -8)
        .text('Asc')
    }

    // ── nakshatra yoga tara dots + draw-in asterism lines ─────────────────
    const starLayer = svg.append('g').attr('class', 'stars')

    // Draw constellation stick figures (conditional)
    if (showConstellations) {
      const constellationLayer = svg.append('g').attr('class', 'constellations')
      for (let ri = 0; ri < CONSTELLATION_DATA.length; ri++) {
        const { stars, lines } = CONSTELLATION_DATA[ri]
        const color = RASHI_COLORS[ri]
        const pts = stars.map(([lon, lat]) =>
          toXY(cx, cy, R_ECLIPTIC + lat * ECL_LAT_SCALE, lonToAngle(lon))
        )
        for (const [i, j] of lines) {
          constellationLayer.append('line')
            .attr('x1', pts[i].x).attr('y1', pts[i].y)
            .attr('x2', pts[j].x).attr('y2', pts[j].y)
            .attr('stroke', color)
            .attr('stroke-width', 0.9)
            .attr('stroke-opacity', 0.55)
            .attr('stroke-linecap', 'round')
        }
        for (const pt of pts) {
          constellationLayer.append('circle')
            .attr('cx', pt.x).attr('cy', pt.y)
            .attr('r', Math.max(1.5, size * 0.003))
            .attr('fill', color)
            .attr('opacity', 0.7)
        }
      }
    }

    // Yoga tara dots — only when constellation figures are on
    if (showConstellations) {
      for (const [name, lon, lat] of NAKSHATRA_YOGA_TARAS) {
        const a  = lonToAngle(lon)
        const r  = R_ECLIPTIC + lat * ECL_LAT_SCALE
        const pt = toXY(cx, cy, r, a)
        starLayer.append('circle')
          .attr('cx', pt.x).attr('cy', pt.y)
          .attr('r', Math.max(2, size * 0.005))
          .attr('fill', 'rgba(255,255,220,0.75)')
          .attr('filter', 'url(#glow)')
          .on('mouseenter', () => onHover(name))
          .on('mouseleave', () => onHover(null))
          .style('cursor', 'pointer')
      }
    }

    // ── planet layer — positioned by actual ecliptic latitude ─────────────
    if (!data) return
    const planetGroup = svg.append('g').attr('class', 'planets')

    for (const g of data.grahas) {
      const a    = lonToAngle(g.sidereal_lon)
      // Planet sits on the ecliptic circle shifted by its ecliptic latitude
      const r    = R_ECLIPTIC + g.ecl_lat * ECL_LAT_SCALE
      const pt   = toXY(cx, cy, r, a)
      const col  = PLANET_COLOR[g.name] ?? '#ffffff'
      const dotR = Math.max(5, size * 0.013)

      // Glow halo
      planetGroup.append('circle')
        .attr('cx', pt.x).attr('cy', pt.y)
        .attr('r', dotR * 2.2)
        .attr('fill', col)
        .attr('opacity', 0.15)

      // Planet dot
      planetGroup.append('circle')
        .attr('cx', pt.x).attr('cy', pt.y)
        .attr('r', dotR)
        .attr('fill', col)
        .attr('filter', 'url(#glow)')
        .attr('stroke', 'white')
        .attr('stroke-width', 0.5)
        .on('mouseenter', () =>
          onHover(`${g.name} · ${g.nakshatra_en} Pada ${g.pada} · ${g.sidereal_lon.toFixed(2)}° (lat ${g.ecl_lat.toFixed(2)}°)`)
        )
        .on('mouseleave', () => onHover(null))
        .style('cursor', 'pointer')

      // Label offset outward from centre
      const labelR  = r + dotR + Math.max(8, size * 0.018)
      const labelPt = toXY(cx, cy, labelR, a)
      planetGroup.append('text')
        .attr('x', labelPt.x).attr('y', labelPt.y)
        .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
        .attr('font-size', Math.max(8, size * 0.022))
        .attr('fill', col)
        .attr('font-family', 'Cinzel, serif')
        .attr('font-weight', '600')
        .text(g.is_retrograde ? `(${g.abbr})` : g.abbr)
        .style('pointer-events', 'none')
    }
  }, [svgRef, data, size, onHover, boundaries, showConstellations])
}
