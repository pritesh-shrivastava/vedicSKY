# Vedic Skyview

Real-time Vedic astrology app showing the 9 Navagraha positions and Lagna using Swiss Ephemeris calculations (Lahiri ayanamsha, sidereal, topocentric).

**Streamlit demo:** https://vediczodiac.streamlit.app/

---

## Platforms

| Folder | Platform | Status |
|---|---|---|
| `streamlit/` | Web — Streamlit POC | ✅ Complete (titled "Vedic Zodiac") |
| `web/` | Web — React SPA | ✅ Live at [pritesh-shrivastava.github.io/vedicSKY](https://pritesh-shrivastava.github.io/vedicSKY/) |
| `iOS/` | Native iOS (SwiftUI) | ✅ M1–M5 complete, blocked on Xcode 14/iOS 18 |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     User (Browser / Mobile)                      │
│                                                                   │
│   ┌───────────────────────────────────────────────────────────┐  │
│   │          React SPA  ·  hosted on GitHub Pages              │  │
│   │                                                             │  │
│   │   HinduZodiac2D         SouthIndianRashi                   │  │
│   │   (D3.js SVG wheel)     (CSS Grid chart)                   │  │
│   │   MotionPanel           Location + time controls            │  │
│   │                                                             │  │
│   │   usePositions.ts  ──── GET /positions?lat&lon&tz ──────►  │  │
│   │   useMotion.ts     ───── GET /motion?start&days&step ───►  │  │
│   │   (polls every 60s) ◄── JSON (grahas + lagna + motion) ─── │  │
│   └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                     │ HTTPS
                                     ▼
              ┌──────────────────────────────────────┐
              │   Flask  ·  PythonAnywhere free      │
              │   api/main.py                         │
              │                                       │
              │   @lru_cache (minute-bucket per loc)  │
              └────────────────┬─────────────────────┘
                               │ function call
                               ▼
              ┌──────────────────────────────────────┐
              │   Calculation Engine (Python)         │
              │   scripts/graha_positions_reference.py│
              │                                       │
              │   • Lahiri ayanamsha                  │
              │   • Topocentric (SEFLG_TOPOCTR)        │
              │   • Rahu = SE_MEAN_NODE                │
              │   • Ketu = Rahu + 180°                │
              └────────────────┬─────────────────────┘
                               │
                               ▼
              ┌──────────────────────────────────────┐
              │   Swiss Ephemeris  (pyswisseph)       │
              │   C library, bundled in Python pkg    │
              └──────────────────────────────────────┘


Streamlit POC (separate, same calculation engine):

              ┌──────────────────────────────────────┐
              │   Streamlit app  ·  Community Cloud   │
              │   streamlit/app.py                    │
              │                                       │
              │   Tab 1: Hindu Zodiac 2D (Plotly)     │
              │   Tab 2: South Indian Rashi Chart      │
              └──────────────────────────────────────┘


iOS app (fully on-device, no network call for positions):

              ┌──────────────────────────────────────┐
              │   SwiftUI app  ·  iPhone (local only) │
              │   iOS/NavgrahaClock.xcodeproj          │
              │                                       │
              │   EphemerisEngine.swift               │
              │   └── libswe  (C sources compiled in) │
              │       same math, same ayanamsha       │
              └──────────────────────────────────────┘
```

---

## Tech decisions explained

### What is Vite?

Vite (French for "fast") is the build tool and development server for the React app. Think of it as the web equivalent of `flask run` + package manager combined:

| Vite command | Python equivalent |
|---|---|
| `npm run dev` | `flask run` — starts a local server with instant hot-reload |
| `npm run build` | Compiling + packaging your app into optimised files for deployment |
| `npm install` | `pip install -r requirements.txt` |

Vite handles converting TypeScript → JavaScript, bundling CSS, and optimising assets for production. You never interact with it directly — it just runs in the background when you type `npm run dev`.

### TypeScript vs JavaScript

TypeScript is JavaScript with optional type annotations — the same idea as Python type hints, but enforced at build time (not just for IDE hints):

**Why TypeScript?**
- Catches bugs before you run the code (a function expecting a `number` won't silently accept `"23.4"`)
- Better autocomplete in VS Code — it knows the shape of every object
- Microsoft created TypeScript in 2012 (Anders Hejlsberg, who also created C#). It's now the default at most large-scale JS projects.
- All TypeScript compiles to plain JavaScript — browsers only run JS. TypeScript is purely a development tool.

In this project: `src/types.ts` defines `GrahaPosition`, `ApiResponse`, `Location` — when you call `data.grahas[0].sidereal_lon`, TypeScript knows it's a `number` and will error at build time if you try to treat it as a string.


## Run locally

### Frontend (React)

```bash
cd web
npm install
cp .env.example .env.local     # sets VITE_API_URL=http://localhost:8000
npm run dev
# → http://localhost:5173
```

### Backend API

The calculation backend is deployed separately and is not committed in this repository.
If you are running a local backend, point `VITE_API_URL` at it (for example,
`http://localhost:8000`) and ensure it exposes `/positions` and `/motion`.

The current frontend also includes:
- location controls for latitude / longitude / altitude / timezone
- live polling every 60 s
- motion bands for the 7 classical planets

### Streamlit POC

```bash
pip3 install streamlit streamlit-autorefresh pyswisseph pandas matplotlib plotly
streamlit run streamlit/app.py
# → http://localhost:8501
```

### Agentic Telegram Jobs

The repo includes Hermes-friendly commands under `agentic/` for scheduled
Telegram delivery:

```bash
uv run --with pyswisseph --with pandas python agentic/daily_panchang.py
uv run --with pyswisseph --with pandas python agentic/daily_ephemeris.py
```

Current VPS schedules:
- `vedicsky-daily-panchang` posts the daily panchang at `06:00` IST.
- `vedicsky-daily-ephemeris` posts the 9-graha ephemeris table at `09:00` IST.

Both deliver to the Telegram DM topic `Jyotish` at
`telegram:5727496535:10101`. See `agentic/README.md` for command options,
location overrides, and the full Hermes cron setup.

---

## Calculation ground truth

`scripts/graha_positions_reference.py` is the canonical calculation engine.
All platforms (Python backend, Streamlit, iOS Swift) must match it to within **0.0001°** for identical inputs.
Never change its computation logic — it is the test oracle.

```bash
# Run Python reference tests
python3 -m pytest scripts/test_graha_positions.py -v

# Run iOS tests (macOS + Xcode 14+)
xcodebuild test -project "iOS/NavgrahaClock.xcodeproj" \
  -scheme "NavgrahaClock" -destination "platform=iOS Simulator,name=iPhone 14"
```

---

## Design doc

See `DESIGN.md` for the full React web app spec: visual design system, D3 wheel architecture, nakshatra star data, API contract, build order, and V2 roadmap.
