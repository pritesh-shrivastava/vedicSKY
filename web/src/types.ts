export interface GrahaPosition {
  name: string
  abbr: string
  sidereal_lon: number
  ecl_lat: number
  speed: number
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

export interface MotionGrahaSample {
  name: string
  abbr: string
  sidereal_lon: number
  speed: number
  is_retrograde: boolean
  rashi_idx: number
  nakshatra_en: string
}

export interface MotionSample {
  timestamp: string
  grahas: MotionGrahaSample[]
}

export interface MotionResponse {
  start: string
  days: number
  step_hours: number
  samples: MotionSample[]
}
