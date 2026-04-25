export interface GrahaPosition {
  name: string
  abbr: string
  sidereal_lon: number
  ecl_lat: number        // ecliptic latitude — planets spread inside/outside ecliptic circle
  rashi_en: string
  rashi_idx: number
  nakshatra_en: string
  pada: number
  is_retrograde: boolean
}

export interface Lagna {
  sidereal_lon: number
  rashi_idx: number
}

export interface ApiResponse {
  timestamp: string
  ayanamsha: number
  lagna: Lagna
  grahas: GrahaPosition[]
}

export interface Location {
  lat: number
  lon: number
  alt: number
  tz: string
}
