# Vedic Zodiac — React Web App

Phase 2 of the vedicSKY project: a mobile-responsive React SPA with a polished
**D3.js zodiac wheel**, a **South Indian Rashi chart**, and a **motion bands**
panel for the 7 classical planets.

## Stack
- React 18 + TypeScript + Vite
- D3.js for the SVG zodiac wheel
- CSS Grid / inline SVG for the South Indian chart
- Backend API: separate deployment providing `/positions` and `/motion`

## Local development

```bash
cd web
npm install
cp .env.example .env.local
npm run dev
```

The frontend expects `VITE_API_URL` to point to a running backend service.
The included `.env.example` defaults to `http://localhost:8000`.

## Current UI
- **Hindu Zodiac 2D** — D3 wheel with nakshatra / rashi boundaries, yoga taras,
  constellation figures, planet glyphs, lagna line, and Moon phase rendering
- **South Indian Rashi** — fixed 4×4 grid with Devanagari labels, retrograde
  markers, and timezone-aware date/time display
- **Motion bands** — daily direct / retrograde strip for the 7 classical planets
- **Location controls** — latitude, longitude, altitude, timezone, and geolocation

## Build

```bash
npm run build
```
