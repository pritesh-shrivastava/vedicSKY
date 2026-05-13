import { useState, useEffect } from 'react'
import type { ApiResponse, Location } from '../types'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

async function fetchPositions(loc: Location, dt?: string | null): Promise<ApiResponse> {
  const params = new URLSearchParams({
    lat: String(loc.lat),
    lon: String(loc.lon),
    alt: String(loc.alt),
    tz: loc.tz,
  })
  if (dt) params.set('dt', dt)
  const res = await fetch(`${API_BASE}/positions?${params}`)
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

export type PositionsState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; data: ApiResponse }

export function usePositions(loc: Location, dt?: string | null): PositionsState {
  const [state, setState] = useState<PositionsState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    const doFetch = () => {
      fetchPositions(loc, dt)
        .then(data => { if (!cancelled) setState({ status: 'ok', data }) })
        .catch(err => { if (!cancelled) setState({ status: 'error', message: String(err) }) })
    }

    setState({ status: 'loading' })
    doFetch()

    const liveRefresh = !dt
    const id = liveRefresh ? setInterval(doFetch, 60_000) : undefined

    const onVisible = () => {
      if (!dt && document.visibilityState === 'visible') doFetch()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      if (id) clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [loc.lat, loc.lon, loc.alt, loc.tz, dt])

  return state
}
