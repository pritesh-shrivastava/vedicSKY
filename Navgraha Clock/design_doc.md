# Navgraha Clock — Engineering Design Document

**Version:** 1.0  
**Status:** In progress — personal tool, no distribution planned

---

## 1. Overview

A native iOS app showing the 9 Navagraha positions and Lagna in four complementary visualisations driven by a single shared data model. All calculations are on-device, offline, using Swiss Ephemeris with Lahiri ayanamsha.

---

## 2. Architecture

```
EphemerisEngine  ──►  NavgrahaViewModel  ──►  RashiWheelView
(libswe C)             (ObservableObject)  ──►  CelestialSphereView
                                           ──►  NorthIndianKundaliView
LocationHeadingManager ──► (lat/lon/alt)   ──►  SouthIndianKundaliView
```

**Update loop:** 60-second `Timer` triggers `NavgrahaViewModel.refresh()`, which recomputes all 9 graha positions + Lagna and publishes to all views simultaneously.

---

## 3. Data Model

### GrahaPoint
```swift
struct GrahaPoint {
    let name: String        // "Surya", "Chandra", … "Ketu"
    let siderealLon: Double // degrees, Lahiri sidereal, 0–360
}
```

### NavgrahaViewModel (published)
```swift
@Published var grahaPoints: [GrahaPoint]   // 9 grahas
@Published var lagnaSidereal: Double       // Ascendant sidereal longitude
@Published var locationLabel: String       // display string
@Published var lastUpdate: Date
```

### Fallback location
Ujjain (23.1765°N, 75.7885°E) — used when location permission is denied. Ujjain is the traditional Vedic prime meridian.

---

## 4. Ephemeris Engine

Identical to Vedic Skyview. Key decisions:
- `SE_SIDM_LAHIRI` ayanamsha
- `SE_MEAN_NODE` for Rahu (smoother for Jyotish)
- Ketu = `(Rahu + 180°) % 360` (not a SWE body)
- `SEFLG_TOPOCTR` for topocentric positions
- `swe_set_topo(lon, lat, alt)` called before `swe_calc_ut`
- Ephemeris data: `sepl_18.se1`, `semo_18.se1`, `sefstars.txt`, `seorbel.txt` (1900–2100 range, ~1.9 MB)

---

## 5. Lagna (Ascendant)

Computed via `swe_houses()` using the Placidus system:
```swift
swe_houses(jd, lat, lon, Int32(UInt8(ascii: "P")), &cusps, &ascmc)
lagnaSidereal = (ascmc[0] - ayanamsha + 360) % 360
```

`ascmc[0]` = Ascendant tropical longitude. Subtract Lahiri ayanamsha to get sidereal.

---

## 6. Views

### 6.1 Rashi Wheel (Tab 1)

**Projection:** Azimuthal — sidereal longitude maps directly to screen angle.
```
screenAngle = -lon.toRadians   // 0° Mesha = 3-o'clock, counter-clockwise
x = center.x + r × cos(angle)
y = center.y + r × sin(angle)
```

**Layers (back to front):**
1. 27 Nakshatra sector lines (dimmer green, every 13.333°)
2. 12 Rashi sector lines (brighter green, every 30°)
3. Ecliptic circle (bold green)
4. Constellation stick figures (red, hardcoded sidereal lon/lat from `ConstellationData.swift`)
5. Rashi labels + emoji (cyan, outside circle)
6. Nakshatra labels (blue-gray, inside at 74% radius, rotated tangentially)
7. Lagna marker — gold △ on ecliptic, "Lagna" label
8. 9 Graha dots (colored) + name labels on ecliptic circle
9. Status bar

### 6.2 Celestial Sphere (Tab 2)

**Projection:** Orthographic — the celestial sphere viewed from outside.
```swift
x3 =  cos(dec) × sin(ra)
y3 = -sin(dec)
z3 =  cos(dec) × cos(ra)
// Backface culling: z3 < 0 → hidden
screenX = center.x + x3 × radius
screenY = center.y + y3 × radius
```

**Coordinate chain:** sidereal ecliptic (λ, β=0) → `eclipticToEquatorial(ε=23.44°)` → (RA, Dec) → orthographic projection

**Features:**
- Blue equatorial RA/Dec grid (Dec circles at ±30°, ±60°, 0°; RA lines every 30°)
- Green ecliptic arc + degree markers every 30°
- White lunar orbital arc (parametric, inclined 5.145° at Rahu's longitude)
- Red ☊ Rahu / ☋ Ketu tick marks at ecliptic–lunar-orbit intersections
- Green nakshatra names along ecliptic (β=4° offset)
- Graha dots at their equatorial positions (Surya with glow)
- Dhruva (NCP) labeled at Dec=+90°
- **Draggable:** horizontal drag rotates the sphere (RA offset)

### 6.3 North Indian Kundali (Tab 3)

**Layout:** House-fixed diamond. House 1 always at top-center.
- 12 cells: 4 corner triangles (houses 1, 4, 7, 10) + 8 trapezoids
- Rashi of house N = `(lagnaRashi + N - 1) % 12`
- Grahas shown as two-letter abbreviations in their house cell
- Lagna house number in gold

### 6.4 South Indian Kundali (Tab 4)

**Layout:** Sign-fixed 4×4 grid. Rashis always in the same positions.
```
Row 0: Mina  | Mesha | Vrish | Mithu
Row 1: Kumbh |  (center 2×2)  | Karka
Row 2: Makar |  (center 2×2)  | Simha
Row 3: Dhanu | Vrish | Tula  | Kanya
```
- House number = `(rashiIndex - lagnaRashi + 12) % 12 + 1`
- Lagna cell highlighted in gold

---

## 7. Constellation Data

`ConstellationData.swift` hardcodes ~5–8 key stars per zodiac constellation with sidereal ecliptic coordinates (Lahiri, J2000.0 tropical − 23.85°). Accuracy ±1–2°. Connection lines form recognisable stick figures.

---

## 8. Milestones

| Milestone | Deliverables | Status |
|---|---|---|
| M1 — Core | EphemerisEngine, bridging header, libswe integration, Lagna | complete |
| M2 — Rashi Wheel | Circular ecliptic wheel with all layers | complete |
| M3 — Celestial Sphere | Orthographic globe, equatorial grid, ecliptic, lunar orbit | complete |
| M4 — Kundali Charts | North + South Indian layouts | complete |
| M5 — Polish | Graha detail tap sheet, time-travel scrubber, settings | pending |

---

## 9. Color Palette

| Element | Color |
|---|---|
| Background | Black |
| Equatorial grid | `Color(r:0.15, g:0.2, b:0.6)` blue |
| Ecliptic / Rashi lines | `Color(r:0.2, g:0.6, b:0.2)` green |
| Nakshatra lines | `Color(r:0.2, g:0.4, b:0.2)` dimmer green |
| Constellation stick figures | `Color(r:0.8, g:0.1, b:0.1)` red |
| Rashi labels | `Color(r:0.3, g:0.8, b:0.8)` cyan |
| Graha labels | `Color(r:0.5, g:0.5, b:0.7)` blue-gray |
| Lagna / gold accents | `Color(r:1.0, g:0.8, b:0.0)` gold |
| Rahu/Ketu node markers | Red |
| Lunar orbit arc | White (75% opacity) |

---

## 10. Open Questions / Future

- **Time travel:** Scrubber to set custom date/time for historical/future charts
- **Tap-to-identify:** Bottom sheet showing graha details (Rashi, Nakshatra, Pada, degrees) on tap
- **Birth chart mode:** Enter birth date + location → freeze positions to that moment
- **Retrograde indicator:** Badge grahas with ℞ when SWE velocity < 0
- **Vakri (retrograde) in Kundali:** Mark retrograde grahas with (R) in house cells
