# Design: Vedic Zodiac — React Web App (Phase 2)

Updated: 2026-05-14
Repo: vedicSKY
Phase 1 (Streamlit): ✅ Complete
Phase 2 (React web app): ✅ Implemented and polished

---

## What this phase is

A polished, mobile-responsive React SPA titled **Vedic Zodiac**. The current web app includes:

- **Hindu Zodiac 2D** — D3 SVG wheel with nakshatra / rashi divisions, yoga taras,
  constellation figures, planet glyphs, lagna line, and Moon phase rendering
- **South Indian Rashi Chart** — CSS grid with gold borders, Devanagari labels,
  retrograde markers, and timezone-aware date/time / tithi display
- **Motion bands** — daily direct / retrograde strip for the 7 classical planets
- **Location controls** — latitude, longitude, altitude, timezone, and geolocation

North Indian chart and Celestial Sphere remain later-sprint items.

---

## Visual direction

- Background: deep space `#05060f`
- Surface: `#0d0f1e`
- Gold accent: `#c9a84c`
- Text: warm white and muted blue-grey
- Fonts: **Cinzel** for labels / headers, **Inter** for numeric UI

The intent is traditional and atmospheric, not dashboard-like.

---

## Stack

- **Framework:** React 18 + TypeScript + Vite
- **Zodiac wheel:** D3.js v7 for full SVG control
- **South Indian chart:** CSS Grid + inline SVG
- **Styling:** Tailwind CSS is present, but most of the visual UI uses inline styles
- **Backend:** separate Python service deployed externally; the repo only contains the frontend
- **Hosting:** GitHub Pages via Vite

---

## Current frontend structure

```text
web/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── src/
    ├── main.tsx
    ├── App.tsx                       ← tab shell + location state + time scrubber
    ├── types.ts                      ← GrahaPosition, Lagna, ApiResponse, MotionResponse
    ├── hooks/
    │   ├── usePositions.ts           ← fetch + 60 s interval + visibility refresh
    │   └── useMotion.ts              ← motion-band fetch
    ├── constants/
    │   ├── colors.ts                 ← palette and planet colours
    │   ├── rashis.ts                 ← rashi labels and South Indian grid
    │   ├── grahas.ts                 ← Devanagari planet labels
    │   └── stars.ts                  ← yoga taras and constellation data
    └── components/
        ├── HinduZodiac2D/
        │   ├── index.tsx             ← D3 wheel wrapper
        │   ├── useD3Wheel.ts         ← resize-aware render hook
        │   ├── wheelRenderer.ts      ← wheel composition helpers
        │   └── planetRenderers.ts    ← planet glyph rendering
        └── SouthIndianRashi/
            ├── index.tsx             ← CSS grid shell
            └── GridCell.tsx          ← single cell (label + planets)
```

---

## Data flow

1. User enters or updates location / timezone.
2. `usePositions` requests `/positions` for the current sky snapshot.
3. `useMotion` requests `/motion` for a short daily motion strip.
4. `HinduZodiac2D` renders the wheel from the `/positions` response.
5. `SouthIndianRashi` renders the chart grid from the same response.
6. `MotionPanel` renders the motion bands from `/motion`.

The frontend keeps the API surface small and stateless.

---

## Important implementation notes

### D3 wheel
- SVG is cleared before each redraw.
- ResizeObserver drives responsive sizing.
- Wheel drawing is decomposed into small helper functions in `wheelRenderer.ts` and `planetRenderers.ts`.
- Hover state is managed by React, not directly inside D3.

### Moon phase rendering
- The Moon glyph is rendered with a simple elongation-based phase mask.
- It is intentionally lightweight and good enough for visual recognition.

### Timezone handling
- The South Indian chart and motion panel both format timestamps using the selected observer timezone.
- This avoids browser-local time drift in users outside the target location.

### Motion bands
- Only the 7 classical planets are shown.
- Rahu and Ketu are intentionally excluded from the motion strip.

---

## Status of previously pending items

Completed in the current codebase:
- Moon phase rendering
- Time scrubber / live time control
- Motion bands panel
- Refactor of the D3 wheel into smaller render helpers
- Location / geolocation controls

Still open or future work:
- North Indian kundali view
- Birth chart input for natal charts
- AR sky overlay on iOS device testing
- Backend quota strategy if the motion endpoint is expanded further

---

## Local development

Frontend:

```bash
cd web
npm install
cp .env.example .env.local
npm run dev
```

The frontend expects `VITE_API_URL` to point at a running backend service.
The included `.env.example` defaults to `http://localhost:8000`.

---

## Verification

Recommended checks for the web app:

```bash
cd web
npm run build
```

For Python reference validation:

```bash
python3 -m pytest scripts/test_graha_positions.py -v
```
