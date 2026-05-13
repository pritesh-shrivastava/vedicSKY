import { useEffect } from 'react'
import * as d3 from 'd3'
import type { RefObject } from 'react'
import type { ApiResponse } from '../../types'
import { renderD3Wheel, type BoundaryMode } from './wheelRenderer'

export type { BoundaryMode }

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
    renderD3Wheel(svg, { data, size, onHover, boundaries, showConstellations })
  }, [svgRef, data, size, onHover, boundaries, showConstellations])
}
