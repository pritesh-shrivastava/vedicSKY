import { useEffect } from 'react'
import * as d3 from 'd3'
import type { RefObject } from 'react'
import type { ApiResponse } from '../../types'
import { RASHI_DEV_SHORT } from '../../constants/rashis'
import { RASHI_COLORS } from '../../constants/colors'
import { PLANET_COLOR } from '../../constants/colors'
import { NAKSHATRA_YOGA_TARAS, NAK_NAMES_DEV, NAK_NAMES_DEV_SHORT, CONSTELLATION_DATA } from '../../constants/stars'
import { GRAHA_ABBR_DEV } from '../../constants/grahas'

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
    const R_RASHI_IN  = R_ECLIPTIC - Math.max(14, size * 0.036)  // rashi names inside circle
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
          .attr('font-family', 'Noto Sans Devanagari, sans-serif')
          .attr('transform', `rotate(${midA + 90},${midPt.x},${midPt.y})`)
          .text(NAK_NAMES_DEV_SHORT[i])
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

      // Rashi label inside the ecliptic ring — only in rashi mode
      if (boundaries === 'rashi') {
        const midA  = lonToAngle(lon + 15)
        const midPt = toXY(cx, cy, R_RASHI_IN, midA)
        rashiGroup.append('text')
          .attr('x', midPt.x).attr('y', midPt.y)
          .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
          .attr('font-size', Math.max(6, size * 0.016))
          .attr('fill', 'rgba(255,255,255,0.38)')
          .attr('font-family', 'Noto Sans Devanagari, sans-serif')
          .attr('transform', `rotate(${midA + 90},${midPt.x},${midPt.y})`)
          .text(RASHI_DEV_SHORT[i])
      }
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
      NAKSHATRA_YOGA_TARAS.forEach(([, lon, lat], ni) => {
        const a  = lonToAngle(lon)
        const r  = R_ECLIPTIC + lat * ECL_LAT_SCALE
        const pt = toXY(cx, cy, r, a)
        starLayer.append('circle')
          .attr('cx', pt.x).attr('cy', pt.y)
          .attr('r', Math.max(2, size * 0.005))
          .attr('fill', 'rgba(255,255,220,0.75)')
          .attr('filter', 'url(#glow)')
          .on('mouseenter', () => onHover(NAK_NAMES_DEV[ni]))
          .on('mouseleave', () => onHover(null))
          .style('cursor', 'pointer')
      })
    }

    // ── planet layer — positioned by actual ecliptic latitude ─────────────
    if (!data) return
    const planetGroup = svg.append('g').attr('class', 'planets')

    // Per-planet size: Me smallest → Ju biggest (bumped for detail visibility)
    const PLANET_SCALE: Record<string, [number, number]> = {
      'Budha':   [3, 0.008],
      'Shukra':  [3, 0.009],
      'Chandra': [6, 0.014],   // bigger for phase detail
      'Surya':   [11, 0.028],  // Su — largest
      'Mangala': [6, 0.015],   // bigger for surface detail
      'Rahu':    [4, 0.012],
      'Ketu':    [4, 0.012],
      'Shani':   [7, 0.018],   // bigger for ring visibility
      'Guru':    [8, 0.022],   // Ju — second largest
    }

    // Pre-compute Sun longitude for Moon phase
    const sunLon = data.grahas.find(g => g.name === 'Surya')?.sidereal_lon ?? 0

    for (const g of data.grahas) {
      const a   = lonToAngle(g.sidereal_lon)
      const r   = R_ECLIPTIC + g.ecl_lat * ECL_LAT_SCALE
      const pt  = toXY(cx, cy, r, a)
      const col = PLANET_COLOR[g.name] ?? '#ffffff'
      const [minR, scale] = PLANET_SCALE[g.name] ?? [5, 0.013]
      const dotR = Math.max(minR, size * scale)
      const devName = GRAHA_ABBR_DEV[g.name] ?? g.abbr
      const hoverLabel = `${g.name} · ${g.nakshatra_en} Pada ${g.pada} · ${g.sidereal_lon.toFixed(2)}° (lat ${g.ecl_lat.toFixed(2)}°)`
      const sw = Math.max(1, size * 0.003)

      // Clip path for texture details (Ju, Sa, Ma, Mo)
      const clipId = `pc-${g.name}`
      defs.append('clipPath').attr('id', clipId)
        .append('circle').attr('cx', pt.x).attr('cy', pt.y).attr('r', dotR)

      if (g.name === 'Rahu' || g.name === 'Ketu') {
        // ─ Lunar node symbols (☊ / ☋) ─────────────────────────────────────
        const sr = dotR, stem = dotR
        const isRa = g.name === 'Rahu'
        const pathD = [
          `M ${pt.x - sr},${pt.y}`,
          `A ${sr},${sr} 0 0,${isRa ? 0 : 1} ${pt.x + sr},${pt.y}`,
          `M ${pt.x - sr},${pt.y} L ${pt.x - sr},${pt.y + (isRa ? stem : -stem)}`,
          `M ${pt.x + sr},${pt.y} L ${pt.x + sr},${pt.y + (isRa ? stem : -stem)}`,
        ].join(' ')
        planetGroup.append('path')
          .attr('d', pathD).attr('fill', 'none')
          .attr('stroke', col).attr('stroke-width', sw)
          .attr('stroke-linecap', 'round').attr('filter', 'url(#glow)')
        planetGroup.append('circle')
          .attr('cx', pt.x).attr('cy', pt.y).attr('r', dotR * 1.5)
          .attr('fill', 'transparent')
          .on('mouseenter', () => onHover(hoverLabel))
          .on('mouseleave', () => onHover(null))
          .style('cursor', 'pointer')

      } else if (g.name === 'Guru') {
        // ─ Jupiter: rings + cream base + cloud bands + GRS ──────────────────
        const jRx = dotR * 1.7, jRy = dotR * 0.30, jsw = dotR * 0.12
        // Back ring
        planetGroup.append('ellipse')
          .attr('cx', pt.x).attr('cy', pt.y)
          .attr('rx', jRx).attr('ry', jRy)
          .attr('fill', 'none').attr('stroke', '#8b6020')
          .attr('stroke-width', jsw).attr('opacity', 0.45)
        // Planet body
        planetGroup.append('circle')
          .attr('cx', pt.x).attr('cy', pt.y).attr('r', dotR)
          .attr('fill', '#e8d898')
        ;[
          { yf: -0.62, hf: 0.20, color: '#7a4f10' },
          { yf: -0.22, hf: 0.22, color: '#a06828' },
          { yf:  0.08, hf: 0.20, color: '#7a4f10' },
          { yf:  0.42, hf: 0.22, color: '#9c6218' },
        ].forEach(b => {
          planetGroup.append('rect')
            .attr('x', pt.x - dotR).attr('y', pt.y + b.yf * dotR)
            .attr('width', dotR * 2).attr('height', b.hf * dotR)
            .attr('fill', b.color).attr('opacity', 0.8)
            .attr('clip-path', `url(#${clipId})`)
        })
        // Great Red Spot
        planetGroup.append('ellipse')
          .attr('cx', pt.x + dotR * 0.22).attr('cy', pt.y + dotR * 0.10)
          .attr('rx', dotR * 0.30).attr('ry', dotR * 0.18)
          .attr('fill', '#c03820').attr('opacity', 0.9)
          .attr('clip-path', `url(#${clipId})`)
        // Front ring arc
        planetGroup.append('path')
          .attr('d', `M ${pt.x - jRx},${pt.y} A ${jRx},${jRy} 0 0,1 ${pt.x + jRx},${pt.y}`)
          .attr('fill', 'none').attr('stroke', '#8b6020')
          .attr('stroke-width', jsw).attr('opacity', 0.85)
        planetGroup.append('circle')
          .attr('cx', pt.x).attr('cy', pt.y).attr('r', dotR)
          .attr('fill', 'transparent')
          .on('mouseenter', () => onHover(hoverLabel))
          .on('mouseleave', () => onHover(null))
          .style('cursor', 'pointer')

      } else if (g.name === 'Shani') {
        // ─ Saturn: golden body + elliptical rings ───────────────────────────
        const rRx = dotR * 2.1, rRy = dotR * 0.48, rsw = dotR * 0.38
        // Back ring (full ellipse, behind planet)
        planetGroup.append('ellipse')
          .attr('cx', pt.x).attr('cy', pt.y)
          .attr('rx', rRx).attr('ry', rRy)
          .attr('fill', 'none').attr('stroke', '#2a5090')
          .attr('stroke-width', rsw).attr('opacity', 0.55)
        // Planet body (covers middle of back ring)
        planetGroup.append('circle')
          .attr('cx', pt.x).attr('cy', pt.y).attr('r', dotR)
          .attr('fill', '#3a6aaa')
        // Subtle equatorial band
        planetGroup.append('rect')
          .attr('x', pt.x - dotR).attr('y', pt.y - dotR * 0.18)
          .attr('width', dotR * 2).attr('height', dotR * 0.20)
          .attr('fill', '#1e3a70').attr('opacity', 0.55)
          .attr('clip-path', `url(#${clipId})`)
        // Front ring arc (lower half, appears in front of planet)
        planetGroup.append('path')
          .attr('d', `M ${pt.x - rRx},${pt.y} A ${rRx},${rRy} 0 0,1 ${pt.x + rRx},${pt.y}`)
          .attr('fill', 'none').attr('stroke', '#2a5090')
          .attr('stroke-width', rsw).attr('opacity', 0.95)
        planetGroup.append('circle')
          .attr('cx', pt.x).attr('cy', pt.y).attr('r', dotR)
          .attr('fill', 'transparent')
          .on('mouseenter', () => onHover(hoverLabel))
          .on('mouseleave', () => onHover(null))
          .style('cursor', 'pointer')

      } else if (g.name === 'Mangala') {
        // ─ Mars: rust red + Syrtis Major + polar ice cap ────────────────────
        planetGroup.append('circle')
          .attr('cx', pt.x).attr('cy', pt.y).attr('r', dotR)
          .attr('fill', '#c04020')
        // Syrtis Major dark region
        planetGroup.append('ellipse')
          .attr('cx', pt.x + dotR * 0.05).attr('cy', pt.y + dotR * 0.12)
          .attr('rx', dotR * 0.38).attr('ry', dotR * 0.48)
          .attr('fill', '#6b1f08').attr('opacity', 0.55)
          .attr('clip-path', `url(#${clipId})`)
        // North polar ice cap
        planetGroup.append('circle')
          .attr('cx', pt.x).attr('cy', pt.y - dotR * 0.62)
          .attr('r', dotR * 0.42)
          .attr('fill', '#f0f0ff').attr('opacity', 0.90)
          .attr('clip-path', `url(#${clipId})`)
        planetGroup.append('circle')
          .attr('cx', pt.x).attr('cy', pt.y).attr('r', dotR)
          .attr('fill', 'transparent')
          .on('mouseenter', () => onHover(hoverLabel))
          .on('mouseleave', () => onHover(null))
          .style('cursor', 'pointer')

      } else if (g.name === 'Surya') {
        // ─ Sun: corona glow + bright disc ───────────────────────────────────
        planetGroup.append('circle')
          .attr('cx', pt.x).attr('cy', pt.y).attr('r', dotR * 2.8)
          .attr('fill', col).attr('opacity', 0.10)
        planetGroup.append('circle')
          .attr('cx', pt.x).attr('cy', pt.y).attr('r', dotR * 1.7)
          .attr('fill', col).attr('opacity', 0.20)
        planetGroup.append('circle')
          .attr('cx', pt.x).attr('cy', pt.y).attr('r', dotR)
          .attr('fill', col).attr('filter', 'url(#glow)')
          .on('mouseenter', () => onHover(hoverLabel))
          .on('mouseleave', () => onHover(null))
          .style('cursor', 'pointer')

      } else if (g.name === 'Chandra') {
        // ─ Moon: subtle glow + dark base + correct phase + craters ──────────
        planetGroup.append('circle')
          .attr('cx', pt.x).attr('cy', pt.y).attr('r', dotR * 2.0)
          .attr('fill', '#c8c8e0').attr('opacity', 0.12)
        const elong = ((g.sidereal_lon - sunLon + 360) % 360)
        const isNewMoon  = elong < 4 || elong > 356
        const isFullMoon = elong > 176 && elong < 184

        // Dark base
        planetGroup.append('circle')
          .attr('cx', pt.x).attr('cy', pt.y).attr('r', dotR)
          .attr('fill', '#0d0d1a')

        if (isFullMoon) {
          planetGroup.append('circle')
            .attr('cx', pt.x).attr('cy', pt.y).attr('r', dotR)
            .attr('fill', '#f0f0ff').attr('clip-path', `url(#${clipId})`)
        } else if (!isNewMoon) {
          const isWaxing   = elong < 180
          const isCrescent = elong < 90 || elong > 270
          const outerSweep = isWaxing ? 1 : 0
          const termSweep  = isCrescent ? (1 - outerSweep) : outerSweep
          const termR = Math.max(0.5, Math.abs(dotR * Math.cos((elong * Math.PI) / 180)))
          // Use absolute coords — clip-path is in parent space, transform would break alignment
          const pd = [
            `M ${pt.x},${pt.y - dotR}`,
            `A ${dotR},${dotR} 0 0,${outerSweep} ${pt.x},${pt.y + dotR}`,
            `A ${termR},${dotR} 0 0,${termSweep} ${pt.x},${pt.y - dotR}`,
            'Z',
          ].join(' ')
          planetGroup.append('path')
            .attr('d', pd)
            .attr('fill', '#f0f0ff')
            .attr('clip-path', `url(#${clipId})`)
        }

        // Craters
        ;[
          [0.25, -0.30, 0.18],
          [-0.35,  0.20, 0.14],
          [ 0.10,  0.44, 0.13],
          [-0.15, -0.52, 0.10],
        ].forEach(([xf, yf, rf]) => {
          planetGroup.append('circle')
            .attr('cx', pt.x + xf * dotR).attr('cy', pt.y + yf * dotR)
            .attr('r', rf * dotR)
            .attr('fill', 'none').attr('stroke', 'rgba(0,0,0,0.30)')
            .attr('stroke-width', 0.6)
            .attr('clip-path', `url(#${clipId})`)
        })

        planetGroup.append('circle')
          .attr('cx', pt.x).attr('cy', pt.y).attr('r', dotR)
          .attr('fill', 'transparent')
          .on('mouseenter', () => onHover(hoverLabel))
          .on('mouseleave', () => onHover(null))
          .style('cursor', 'pointer')

      } else {
        // ─ Other planets — solid filled circle ──────────────────────────────
        planetGroup.append('circle')
          .attr('cx', pt.x).attr('cy', pt.y).attr('r', dotR)
          .attr('fill', col).attr('filter', 'url(#glow)')
          .attr('stroke', 'white').attr('stroke-width', 0.5)
          .on('mouseenter', () => onHover(hoverLabel))
          .on('mouseleave', () => onHover(null))
          .style('cursor', 'pointer')
      }

      // Label offset outward from centre
      const labelR  = r + dotR + Math.max(8, size * 0.018)
      const labelPt = toXY(cx, cy, labelR, a)
      planetGroup.append('text')
        .attr('x', labelPt.x).attr('y', labelPt.y)
        .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
        .attr('font-size', Math.max(8, size * 0.022))
        .attr('fill', col)
        .attr('font-family', 'Noto Sans Devanagari, sans-serif')
        .attr('font-weight', '600')
        .text(g.is_retrograde ? `(${devName})` : devName)
        .style('pointer-events', 'none')
    }
  }, [svgRef, data, size, onHover, boundaries, showConstellations])
}
