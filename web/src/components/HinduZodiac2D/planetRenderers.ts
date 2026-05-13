import * as d3 from 'd3'
import type { ApiResponse } from '../../types'
import { PLANET_COLOR } from '../../constants/colors'
import { GRAHA_ABBR_DEV } from '../../constants/grahas'

interface WheelMetrics {
  cx: number
  cy: number
  radius: number
  eclipticRadius: number
  eclipticLatScale: number
}

type SvgSelection = d3.Selection<SVGSVGElement, unknown, null, undefined>

type DefsSelection = d3.Selection<SVGDefsElement, unknown, null, undefined>

const toXY = (cx: number, cy: number, r: number, angleDeg: number) => ({
  x: cx + r * Math.cos((angleDeg * Math.PI) / 180),
  y: cy + r * Math.sin((angleDeg * Math.PI) / 180),
})

const lonToAngle = (lon: number): number => (lon - 90 + 360) % 360

const appendPlanetLabel = (
  planetGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  metrics: WheelMetrics,
  labelRadius: number,
  angle: number,
  color: string,
  text: string,
) => {
  const labelPt = toXY(metrics.cx, metrics.cy, labelRadius, angle)
  planetGroup.append('text')
    .attr('x', labelPt.x).attr('y', labelPt.y)
    .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
    .attr('font-size', Math.max(8, metrics.radius * 0.022))
    .attr('fill', color)
    .attr('font-family', 'Noto Sans Devanagari, sans-serif')
    .attr('font-weight', '600')
    .text(text)
    .style('pointer-events', 'none')
}

const hoverTarget = (
  planetGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  cx: number,
  cy: number,
  radius: number,
  onHover: (label: string | null) => void,
  hoverLabel: string,
) => {
  planetGroup.append('circle')
    .attr('cx', cx).attr('cy', cy).attr('r', radius)
    .attr('fill', 'transparent')
    .on('mouseenter', () => onHover(hoverLabel))
    .on('mouseleave', () => onHover(null))
    .style('cursor', 'pointer')
}

const drawStandardPlanet = (
  planetGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  pt: { x: number; y: number },
  dotR: number,
  col: string,
  onHover: (label: string | null) => void,
  hoverLabel: string,
) => {
  planetGroup.append('circle')
    .attr('cx', pt.x).attr('cy', pt.y).attr('r', dotR)
    .attr('fill', col).attr('filter', 'url(#glow)')
    .attr('stroke', 'white').attr('stroke-width', 0.5)
    .on('mouseenter', () => onHover(hoverLabel))
    .on('mouseleave', () => onHover(null))
    .style('cursor', 'pointer')
}

const drawRahuKetuPlanet = (
  planetGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  pt: { x: number; y: number },
  dotR: number,
  col: string,
  gName: string,
  onHover: (label: string | null) => void,
  hoverLabel: string,
) => {
  const sr = dotR
  const stem = dotR
  const isRa = gName === 'Rahu'
  const pathD = [
    `M ${pt.x - sr},${pt.y}`,
    `A ${sr},${sr} 0 0,${isRa ? 0 : 1} ${pt.x + sr},${pt.y}`,
    `M ${pt.x - sr},${pt.y} L ${pt.x - sr},${pt.y + (isRa ? stem : -stem)}`,
    `M ${pt.x + sr},${pt.y} L ${pt.x + sr},${pt.y + (isRa ? stem : -stem)}`,
  ].join(' ')
  planetGroup.append('path')
    .attr('d', pathD).attr('fill', 'none')
    .attr('stroke', col).attr('stroke-width', Math.max(1, dotR * 0.003))
    .attr('stroke-linecap', 'round').attr('filter', 'url(#glow)')
  hoverTarget(planetGroup, pt.x, pt.y, dotR * 1.5, onHover, hoverLabel)
}

const drawGuruPlanet = (
  planetGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  pt: { x: number; y: number },
  dotR: number,
  clipId: string,
  onHover: (label: string | null) => void,
  hoverLabel: string,
) => {
  const jRx = dotR * 1.7
  const jRy = dotR * 0.30
  const jsw = dotR * 0.12
  planetGroup.append('ellipse')
    .attr('cx', pt.x).attr('cy', pt.y)
    .attr('rx', jRx).attr('ry', jRy)
    .attr('fill', 'none').attr('stroke', '#8b6020')
    .attr('stroke-width', jsw).attr('opacity', 0.45)
  planetGroup.append('circle')
    .attr('cx', pt.x).attr('cy', pt.y).attr('r', dotR)
    .attr('fill', '#e8d898')
  ;[
    { yf: -0.62, hf: 0.20, color: '#7a4f10' },
    { yf: -0.22, hf: 0.22, color: '#a06828' },
    { yf: 0.08, hf: 0.20, color: '#7a4f10' },
    { yf: 0.42, hf: 0.22, color: '#9c6218' },
  ].forEach(b => {
    planetGroup.append('rect')
      .attr('x', pt.x - dotR).attr('y', pt.y + b.yf * dotR)
      .attr('width', dotR * 2).attr('height', b.hf * dotR)
      .attr('fill', b.color).attr('opacity', 0.8)
      .attr('clip-path', `url(#${clipId})`)
  })
  planetGroup.append('ellipse')
    .attr('cx', pt.x + dotR * 0.22).attr('cy', pt.y + dotR * 0.10)
    .attr('rx', dotR * 0.30).attr('ry', dotR * 0.18)
    .attr('fill', '#d4785a').attr('opacity', 0.55)
    .attr('clip-path', `url(#${clipId})`)
  planetGroup.append('path')
    .attr('d', `M ${pt.x - jRx},${pt.y} A ${jRx},${jRy} 0 0,1 ${pt.x + jRx},${pt.y}`)
    .attr('fill', 'none').attr('stroke', '#8b6020')
    .attr('stroke-width', jsw).attr('opacity', 0.85)
  hoverTarget(planetGroup, pt.x, pt.y, dotR, onHover, hoverLabel)
}

const drawShaniPlanet = (
  planetGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  pt: { x: number; y: number },
  dotR: number,
  clipId: string,
  onHover: (label: string | null) => void,
  hoverLabel: string,
) => {
  const rRx = dotR * 2.1
  const rRy = dotR * 0.48
  const rsw = dotR * 0.38
  planetGroup.append('ellipse')
    .attr('cx', pt.x).attr('cy', pt.y)
    .attr('rx', rRx).attr('ry', rRy)
    .attr('fill', 'none').attr('stroke', '#2a5090')
    .attr('stroke-width', rsw).attr('opacity', 0.55)
  planetGroup.append('circle')
    .attr('cx', pt.x).attr('cy', pt.y).attr('r', dotR)
    .attr('fill', '#3a6aaa')
  planetGroup.append('rect')
    .attr('x', pt.x - dotR).attr('y', pt.y - dotR * 0.18)
    .attr('width', dotR * 2).attr('height', dotR * 0.20)
    .attr('fill', '#1e3a70').attr('opacity', 0.55)
    .attr('clip-path', `url(#${clipId})`)
  planetGroup.append('path')
    .attr('d', `M ${pt.x - rRx},${pt.y} A ${rRx},${rRy} 0 0,1 ${pt.x + rRx},${pt.y}`)
    .attr('fill', 'none').attr('stroke', '#2a5090')
    .attr('stroke-width', rsw).attr('opacity', 0.95)
  hoverTarget(planetGroup, pt.x, pt.y, dotR, onHover, hoverLabel)
}

const drawMangalaPlanet = (
  planetGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  pt: { x: number; y: number },
  dotR: number,
  clipId: string,
  onHover: (label: string | null) => void,
  hoverLabel: string,
) => {
  planetGroup.append('circle')
    .attr('cx', pt.x).attr('cy', pt.y).attr('r', dotR)
    .attr('fill', '#c04020')
  planetGroup.append('ellipse')
    .attr('cx', pt.x + dotR * 0.05).attr('cy', pt.y + dotR * 0.12)
    .attr('rx', dotR * 0.38).attr('ry', dotR * 0.48)
    .attr('fill', '#6b1f08').attr('opacity', 0.55)
    .attr('clip-path', `url(#${clipId})`)
  hoverTarget(planetGroup, pt.x, pt.y, dotR, onHover, hoverLabel)
}

const drawSuryaPlanet = (
  planetGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  pt: { x: number; y: number },
  dotR: number,
  col: string,
  onHover: (label: string | null) => void,
  hoverLabel: string,
) => {
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
}

const drawChandraPlanet = (
  planetGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  pt: { x: number; y: number },
  dotR: number,
  clipId: string,
  sunLon: number,
  lon: number,
  onHover: (label: string | null) => void,
  hoverLabel: string,
) => {
  planetGroup.append('circle')
    .attr('cx', pt.x).attr('cy', pt.y).attr('r', dotR * 1.8)
    .attr('fill', '#ffffff').attr('opacity', 0.18)

  const elong = ((lon - sunLon + 360) % 360)
  const isNewMoon = elong < 4 || elong > 356
  const isFullMoon = elong > 176 && elong < 184

  planetGroup.append('circle')
    .attr('cx', pt.x).attr('cy', pt.y).attr('r', dotR)
    .attr('fill', '#0d0d1a')

  if (isFullMoon) {
    planetGroup.append('circle')
      .attr('cx', pt.x).attr('cy', pt.y).attr('r', dotR)
      .attr('fill', '#f0f0ff').attr('clip-path', `url(#${clipId})`)
  } else if (!isNewMoon) {
    const isWaxing = elong < 180
    const isCrescent = elong < 90 || elong > 270
    const outerSweep = isWaxing ? 1 : 0
    const termSweep = isCrescent ? (1 - outerSweep) : outerSweep
    const termR = Math.max(0.5, Math.abs(dotR * Math.cos((elong * Math.PI) / 180)))
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

  ;[
    [0.25, -0.30, 0.18],
    [-0.35, 0.20, 0.14],
    [0.10, 0.44, 0.13],
    [-0.15, -0.52, 0.10],
  ].forEach(([xf, yf, rf]) => {
    planetGroup.append('circle')
      .attr('cx', pt.x + xf * dotR).attr('cy', pt.y + yf * dotR)
      .attr('r', rf * dotR)
      .attr('fill', 'none').attr('stroke', 'rgba(0,0,0,0.30)')
      .attr('stroke-width', 0.6)
      .attr('clip-path', `url(#${clipId})`)
  })

  hoverTarget(planetGroup, pt.x, pt.y, dotR, onHover, hoverLabel)
}

const defsForPlanet = (
  defs: DefsSelection,
  pt: { x: number; y: number },
  dotR: number,
  clipId: string,
) => {
  const clip = defs.append('clipPath').attr('id', clipId)
  clip.append('circle').attr('cx', pt.x).attr('cy', pt.y).attr('r', dotR)
}

export function renderPlanets(
  svg: SvgSelection,
  defs: DefsSelection,
  metrics: WheelMetrics,
  data: ApiResponse,
  onHover: (label: string | null) => void,
) {
  const planetGroup = svg.append('g').attr('class', 'planets')
  const PLANET_SCALE: Record<string, [number, number]> = {
    Budha: [3, 0.008],
    Shukra: [3, 0.009],
    Chandra: [6, 0.014],
    Surya: [11, 0.028],
    Mangala: [6, 0.015],
    Rahu: [4, 0.012],
    Ketu: [4, 0.012],
    Shani: [7, 0.018],
    Guru: [8, 0.022],
  }

  const sunLon = data.grahas.find(g => g.name === 'Surya')?.sidereal_lon ?? 0

  for (const g of data.grahas) {
    const a = lonToAngle(g.sidereal_lon)
    const r = metrics.eclipticRadius + g.ecl_lat * metrics.eclipticLatScale
    const pt = toXY(metrics.cx, metrics.cy, r, a)
    const col = PLANET_COLOR[g.name] ?? '#ffffff'
    const [minR, scale] = PLANET_SCALE[g.name] ?? [5, 0.013]
    const dotR = Math.max(minR, metrics.radius * scale)
    const devName = GRAHA_ABBR_DEV[g.name] ?? g.abbr
    const hoverLabel = `${g.name} · ${g.nakshatra_en} Pada ${g.pada} · ${g.sidereal_lon.toFixed(2)}° (lat ${g.ecl_lat.toFixed(2)}°)`
    const clipId = `pc-${g.name}`

    defsForPlanet(defs, pt, dotR, clipId)

    switch (g.name) {
      case 'Rahu':
      case 'Ketu':
        drawRahuKetuPlanet(planetGroup, pt, dotR, col, g.name, onHover, hoverLabel)
        break
      case 'Guru':
        drawGuruPlanet(planetGroup, pt, dotR, clipId, onHover, hoverLabel)
        break
      case 'Shani':
        drawShaniPlanet(planetGroup, pt, dotR, clipId, onHover, hoverLabel)
        break
      case 'Mangala':
        drawMangalaPlanet(planetGroup, pt, dotR, clipId, onHover, hoverLabel)
        break
      case 'Surya':
        drawSuryaPlanet(planetGroup, pt, dotR, col, onHover, hoverLabel)
        break
      case 'Chandra':
        drawChandraPlanet(planetGroup, pt, dotR, clipId, sunLon, g.sidereal_lon, onHover, hoverLabel)
        break
      default:
        drawStandardPlanet(planetGroup, pt, dotR, col, onHover, hoverLabel)
    }

    const labelR = r + dotR + Math.max(8, metrics.radius * 0.018)
    appendPlanetLabel(planetGroup, metrics, labelR, a, col, g.is_retrograde ? `(${devName})` : devName)
  }
}
