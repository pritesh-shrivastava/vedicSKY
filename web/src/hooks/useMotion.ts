import { useEffect, useState } from 'react'
import type { Location, MotionResponse } from '../types'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export type MotionState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; data: MotionResponse }

async function fetchMotion(loc: Location, startIso: string, days = 7, stepHours = 24): Promise<MotionResponse> {
  const params = new URLSearchParams({
    lat: String(loc.lat),
    lon: String(loc.lon),
    alt: String(loc.alt),
    tz: loc.tz,
    start: startIso,
    days: String(days),
    step_hours: String(stepHours),
  })
  const res = await fetch(`${API_BASE}/motion?${params}`)
  if (!res.ok) throw new Error(`Motion API error ${res.status}`)
  return res.json()
}

export function useMotion(loc: Location, startIso: string | null, days = 7, stepHours = 24): MotionState {
  const [state, setState] = useState<MotionState>({ status: 'idle' })

  useEffect(() => {
    if (!startIso) {
      setState({ status: 'idle' })
      return
    }

    let cancelled = false
    setState({ status: 'loading' })

    fetchMotion(loc, startIso, days, stepHours)
      .then(data => { if (!cancelled) setState({ status: 'ok', data }) })
      .catch(err => { if (!cancelled) setState({ status: 'error', message: String(err) }) })

    return () => { cancelled = true }
  }, [loc.lat, loc.lon, loc.alt, loc.tz, startIso, days, stepHours])

  return state
}
