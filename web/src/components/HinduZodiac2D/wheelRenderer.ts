import * as d3 from 'd3'
import type { ApiResponse } from '../../types'
import { RASHI_DEV_SHORT } from '../../constants/rashis'
import { RASHI_COLORS, PLANET_COLOR } from '../../constants/colors'
import { NAKSHATRA_YOGA_TARAS, NAK_NAMES_DEV, NAK_NAMES_DEV_SHORT, CONSTELLATION_DATA } from '../../constants/stars'
import { renderPlanets } from './planetRenderers'

export type BoundaryMode = 'rashi' | 'nakshatra'

type SvgSelection = d3.Selection<SVGSVGElement, unknown, null, undefined>

interface WheelMetrics {
  cx: number
  cy: number
  radius: number
  eclipticRadius: number
  eclipticLatScale: number
  rashiInnerRadius: number
  degreeLabelRadius: number
}

interface RenderWheelOptions {
  data: ApiResponse | null
  size: number
  onHover: (label: string | null) => void
  boundaries: BoundaryMode
  showConstellations: boolean
}

const NAK_SPAN = 360 / 27

// Sidereal longitude → SVG angle in degrees
// lon=0 (Aries) → 270° → top of SVG. Clockwise.
const lonToAngle = (lon: number): number => (lon - 90 + 360) % 360

// Polar → SVG cartesian
const toXY = (cx: number, cy: number, r: number, angleDeg: number) => ({
  x: cx + r * Math.cos((angleDeg * Math.PI) / 180),
  y: cy + r * Math.sin((angleDeg * Math.PI) / 180),
})

const getWheelMetrics = (size: number): WheelMetrics => {
  const cx = size / 2
  const cy = size / 2
  const radius = size / 2 - 20
  const eclipticRadius = radius * 0.72
  const eclipticLatScale = 1.5
  return {
    cx,
    cy,
    radius,
    eclipticRadius,
    eclipticLatScale,
    rashiInnerRadius: eclipticRadius - Math.max(14, size * 0.036),
    degreeLabelRadius: eclipticRadius + Math.max(10, size * 0.026),
  }
}

const drawDefs = (svg: SvgSelection) => {
  const defs = svg.append('defs')
  defs.append('filter').attr('id', 'glow')
    .call(f => {
      f.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur')
      const merge = f.append('feMerge')
      merge.append('feMergeNode').attr('in', 'blur')
      merge.append('feMergeNode').attr('in', 'SourceGraphic')
    })
  return defs
}

const drawStarfield = (svg: SvgSelection, metrics: WheelMetrics) => {
  const starGroup = svg.append('g').attr('class', 'starfield')
  const rng = d3.randomLcg(42)

  for (let i = 0; i < 180; i++) {
    const angle = rng() * 360
    const r = rng() * (metrics.eclipticRadius - 10) + 10
    const pt = toXY(metrics.cx, metrics.cy, r, angle)
    starGroup.append('circle')
      .attr('cx', pt.x).attr('cy', pt.y)
      .attr('r', rng() * 0.8 + 0.3)
      .attr('fill', 'white')
      .attr('opacity', rng() * 0.35 + 0.08)
  }
}

const drawEclipticCircle = (svg: SvgSelection, metrics: WheelMetrics) => {
  svg.append('circle')
    .attr('cx', metrics.cx).attr('cy', metrics.cy).attr('r', metrics.eclipticRadius)
    .attr('fill', 'none')
    .attr('stroke', 'rgba(255,255,255,0.3)')
    .attr('stroke-width', 0.8)
}

const drawNakshatraRing = (svg: SvgSelection, metrics: WheelMetrics) => {
  const nakGroup = svg.append('g').attr('class', 'nakshatra-ring')
  for (let i = 0; i < 27; i++) {
    const lon = i * NAK_SPAN
    const a0 = lonToAngle(lon)
    nakGroup.append('line')
      .attr('x1', metrics.cx).attr('y1', metrics.cy)
      .attr('x2', toXY(metrics.cx, metrics.cy, metrics.eclipticRadius, a0).x)
      .attr('y2', toXY(metrics.cx, metrics.cy, metrics.eclipticRadius, a0).y)
      .attr('stroke', 'rgba(255,255,255,0.12)')
      .attr('stroke-width', 0.5)

    const midA = lonToAngle(lon + NAK_SPAN / 2)
    const midPt = toXY(metrics.cx, metrics.cy, metrics.eclipticRadius - Math.max(10, metrics.radius * 0.025), midA)
    nakGroup.append('text')
      .attr('x', midPt.x).attr('y', midPt.y)
      .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
      .attr('font-size', Math.max(5, metrics.radius * 0.013))
      .attr('fill', 'rgba(255,255,255,0.28)')
      .attr('font-family', 'Noto Sans Devanagari, sans-serif')
      .attr('transform', `rotate(${midA + 90},${midPt.x},${midPt.y})`)
      .text(NAK_NAMES_DEV_SHORT[i])
  }
}

const drawRashiRing = (svg: SvgSelection, metrics: WheelMetrics, boundaries: BoundaryMode) => {
  const rashiGroup = svg.append('g').attr('class', 'rashi-ring')
  for (let i = 0; i < 12; i++) {
    const lon = i * 30
    const a = lonToAngle(lon)

    if (boundaries === 'rashi') {
      const ep = toXY(metrics.cx, metrics.cy, metrics.eclipticRadius, a)
      rashiGroup.append('line')
        .attr('x1', metrics.cx).attr('y1', metrics.cy)
        .attr('x2', ep.x).attr('y2', ep.y)
        .attr('stroke', 'rgba(255,255,255,0.18)')
        .attr('stroke-width', 0.5)
    }

    const dotPt = toXY(metrics.cx, metrics.cy, metrics.eclipticRadius, a)
    rashiGroup.append('circle')
      .attr('cx', dotPt.x).attr('cy', dotPt.y)
      .attr('r', Math.max(1, metrics.radius * 0.002))
      .attr('fill', 'rgba(255,255,255,0.5)')

    const degPt = toXY(metrics.cx, metrics.cy, metrics.degreeLabelRadius, a)
    rashiGroup.append('text')
      .attr('x', degPt.x).attr('y', degPt.y)
      .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
      .attr('font-size', Math.max(7, metrics.radius * 0.016))
      .attr('fill', 'rgba(255,255,255,0.55)')
      .attr('font-family', 'Inter, sans-serif')
      .text(`${lon}°`)

    if (boundaries === 'rashi') {
      const midA = lonToAngle(lon + 15)
      const midPt = toXY(metrics.cx, metrics.cy, metrics.rashiInnerRadius, midA)
      rashiGroup.append('text')
        .attr('x', midPt.x).attr('y', midPt.y)
        .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
        .attr('font-size', Math.max(6, metrics.radius * 0.016))
        .attr('fill', 'rgba(255,255,255,0.38)')
        .attr('font-family', 'Noto Sans Devanagari, sans-serif')
        .attr('transform', `rotate(${midA + 90},${midPt.x},${midPt.y})`)
        .text(RASHI_DEV_SHORT[i])
    }
  }
}

const drawReferenceLines = (svg: SvgSelection, metrics: WheelMetrics, data: ApiResponse | null) => {
  const refGroup = svg.append('g').attr('class', 'ref-lines')
  const ariesA = lonToAngle(0)
  const ariesP = toXY(metrics.cx, metrics.cy, metrics.eclipticRadius, ariesA)
  const ariesOpp = toXY(metrics.cx, metrics.cy, metrics.eclipticRadius, (ariesA + 180) % 360)
  refGroup.append('line')
    .attr('x1', ariesOpp.x).attr('y1', ariesOpp.y)
    .attr('x2', ariesP.x).attr('y2', ariesP.y)
    .attr('stroke', 'rgba(255,255,255,0.15)')
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '4,4')

  if (!data) return

  const lagnaA = lonToAngle(data.lagna.sidereal_lon)
  const lagnaP = toXY(metrics.cx, metrics.cy, metrics.eclipticRadius, lagnaA)
  const lagnaOpp = toXY(metrics.cx, metrics.cy, metrics.eclipticRadius, (lagnaA + 180) % 360)
  refGroup.append('line')
    .attr('x1', lagnaOpp.x).attr('y1', lagnaOpp.y)
    .attr('x2', lagnaP.x).attr('y2', lagnaP.y)
    .attr('stroke', PLANET_COLOR.Lagna)
    .attr('stroke-width', 1.5)
    .attr('opacity', 0.85)
  refGroup.append('text')
    .attr('x', lagnaP.x).attr('y', lagnaP.y)
    .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
    .attr('font-size', Math.max(7, metrics.radius * 0.018))
    .attr('fill', PLANET_COLOR.Lagna)
    .attr('font-family', 'Noto Sans Devanagari, sans-serif')
    .attr('dy', -8)
    .text('लग्न')
}

const drawConstellations = (svg: SvgSelection, metrics: WheelMetrics, showConstellations: boolean) => {
  if (!showConstellations) return

  const constellationLayer = svg.append('g').attr('class', 'constellations')
  for (let ri = 0; ri < CONSTELLATION_DATA.length; ri++) {
    const { stars, lines } = CONSTELLATION_DATA[ri]
    const color = RASHI_COLORS[ri]
    const pts = stars.map(([lon, lat]) =>
      toXY(metrics.cx, metrics.cy, metrics.eclipticRadius + lat * metrics.eclipticLatScale, lonToAngle(lon))
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
        .attr('r', Math.max(1.5, metrics.radius * 0.003))
        .attr('fill', color)
        .attr('opacity', 0.7)
    }
  }
}

const drawYogaTaras = (svg: SvgSelection, metrics: WheelMetrics, showConstellations: boolean, onHover: (label: string | null) => void) => {
  if (!showConstellations) return

  const starLayer = svg.append('g').attr('class', 'stars')
  NAKSHATRA_YOGA_TARAS.forEach(([, lon, lat], ni) => {
    const a = lonToAngle(lon)
    const r = metrics.eclipticRadius + lat * metrics.eclipticLatScale
    const pt = toXY(metrics.cx, metrics.cy, r, a)
    starLayer.append('circle')
      .attr('cx', pt.x).attr('cy', pt.y)
      .attr('r', Math.max(2, metrics.radius * 0.005))
      .attr('fill', 'rgba(255,255,220,0.75)')
      .attr('filter', 'url(#glow)')
      .on('mouseenter', () => onHover(NAK_NAMES_DEV[ni]))
      .on('mouseleave', () => onHover(null))
      .style('cursor', 'pointer')
  })
}

export function renderD3Wheel(svg: SvgSelection, options: RenderWheelOptions) {
  const { data, size, onHover, boundaries, showConstellations } = options
  if (size < 100) return

  svg.selectAll('*').remove()

  const metrics = getWheelMetrics(size)
  const defs = drawDefs(svg)
  drawStarfield(svg, metrics)
  drawEclipticCircle(svg, metrics)

  if (boundaries === 'nakshatra') {
    drawNakshatraRing(svg, metrics)
  }

  drawRashiRing(svg, metrics, boundaries)
  drawReferenceLines(svg, metrics, data)
  drawConstellations(svg, metrics, showConstellations)
  drawYogaTaras(svg, metrics, showConstellations, onHover)

  if (data) {
    renderPlanets(svg, defs, metrics, data, onHover)
  }
}
