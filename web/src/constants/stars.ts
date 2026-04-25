// All coordinates are VEDIC SIDEREAL (Lahiri ayanamsha).
// Yoga tara positions from NAKSHATRA_YOGA_TARAS are the anchors.
// Supporting stars are placed at their natural sidereal positions near
// each nakshatra — NOT clamped into 30° rashi sectors.
// Constellations span their actual widths in the sidereal sky.

export interface ConstellationDef {
  name: string
  stars: readonly [number, number][]  // [sidereal_lon, ecl_lat]
  lines: readonly [number, number][]  // [star_i, star_j]
}

export const CONSTELLATION_DATA: ConstellationDef[] = [

  // 0: MESHA (Aries) — Ram: small hook (Ashwini trio + Bharani triangle)
  // Natural span: ~6–22° sidereal
  {
    name: 'Mesha',
    stars: [
      [ 6.5,  7.5],  // γ Ari (Mesarthim) — Ashwini supporting
      [ 8.0,  8.6],  // β Ari (Sheratan)  — Ashwini yoga tara ★
      [ 9.5,  9.4],  // α Ari (Hamal)     — Ashwini supporting
      [18.5, 10.0],  // 35 Ari            — Bharani supporting
      [20.0, 10.6],  // 41 Ari            — Bharani yoga tara ★
      [21.5, 10.0],  // 39 Ari            — Bharani supporting
    ],
    // Ashwini short hook; Bharani triangle; hook tip connects to Bharani
    lines: [[0,1],[1,2],[3,4],[4,5],[2,3]],
  },

  // 1: VRISHABHA (Taurus) — Bull: Pleiades + Hyades V-face + two horns
  // Natural span: ~32–60° sidereal
  {
    name: 'Vrishabha',
    stars: [
      [35.5,  5.0],  // Pleiades cluster star
      [37.5,  4.0],  // η Tau (Alcyone)   — Krittika yoga tara ★
      [39.0,  4.8],  // Pleiades cluster star
      [46.5, -2.8],  // δ¹ Tau            — Hyades V upper-left
      [48.0, -4.0],  // γ Tau (Hyadum)    — Hyades V centre
      [49.0, -5.5],  // α Tau (Aldebaran) — Rohini yoga tara ★, tip of V / bull's eye
      [50.0, -4.0],  // ε Tau             — Hyades V right
      [51.5, -2.8],  // θ Tau             — Hyades V upper-right
      [58.0,  5.2],  // β Tau (Elnath)    — north horn tip
      [59.0,  2.4],  // ζ Tau             — south horn tip
    ],
    // Pleiades cluster; Hyades V; horns from upper Hyades arms
    lines: [[0,1],[1,2],[3,4],[4,5],[5,6],[6,7],[4,8],[6,9]],
  },

  // 2: MITHUNA (Gemini) — Twins: H-shape, feet at Mrigashira, heads at Punarvasu
  // Natural span: ~60–95° sidereal (crosses Karka boundary — correct)
  {
    name: 'Mithuna',
    stars: [
      [63.0, -8.9],  // λ Ori (Meissa)   — Mrigashira yoga tara ★, shared feet
      [67.8, -8.0],  // α Ori (Betelgeuse)— Ardra yoga tara ★, left foot
      [68.5, -5.0],  // μ Gem (Tejat)    — lower body left
      [71.5,  3.0],  // ε Gem (Mebsuda)  — mid body left
      [78.0,  7.0],  // ν Gem            — shoulder left
      [82.0,  9.5],  // α Gem (Castor)   — head left
      [83.0,  6.5],  // β Gem (Pollux)   — head right
      [80.0,  4.0],  // δ Gem (Wasat)    — shoulder right
      [75.0,  0.5],  // η Gem            — mid body right
      [93.0,  6.7],  // β Gem / Punarvasu— Punarvasu yoga tara ★ (upper head area)
    ],
    // Castor chain: feet→body-left→shoulders→Castor head
    // Pollux chain: feet→body-right→shoulders→Pollux head
    // heads joined; Punarvasu as the bright head star
    lines: [[0,2],[2,3],[3,4],[4,5],[1,8],[8,7],[7,6],[5,6],[6,9]],
  },

  // 3: KARKA (Cancer) — Crab: faint Y-shape
  // Natural span: ~91–114° sidereal
  {
    name: 'Karka',
    stars: [
      [ 91.5,  7.0],  // ι Cnc            — upper arm
      [ 93.0,  6.7],  // Punarvasu YT ★   — top (shared with Mithuna)
      [ 95.5,  4.0],  // γ Cnc (Asellus Borealis) — centre
      [ 97.0,  0.8],  // δ Cnc (Asellus Australis)— node
      [106.0,  0.1],  // δ Cnc area       — Pushya yoga tara ★
      [109.0, -4.5],  // ε Hya            — Ashlesha yoga tara ★, south claw
      [111.5, -3.0],  // α Cnc (Acubens)  — east claw
    ],
    lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[4,6]],
  },

  // 4: SIMHA (Leo) — Lion: sickle mane + chest + body + tail
  // Natural span: ~120–160° sidereal (tail crosses into Kanya — correct)
  {
    name: 'Simha',
    stars: [
      [121.0,  8.5],  // ε Leo (Ras Elased) — sickle top-left
      [123.5, 10.2],  // ζ Leo (Adhafera)   — sickle curve
      [126.0,  9.8],  // γ Leo (Algieba)    — sickle curve lower
      [128.0,  7.5],  // η Leo              — sickle inner curve
      [129.0,  0.5],  // α Leo (Regulus)    — Magha yoga tara ★, sickle base/chest
      [138.5, 12.5],  // θ Leo (Chertan)    — body
      [143.5, 14.0],  // δ Leo (Zosma)      — hindquarters
      [151.0, 13.0],  // Purva Phalguni YT ★ (δ Leo / Zosma area) — tail base
      [155.0, 14.0],  // Uttara Phalguni YT ★— tail tip (Denebola)
    ],
    // sickle: top→curve→Regulus; body/tail extends naturally beyond 150°
    lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8]],
  },

  // 5: KANYA (Virgo) — Maiden: Y-figure, arms out, Spica at hand/wheat
  // Natural span: ~155–182° sidereal
  {
    name: 'Kanya',
    stars: [
      [155.0, 14.0],  // Uttara Phalguni YT ★ — right arm (Denebola area)
      [160.0,  2.0],  // β Vir (Zavijava)    — upper body
      [163.5, 16.5],  // ε Vir (Vindemiatrix)— raised left arm
      [165.5,  3.5],  // γ Vir (Porrima)     — waist
      [170.0,-12.0],  // Hasta yoga tara ★   — lower left hand
      [173.5,  5.0],  // ζ Vir               — hip
      [176.0,  8.5],  // δ Vir               — knee
      [180.0, -2.1],  // Chitra YT ★ (Spica) — tip of wheat / right hand
    ],
    // arms, body, down to Spica
    lines: [[0,1],[1,2],[1,3],[3,4],[3,5],[5,6],[5,7]],
  },

  // 6: TULA (Libra) — Scales: balance beam + two pans
  // Natural span: ~178–214° sidereal
  {
    name: 'Tula',
    stars: [
      [180.0, -2.1],  // Chitra YT ★ (Spica) — shared with Kanya, left edge
      [186.5,  1.0],  // γ Lib               — beam fulcrum
      [192.5,  9.0],  // β Lib (Zubeneschamali)— north pan (bright green star)
      [194.5, -6.5],  // σ Lib               — south pan (lower)
      [199.5,  0.5],  // α Lib (Zubenelgenubi)— south pan (brighter)
      [199.0, 30.8],  // Swati YT ★ (Arcturus)— far north highlight
    ],
    // beam: fulcrum→both pans; Swati as brilliant north star above
    lines: [[1,2],[1,4],[2,4],[1,3],[1,5]],
  },

  // 7: VRISHCHIKA (Scorpio) — Scorpion: forehead + long body + stinger curl
  // Natural span: ~210–243° sidereal (crosses into Dhanu — correct)
  {
    name: 'Vrishchika',
    stars: [
      [210.0,  3.5],  // π Sco              — forehead
      [212.0,  0.5],  // Vishakha YT ★      — head
      [214.5, -0.5],  // β Sco (Graffias)   — neck
      [217.0, -1.5],  // δ Sco (Dschubba)   — chest
      [219.5, -3.5],  // τ Sco              — upper body
      [224.0, -1.6],  // Anuradha YT ★      — body
      [229.0, -4.6],  // Jyeshtha YT ★ (Antares)— heart
      [232.5, -8.5],  // ζ¹ Sco             — upper tail
      [234.5,-11.5],  // η Sco              — tail mid
      [237.0,-14.2],  // θ Sco              — tail lower
      [239.5,-13.8],  // Mula YT ★ (Shaula) — stinger tip
      [238.0,-12.0],  // μ Sco (Lesath)     — stinger curl
    ],
    // long chain from forehead through Antares down to stinger
    lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11]],
  },

  // 8: DHANU (Sagittarius) — Teapot asterism
  // Natural span: ~241–272° sidereal
  {
    name: 'Dhanu',
    stars: [
      [241.0,-13.8],  // Mula YT ★ (Shaula) — spout tip (shared with Vrishchika)
      [244.5, -8.5],  // ζ Sgr              — base left
      [246.5,  2.5],  // λ Sgr (Kaus Borealis)— lid
      [248.5, -2.0],  // δ Sgr (Kaus Medis) — body left
      [252.5, -7.0],  // ε Sgr (Kaus Australis)— base right
      [254.0, -6.5],  // Purva Ashadha YT ★ — body right
      [256.0, -5.0],  // φ Sgr              — handle
      [260.0, -4.5],  // τ Sgr              — handle tip
      [270.0, -3.5],  // Uttara Ashadha YT ★— far right (archer's hand)
    ],
    // teapot body + handle; Uttara Ashadha as archer's extended hand
    lines: [[0,3],[3,2],[2,5],[5,4],[4,1],[1,0],[5,6],[6,7],[5,8]],
  },

  // 9: MAKARA (Capricorn) — Sea-goat: arrowhead body tapering to fish tail
  // Natural span: ~268–300° sidereal
  {
    name: 'Makara',
    stars: [
      [270.0, -3.5],  // Uttara Ashadha YT ★— shared, goat nose tip
      [271.5, -7.5],  // α Cap (Algedi)     — close pair
      [272.5, -5.5],  // β Cap (Dabih)      — close pair
      [279.0, -4.0],  // γ Cap              — body
      [280.0, 29.3],  // Shravana YT ★ (Altair)— far north
      [286.5, -2.5],  // δ Cap (Deneb Algedi)— tail
      [291.0, -2.0],  // ε Cap              — tail tip
      [296.0, 31.8],  // Dhanishta YT ★     — far north
    ],
    // arrowhead tip → body → tail; Shravana/Dhanishta as northern stars
    lines: [[0,1],[0,2],[1,2],[2,3],[3,5],[5,6],[3,4]],
  },

  // 10: KUMBHA (Aquarius) — Water-bearer: jar + descending water stream
  // Natural span: ~305–332° sidereal
  {
    name: 'Kumbha',
    stars: [
      [308.0,  1.5],  // ε Aqr (Albali)    — upper figure / head
      [313.0, -4.5],  // β Aqr (Sadalmelik)— left shoulder / jar
      [316.0,  1.0],  // α Aqr (Sadalsuud) — right shoulder
      [320.0, -9.0],  // Shatabhisha YT ★  — stream start / jar spout
      [323.5,-11.5],  // γ Aqr             — stream
      [326.0, 19.4],  // Purva Bhadrapada YT ★ (α Peg)— bright north star
      [327.0,-13.0],  // ζ Aqr             — stream fork
      [329.0,-11.5],  // η Aqr             — stream
      [331.0,-13.0],  // δ Aqr (Skat)      — stream end
    ],
    // Y upper body; Purva Bhadrapada as the brilliant north counterpart
    lines: [[0,1],[0,2],[1,3],[3,4],[4,6],[6,7],[7,8],[2,5]],
  },

  // 11: MEENA (Pisces) — Two fish connected by a cord
  // Natural span: ~330–10° sidereal (wraps past 0°)
  {
    name: 'Meena',
    stars: [
      [332.0,  6.5],  // ω¹ Psc            — western fish body
      [334.5,  9.0],  // ε Psc             — western fish head
      [336.0,  6.0],  // western fish tail
      [342.0,  9.5],  // cord upper
      [347.0, 12.6],  // Uttara Bhadrapada YT ★ (γ Peg)— eastern fish body
      [351.5, 11.0],  // ν Psc             — eastern fish
      [354.5,  9.0],  // ο Psc             — eastern fish tail
      [357.5,  4.5],  // cord to knot
      [359.8, -0.3],  // Revati YT ★ (ζ Psc)— cord knot / junction
      [  3.5,  8.0],  // β Psc             — far eastern fish
    ],
    // western fish; cord; eastern fish chain; cord knot
    lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9]],
  },
]

// ── nakshatra data ────────────────────────────────────────────────────────────

export const NAK_NAMES: string[] = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
]

// Yoga tara (principal star) for each nakshatra.
// Vedic sidereal positions — the coordinate system used throughout this app.
// [name, sidereal_lon, ecl_lat, star_id]
export const NAKSHATRA_YOGA_TARAS: [string, number, number, string][] = [
  ['Ashwini',             8.0,   8.6,  'β Ari'],
  ['Bharani',            20.0,  10.6,  '41 Ari'],
  ['Krittika',           37.5,   4.0,  'η Tau (Pleiades)'],
  ['Rohini',             49.0,  -5.5,  'α Tau (Aldebaran)'],
  ['Mrigashira',         63.0,  -8.9,  'λ Ori'],
  ['Ardra',              67.8,  -8.0,  'α Ori (Betelgeuse)'],
  ['Punarvasu',          93.0,   6.7,  'β Gem (Pollux)'],
  ['Pushya',            106.0,   0.1,  'δ Cnc'],
  ['Ashlesha',          109.0,  -4.5,  'ε Hya'],
  ['Magha',             129.0,   0.5,  'α Leo (Regulus)'],
  ['Purva Phalguni',    151.0,  13.0,  'δ Leo (Zosma)'],
  ['Uttara Phalguni',   155.0,  14.0,  'β Leo (Denebola)'],
  ['Hasta',             170.0, -12.0,  'δ Crv'],
  ['Chitra',            180.0,  -2.1,  'α Vir (Spica)'],
  ['Swati',             199.0,  30.8,  'α Boo (Arcturus)'],
  ['Vishakha',          212.0,   0.5,  'α Lib'],
  ['Anuradha',          224.0,  -1.6,  'δ Sco'],
  ['Jyeshtha',          229.0,  -4.6,  'α Sco (Antares)'],
  ['Mula',              241.0, -13.8,  'λ Sco (Shaula)'],
  ['Purva Ashadha',     254.0,  -6.5,  'δ Sgr'],
  ['Uttara Ashadha',    270.0,  -3.5,  'σ Sgr (Nunki)'],
  ['Shravana',          280.0,  29.3,  'α Aql (Altair)'],
  ['Dhanishta',         296.0,  31.8,  'β Del'],
  ['Shatabhisha',       320.0,  -9.0,  'λ Aqr'],
  ['Purva Bhadrapada',  326.0,  19.4,  'α Peg (Markab)'],
  ['Uttara Bhadrapada', 347.0,  12.6,  'γ Peg (Algenib)'],
  ['Revati',            359.8,  -0.3,  'ζ Psc'],
]
