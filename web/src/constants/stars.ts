// Star positions derived from Swiss Ephemeris via scripts/export_zodiac_stars.py
// Sidereal ecliptic coordinates, Lahiri ayanamsha, J2000.0
// Re-run the script to regenerate stars_data.json after any changes.

import starsData from './stars_data.json'

export interface ConstellationDef {
  name: string
  stars: readonly [number, number][]  // [sidereal_lon, ecl_lat]
  lines: readonly [number, number][]  // [star_i, star_j]
}

export const CONSTELLATION_DATA: ConstellationDef[] = starsData.constellations.map(c => ({
  name: c.rashi,
  stars: c.stars
    .filter(s => s.lon !== null && s.lat !== null)
    .map(s => [s.lon as number, s.lat as number] as [number, number]),
  lines: c.lines as unknown as [number, number][],
}))

// ── Nakshatra text data ───────────────────────────────────────────────────────

export const NAK_NAMES: string[] = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
]

// Devanagari — full names for hover tooltips
export const NAK_NAMES_DEV: string[] = [
  'अश्विनी', 'भरणी', 'कृत्तिका', 'रोहिणी', 'मृगशिरा', 'आर्द्रा',
  'पुनर्वसु', 'पुष्य', 'आश्लेषा', 'मघा', 'पूर्व फाल्गुनी', 'उत्तर फाल्गुनी',
  'हस्त', 'चित्रा', 'स्वाति', 'विशाखा', 'अनुराधा', 'ज्येष्ठा',
  'मूल', 'पूर्वाषाढ़ा', 'उत्तराषाढ़ा', 'श्रवण', 'धनिष्ठा', 'शतभिषा',
  'पूर्व भाद्रपद', 'उत्तर भाद्रपद', 'रेवती',
]

// Short labels for the nakshatra wheel
export const NAK_NAMES_DEV_SHORT: string[] = [
  'अश्वि', 'भरणि', 'कृत्ति', 'रोहिणि', 'मृग', 'आर्द्रा',
  'पुनर्व', 'पुष्य', 'आश्ले', 'मघा', 'पू.फा', 'उ.फा',
  'हस्त', 'चित्रा', 'स्वाति', 'विशाखा', 'अनुरा', 'ज्येष्ठा',
  'मूल', 'पू.षा', 'उ.षा', 'श्रवण', 'धनिष्ठा', 'शतभि',
  'पू.भा', 'उ.भा', 'रेवती',
]

// Yoga tara (principal star) per nakshatra — derived from ephemeris.
// [name_en, sidereal_lon, ecl_lat, bayer_label]
export const NAKSHATRA_YOGA_TARAS: [string, number, number, string][] =
  starsData.yoga_taras
    .filter(y => y.lon !== null && y.lat !== null)
    .map(y => [y.nakshatra_en, y.lon as number, y.lat as number, y.bayer] as [string, number, number, string])
