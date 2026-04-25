# Design: Vedic Zodiac — React Web App (Phase 2)

Updated: 2026-04-25
Repo: jyotish_skyview
Phase 1 (Streamlit): ✅ Complete

---

## Inspiration

**"Blue Moon and the Hindu calendar"** — https://www.youtube.com/watch?v=hBLA4WHQEIw

A Stellarium-based Vedic zodiac visualization that represents the eventual target
for this project. Key things it does that we want to replicate:

| Feature | Phase |
|---|---|
| Circular zodiac wheel with nakshatra/rashi divisions | Phase 2 (now) |
| 0° longitude diameter — a reference line from centre to circumference marking the Aries point | Phase 2 (now) |
| Planets shown as glyphs/symbolic images (Saturn with rings, Jupiter with bands) | V2 |
| Moon shown with its current phase (crescent, gibbous, etc.) | V2 |
| Time animation — fast-forward / scrub through time to watch planets move | V2 |

The Stellarium view is the gold standard for this kind of visualization. Our
React app should feel like a web-native version of what Stellarium renders,
not a charting library output.

**0° line (Aries point):** Add this in Phase 2 alongside the Asc line — a faint
white/grey diameter at 0° sidereal marking the start of Mesha. Gives the wheel
an orientation anchor even before the Asc is known.

---

## What We're Building

A polished, mobile-responsive React SPA titled **Vedic Zodiac** — two views to
start. The bar is: someone opens it and thinks "this is beautiful," not "this is
a chart."

**View 1 — Hindu Zodiac 2D:** Interactive SVG polar wheel with the 27 nakshatra
asterisms plotted at their actual sidereal ecliptic positions, planet dots with
glow effects, animated constellation draw-in on load.

**View 2 — South Indian Rashi Chart:** Clean CSS grid with gold borders,
retrograde markers, live location + time in the centre cell.

North Indian chart and Celestial Sphere come in a later sprint.

---

## Visual Design

### Aesthetic
Deep space. Traditional Indian gold. Not a data dashboard.

| Element | Value |
|---|---|
| Background | `#05060f` (near-black, cooler than pure black) |
| Surface (cards, chart bg) | `#0d0f1e` |
| Gold accent | `#c9a84c` |
| Subtle border | `rgba(201,168,76,0.2)` |
| Text primary | `#e8e0d0` (warm white) |
| Text muted | `#7a7a9a` |

### Typography
- **Cinzel** (Google Fonts) — headers, rashi/nakshatra labels, planet abbreviations. Classical, slightly Sanskrit-adjacent.
- **Inter** — numbers, coordinates, timestamps.

### Starfield background
Procedural SVG `<circle>` dots (~200) scattered behind the wheel at varying opacity (0.1–0.5) and radius (0.4–1.2 px). Fixed, not animated.

### Planet dots
SVG radial gradient + `feGaussianBlur` glow filter per planet colour. Each planet gets a soft halo that matches its traditional colour. On hover the glow intensifies.

### Constellation lines
D3 `stroke-dasharray` / `stroke-dashoffset` animated on mount — lines draw in over ~1.2 s, giving a "sky mapping" feel. Opacity 0.55.

### South Indian grid
CSS Grid, not matplotlib. Cells separated by 1 px `#c9a84c` lines at 25% opacity. Lagna cell gets a full gold border. Retrograde planets rendered `(Me)` in italic.

---

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | React 18 + TypeScript + Vite | Large ecosystem, resume value |
| Zodiac wheel | **D3.js v7** | Full SVG control — glow, animation, precise star placement. Plotly can't match the visual quality. |
| South Indian chart | CSS Grid + inline SVG | No library needed for a 4×4 grid |
| Styling | Tailwind CSS | Utility-first, pairs well with inline SVG |
| Fonts | Google Fonts (Cinzel + Inter) | Free, self-hostable |
| Backend | FastAPI on PythonAnywhere free tier | Genuine free, no credit card, runs pyswisseph |
| Frontend hosting | GitHub Pages via Vite | Free, HTTPS, public repo |

---

## The Nakshatra Star Positioning Problem (and Fix)

### Why the Streamlit version looks wrong

The Streamlit stick figures use a `(frac, lat)` pair — a fractional position
*within* the 30° rashi sector — which is purely symbolic. Krittika (Pleiades)
is hardcoded at some arbitrary fraction inside the Vrishabha sector instead of
at its actual sidereal longitude (~37°).

### How to fix it in D3

The D3 wheel maps angle directly to sidereal ecliptic longitude (0°–360°).
Stars are plotted at their actual sidereal coordinates:

```
angular_position = sidereal_lon (degrees)   → maps to angle on wheel
radial_position  = R_base + ecliptic_lat * scale  → maps to radius
```

`sidereal_lon = tropical_lon − ayanamsha` — a fixed subtraction (~24.13° today).
Stars barely move over human timescales, so this data is a hardcoded constant.

This means:
- Spica (Chitra) lands exactly at 180° — defining the Lahiri ayanamsha anchor
- Antares (Jyeshtha) lands at ~229°
- Pleiades (Krittika) land at ~37°
- Constellation lines cross rashi sector boundaries naturally, as they do in the sky

The stick figures will no longer be confined to their rashi sectors — they'll
span across the wheel at their true positions. That's correct and more
informative.

### Data: `src/constants/stars.ts`

For each nakshatra, store:
- The yoga tara (principal star): sidereal ecliptic lon + lat
- Supporting stars of the asterism: sidereal ecliptic lon + lat
- Line connections (stick figure)

Approximate sidereal ecliptic coordinates for the 27 nakshatra yoga taras
(Lahiri, ~J2000, good to ±1°):

```ts
export const NAKSHATRA_YOGA_TARAS = [
  // [name, sidereal_lon, ecl_lat, star_id]
  ["Ashwini",          8.0,   8.6,  "β Ari"],
  ["Bharani",         20.0,  10.6,  "41 Ari"],
  ["Krittika",        37.5,   4.0,  "η Tau (Pleiades)"],
  ["Rohini",          49.0,  -5.5,  "α Tau (Aldebaran)"],
  ["Mrigashira",      63.0,  -8.9,  "λ Ori"],
  ["Ardra",           67.8,  -8.0,  "α Ori (Betelgeuse)"],
  ["Punarvasu",       93.0,   6.7,  "β Gem (Pollux)"],
  ["Pushya",         106.0,   0.1,  "δ Cnc"],
  ["Ashlesha",       109.0,  -4.5,  "ε Hya"],
  ["Magha",          129.0,   0.5,  "α Leo (Regulus)"],
  ["Purva Phalguni", 151.0,  13.0,  "δ Leo (Zosma)"],
  ["Uttara Phalguni",155.0,  14.0,  "β Leo (Denebola)"],
  ["Hasta",          170.0, -12.0,  "δ Crv"],
  ["Chitra",         180.0,  -2.1,  "α Vir (Spica)"],   // Lahiri anchor
  ["Swati",          199.0,  30.8,  "α Boo (Arcturus)"],
  ["Vishakha",       212.0,   0.5,  "α Lib (Zubenelgenubi)"],
  ["Anuradha",       224.0,  -1.6,  "δ Sco"],
  ["Jyeshtha",       229.0,  -4.6,  "α Sco (Antares)"],
  ["Mula",           241.0, -13.8,  "λ Sco (Shaula)"],
  ["Purva Ashadha",  254.0,  -6.5,  "δ Sgr"],
  ["Uttara Ashadha", 270.0,  -3.5,  "σ Sgr (Nunki)"],
  ["Shravana",       280.0,  29.3,  "α Aql (Altair)"],
  ["Dhanishta",      296.0,  31.8,  "β Del"],
  ["Shatabhisha",    320.0,  -9.0,  "λ Aqr"],
  ["Purva Bhadrapada",326.0, 19.4,  "α Peg (Markab)"],
  ["Uttara Bhadrapada",347.0, 12.6, "γ Peg (Algenib)"],
  ["Revati",         359.8,  -0.3,  "ζ Psc"],
]
```

Full asterism data (multi-star patterns + line connections) goes in the same
file. Build it incrementally — yoga taras alone already look good; add the
supporting stars nakshatra by nakshatra.

---

## Backend API

One stateless endpoint. Called on load and every 60 s.

```
GET /positions?lat=23.1765&lon=75.7885&alt=490&tz=Asia%2FKolkata
```

Response:
```json
{
  "timestamp": "2026-04-25T10:30:00+05:30",
  "ayanamsha": 24.1312,
  "lagna": { "sidereal_lon": 123.45, "rashi_idx": 4 },
  "grahas": [
    {
      "name": "Surya", "abbr": "Su",
      "sidereal_lon": 11.234,
      "rashi_en": "Mesha", "rashi_idx": 0,
      "nakshatra_en": "Ashwini", "pada": 3,
      "is_retrograde": false
    }
  ]
}
```

`is_retrograde`: longitudinal speed < 0 from `swe.calc_ut` with `FLG_SPEED`.
Rahu and Ketu always `false`.

Backend layout:
```
api/
├── main.py          ← FastAPI, single /positions route, CORS allow *
└── requirements.txt ← fastapi uvicorn pyswisseph pandas
```

---

## Frontend Layout

```
web/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── src/
    ├── main.tsx
    ├── App.tsx                       ← tab shell + location state
    ├── types.ts                      ← GrahaPosition, Lagna, ApiResponse
    ├── hooks/
    │   └── usePositions.ts           ← fetch + 60-s interval
    ├── constants/
    │   ├── colors.ts                 ← PLANET_COLOR, RASHI_COLORS, palette
    │   ├── rashis.ts                 ← RASHI_SHORT, RASHI_OUTLINES (12 rashis)
    │   └── stars.ts                  ← NAKSHATRA_YOGA_TARAS, asterism lines
    └── components/
        ├── HinduZodiac2D/
        │   ├── index.tsx             ← D3 wheel wrapper
        │   ├── useD3Wheel.ts         ← D3 imperative logic in a hook
        │   ├── Starfield.tsx         ← procedural background dots
        │   ├── NakshatraLayer.tsx    ← yoga taras + asterism lines
        │   ├── RashiLayer.tsx        ← 12 sector dividers + labels
        │   └── PlanetLayer.tsx       ← 9 planet dots + Asc line
        └── SouthIndianRashi/
            ├── index.tsx             ← CSS grid shell
            └── GridCell.tsx          ← single cell (rect + label + planets)
```

---

## D3 Wheel — How It Works

D3 owns the SVG. React owns the state (planet positions, hover selection).
Use a `useD3Wheel` hook with a `useEffect` that runs D3 imperatively on a
`ref` — the standard React + D3 integration pattern.

### Coordinate mapping

```ts
// Derive from container — makes the wheel responsive
// Use ResizeObserver in useD3Wheel.ts to update when container resizes
const svgSize   = Math.min(containerWidth, containerHeight);
const RADIUS    = svgSize / 2 - 20;   // outer edge of zodiac ring
const R_INNER   = RADIUS * 0.59;      // inner edge (planets live inside)
const R_ECLIPTIC = RADIUS * 0.82;     // reference circle for ecliptic stars

// ECL_LAT_SCALE = 1.5 (NOT 3.5 — at 3.5 high-latitude stars like Arcturus
// and Altair render outside the wheel. At 1.5 all 27 yoga taras stay inside.)
const ECL_LAT_SCALE = 1.5;

// Sidereal lon → SVG angle (Aries at top, clockwise)
// lonToAngle(0°) = 270° → cos=0, sin=-1 → TOP of SVG ✓
const lonToAngle = (lon: number) => (lon - 90 + 360) % 360;

// Star (lon, lat) → SVG (x, y)
const starToXY = (lon: number, lat: number) => {
  const angle = lonToAngle(lon) * (Math.PI / 180);
  const r = R_ECLIPTIC + lat * ECL_LAT_SCALE;
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
};
```

> **Why ECL_LAT_SCALE = 1.5, not 3.5:** Three nakshatra yoga taras are far north
> of the ecliptic — Arcturus (Swati, +30.8°), Altair (Shravana, +29.3°), β Del
> (Dhanishta, +31.8°). At scale=3.5 they render at r≈388px, outside the 340px
> ring. At scale=1.5 the worst case is Dhanishta at r≈328px — safely inside.

### Layers (drawn in order, back to front)

1. **Starfield** — static `<circle>` elements, seeded randomly
2. **Nakshatra ring** — 27 thin divider lines at 13.33° intervals, outer band label per nakshatra
3. **Rashi ring** — 12 sector dividers at 30° intervals + rashi labels
4. **Asterism layer** — `<line>` elements connecting nakshatra stars at actual sidereal positions, animated `stroke-dashoffset` draw-in on mount
5. **Yoga tara dots** — small `<circle>` per nakshatra principal star, `feGaussianBlur` glow
6. **Reference lines** — two diameters drawn centre-to-circumference:
   - **0° Aries line** — faint white/grey, always visible, marks the sidereal zero point
   - **Ascendant line** — gold/pink, labelled "Asc", marks the rising degree
7. **Planet layer** — larger `<circle>` per graha at r=R_INNER with radial gradient + glow; hover tooltip

### Hover / tooltip
D3 `mouseover` on planet and star dots → React state update → a positioned
`<div>` tooltip outside the SVG (not a D3-managed element).

---

## South Indian Rashi Chart — How It Works

Pure CSS Grid, no D3 needed.

```tsx
// Fixed sign positions — same as Streamlit SOUTH_GRID
const GRID: Record<string, number> = {
  "0,3": 11, "1,3": 0,  "2,3": 1,  "3,3": 2,
  "0,2": 10,                        "3,2": 3,
  "0,1": 9,                         "3,1": 4,
  "0,0": 8,  "1,0": 7,  "2,0": 6,  "3,0": 5,
};
```

Each outer cell: `<div>` with gold border, rashi short label top-right,
planet abbreviations centred. Lagna cell: brighter gold border.
Centre 2×2: observer coordinates, date, time.
Retrograde planets: `(Me)` in italic gold.

---

## UI States (required — don't skip these)

| State | What to show |
|---|---|
| Loading (API in-flight on first load) | Skeleton: dark SVG with faint grey ring outlines, no planets. Cinzel text "Calculating positions..." centred. |
| Error (API unreachable / 500) | Same skeleton + gold text "Could not reach server. Retrying in 60s." |
| Stale (tab was backgrounded, interval may have throttled) | Add `visibilitychange` listener → trigger immediate fetch on tab focus |
| Retrograde planet (South Indian chart) | `(Me)` in italic gold — already in Streamlit, port directly |

The loading skeleton matters. A blank dark screen on first load looks broken.

## Location Input UI

Not specified in earlier drafts — decided here:

**Mobile:** Full-width collapsible panel below the tab bar. Tap a gear icon to expand.
**Desktop:** Narrow left sidebar, always visible.

Fields: Latitude (number), Longitude (number), Altitude m (number), Timezone (text, e.g. `Asia/Kolkata`). Default: Ujjain. An "Use my location" button calls `navigator.geolocation` — this is a 2-hour add-on, worth doing in Phase 2.

## Backend Caching (mandatory for PythonAnywhere free tier)

PythonAnywhere free tier has ~100 CPU-seconds/day. Each pyswisseph calc uses ~0.05–0.1s CPU. Without caching, 20 concurrent users polling every 60s exhausts the daily limit in under 1 hour.

```python
# In main.py — cache per (lat, lon, alt, minute_bucket)
from functools import lru_cache
from datetime import datetime

@lru_cache(maxsize=128)
def _cached_positions(lat, lon, alt, tz, minute_bucket):
    # minute_bucket = datetime.now(tz).replace(second=0, microsecond=0)
    return calculate_graha_positions_for_local_dt(...)
```

## `usePositions` — Stale Fetch Fix

```ts
useEffect(() => {
  let cancelled = false;
  const doFetch = () =>
    fetchPositions(lat, lon, alt, tz).then(d => { if (!cancelled) setData(d); });
  doFetch();
  const id = setInterval(doFetch, 60_000);
  // Re-fetch immediately when tab comes back into focus
  const onVisible = () => { if (document.visibilityState === 'visible') doFetch(); };
  document.addEventListener('visibilitychange', onVisible);
  return () => { cancelled = true; clearInterval(id); document.removeEventListener('visibilitychange', onVisible); };
}, [lat, lon, alt, tz]);
```

## D3 Wheel Re-render Pattern

Clear before each redraw to prevent double-rendering on 60s poll:

```ts
useEffect(() => {
  const svg = d3.select(svgRef.current);
  svg.selectAll('*').remove();  // clear before redraw
  // ... draw layers
}, [data, svgSize]);  // re-run when data or container size changes
```

## Local Development Setup

Two terminals:

```bash
# Terminal 1 — backend
cd api
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Terminal 2 — frontend
cd web
npm install
echo "VITE_API_URL=http://localhost:8000" > .env.local
npm run dev   # runs at http://localhost:5173
```

Production `.env` (committed, safe — no secrets):
```
VITE_API_URL=https://yourusername.pythonanywhere.com
```

`vite.config.ts` base path:
- Local dev: `base: "/"` (default, leave unset)
- GitHub Pages build: `base: "/jyotish_skyview/"` — set via env or build script

## Build Order

1. **Backend** — FastAPI `/positions` endpoint, deploy to PythonAnywhere, verify with `curl`
2. **React scaffold** — Vite + React + TypeScript + Tailwind, "Hello World" on localhost
3. **South Indian Rashi** — CSS grid, mock JSON data, no D3 yet
4. **Wire up API** — `usePositions` hook, real data flowing into both components
5. **D3 wheel skeleton** — sector dividers, rashi labels, Asc line
6. **Nakshatra layer** — yoga tara dots at real sidereal longitudes, then asterism lines
7. **Planet layer** — graha dots with glow, hover tooltips
8. **Polish** — starfield, draw-in animation, Cinzel font, responsive sizing
9. **Deploy** — `vite build` → GitHub Pages

---

## Hosting (0-cost)

**Backend — PythonAnywhere free tier:**
1. Upload `api/`, `pip install -r requirements.txt`
2. Web App → WSGI → FastAPI app
3. URL: `https://yourusername.pythonanywhere.com/positions`
4. Set `base_url` in React `.env`

**Frontend — GitHub Pages:**
```bash
cd web && npm run build && npm run deploy  # gh-pages -d dist
```
Set `base: "/jyotish_skyview/"` in `vite.config.ts`.

---

## What Comes Later

### Phase 2 follow-on (same React app, later sprints)
| Feature | Notes |
|---|---|
| North Indian Kundali | Diamond grid — complex SVG layout |
| Celestial Sphere | Three.js or WebGL — heavy, own sprint |
| Browser geolocation | `navigator.geolocation` → auto-fill lat/lon on load |

### V2 — Stellarium-inspired upgrades
*(Inspired by https://www.youtube.com/watch?v=hBLA4WHQEIw)*

| Feature | Notes |
|---|---|
| Planetary glyphs / symbolic images | SVG sprite per graha — Saturn with rings, Jupiter with bands, Sun as disc. Replace plain dots. |
| Moon phase rendering | Compute illumination fraction from elongation; render crescent/gibbous shape as SVG arc inside the Moon dot |
| Time scrubber / animation | Slider or play button; poll the API with a custom datetime param; D3 transitions animate planet positions between frames |
| Birth chart (natal) input | Date/time/place picker — Phase 3 |

---

<!-- AUTONOMOUS DECISION LOG -->
## Decision Audit Trail

| # | Phase | Decision | Classification | Principle | Rationale |
|---|-------|----------|---------------|-----------|-----------|
| 1 | CEO | Accept all premises | Mechanical | P6 | All premises are valid; user confirmed the core problem |
| 2 | CEO | Mode: SELECTIVE EXPANSION | Mechanical | P1 | 2-view scope is right-sized; no expansions needed |
| 3 | CEO | Fix ECL_LAT_SCALE 3.5 → 1.5 | Mechanical | P1 | At 3.5 three yoga taras render outside the wheel |
| 4 | CEO | Flag mobile sizing gap | Mechanical | P1 | RADIUS=340 hardcoded won't fit a phone screen |
| 5 | CEO | Flag PythonAnywhere CPU caching | Mechanical | P1 | Free tier CPU limit hit quickly without caching |
| 6 | CEO | Keep PythonAnywhere | Mechanical | P3 | Zero-cost constraint is real; right call |
| 7 | CEO | Keep 2-view scope | Mechanical | P6 | Resist expansion; scope is correct |
| 8 | Design | Loading skeleton is mandatory | Mechanical | P1 | Blank screen on API delay kills first impression |
| 9 | Design | Error state is mandatory | Mechanical | P1 | API failure = blank screen without it |
| 10 | Design | Make SVG sizing responsive | Mechanical | P1 | Hardcoded pixels break on mobile |
| 11 | Design | Specify location input UI | Mechanical | P5 | Missing from plan; decided: sidebar desktop / collapsible mobile |
| 12 | Eng | Add stale-fetch cancelled flag | Mechanical | P5 | Race condition on location change |
| 13 | Eng | Add SVG clear before redraw | Mechanical | P5 | D3 double-renders without this |
| 14 | Eng | Add visibilitychange listener | Mechanical | P5 | Browser throttles intervals on background tabs |
| 15 | DX | Add local dev setup section | Mechanical | P1 | New React devs need two-terminal instructions |
| 16 | DX | Add .env.local / VITE_API_URL | Mechanical | P1 | Required to hit local backend during dev |

## GSTACK REVIEW REPORT

| Review | Status | Issues | Critical |
|--------|--------|--------|---------|
| CEO Review | ✓ clean | 4 found, all auto-fixed | 0 |
| Design Review | ✓ clean | 4 found, all auto-fixed | 0 |
| Eng Review | ✓ clean | 5 found, all auto-fixed | 0 |
| DX Review | ✓ clean | 3 found, all auto-fixed | 0 |
