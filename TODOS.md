# TODOS

## Streamlit POC — DONE ✅
`streamlit/app.py` titled **Vedic Zodiac**. Two tabs: Hindu Zodiac 2D (Plotly), South Indian Rashi Chart.
Deployed at https://vediczodiac.streamlit.app/

---

## React Web App (`web/` + `api/`)

### Phase 2a — Ship the local build

- [x] **Deploy backend** — Flask API live at `https://pritesh2312.pythonanywhere.com`; `/health` and `/positions` endpoints working
- [x] **PythonAnywhere keep-alive** — GitHub Actions workflow (`.github/workflows/keepalive.yml`) pings `/health` daily at 8am UTC (free tier scheduled tasks not available)

- [x] **Set production env** — `web/.env.local` set to `VITE_API_URL=https://pritesh2312.pythonanywhere.com`
- [x] **Deploy frontend** — live at `https://pritesh-shrivastava.github.io/vedicSKY/`

### Phase 2b — Polish before sharing ✅ DONE

- [x] **Mobile layout** — tabs flex:1, South Indian grid minmax(60px), no overflow on 320px phones
- [x] **South Indian chart** — explicit gridColumn/gridRow on all cells, centre 2×2 fixed
- [x] **Loading skeleton** — SVG skeleton mirrors wheel rings + 12 rashi spokes, pulsing animation
- [x] **Rashi/nakshatra label consistency** — rashi labels moved inside ring, grey, mode-gated
- [x] **Devanagari script** — rashis, nakshatras, grahas in both charts; Noto Sans Devanagari font
- [x] **Planetary glyphs** — per-planet sizes (Me smallest → Ju biggest); Ra ☊ / Ke ☋ horseshoe symbols
- [x] **Constellation shapes** — real star positions from Swiss Ephemeris sefstars.txt via export_zodiac_stars.py; yoga taras also ephemeris-based

### Phase 2c — V2 (Stellarium-inspired)
*(Inspired by https://www.youtube.com/watch?v=hBLA4WHQEIw)*

- [ ] **Retrograde/stationary motion chart** — daily longitude bands for 7 grahas showing direct → stationary → retrograde transitions; new `/motion` API endpoint
- [ ] **Browser geolocation** — "Use my location" button via `navigator.geolocation.getCurrentPosition`
- [ ] **Moon phase rendering** — compute illumination fraction from elongation; crescent/gibbous SVG arc inside Moon glyph
- [ ] **Time scrubber** — date/time slider + play button; backend already accepts any datetime
- [ ] **Layout whitespace** — wheel and South Indian chart leave ~35% of viewport empty; improve vertical fill
- [ ] **North Indian Kundali** — diamond grid layout, separate sprint
- [ ] **Birth chart input** — date/time/place picker for natal chart (Phase 3)

---

## iOS App (`iOS/`)

Milestones M1–M5 complete. All unit tests passing on iPhone 14 Simulator.

### Blocker: device deploy needs Xcode 16

MacBook Air 2017 (macOS Monterey, max Xcode 14) cannot deploy to iPhone running iOS 18.
Free personal provisioning profile requires Xcode 16.

- [ ] **Borrow a Mac with Xcode 16** — any Mac running macOS Ventura 13+ works; borrow for ~1 hour
- [ ] **USB deploy to iPhone XR** — plug in iPhone, open `iOS/NavgrahaClock.xcodeproj`, hit Run, accept trust prompt on device. Free provisioning profile expires every 7 days — re-run to renew.
- [ ] **Smoke test on device** — verify all 4 tabs (Rashi Wheel, Celestial Sphere, North Kundali, South Kundali), tap details sheet, time travel, settings

### AR Sky Overlay (v2) — coded, not yet in build

`iOS/NavgrahaClock/AR/VedicSkyviewController.swift` is written but not added to the Xcode build target.

- [ ] **Add AR file to build target** — in Xcode: Navigator → drag `VedicSkyviewController.swift` into the NavgrahaClock target → Build Phases → Compile Sources → confirm it's listed
- [ ] **Add 5th tab for AR** — wire up `VedicSkyviewController` as a `UIViewControllerRepresentable` in `ContentView.swift`
- [ ] **Test AR on physical device** — ARKit world tracking does not work in Simulator; requires the USB deploy above
- [ ] **Validate planet positions in AR** — point phone at sky, confirm Surya/Chandra appear in correct direction relative to horizon
