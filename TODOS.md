# TODOS

## Streamlit POC — DONE ✅
`streamlit/app.py` titled **Vedic Zodiac**. Two tabs: Hindu Zodiac 2D (Plotly), South Indian Rashi Chart.
Deployed at https://vediczodiac.streamlit.app/

---

## React Web App (`web/` + `api/`)

### Phase 2a — Ship the local build

- [ ] **Deploy backend** — upload `api/` to PythonAnywhere free tier, configure WSGI, verify `curl https://yourusername.pythonanywhere.com/positions` returns JSON
- [ ] **Set production env** — create `web/.env` with `VITE_API_URL=https://yourusername.pythonanywhere.com`
- [ ] **Deploy frontend** — `npm run build && npm run deploy` → live at `https://pritesh-shrivastava.github.io/vedic_skyview/`
- [ ] **PythonAnywhere keep-alive** — set up a scheduled task (free tier provides one) to ping `/health` every day so the app doesn't sleep after 3 months of inactivity

### Phase 2b — Polish before sharing

- [ ] **Constellation shapes** — review all 12 rashi figures visually; adjust star positions or connections that look wrong
- [ ] **Mobile layout** — test on phone; check toggle buttons, tooltip, font sizes are usable on small screen
- [ ] **Browser geolocation** — add "Use my location" button that calls `navigator.geolocation.getCurrentPosition` to auto-fill lat/lon (2 hours)
- [ ] **South Indian chart** — fix the inner 2×2 CSS grid centre cell (currently spans wrong rows when rendered); verify retrograde `(Me)` formatting looks right
- [ ] **Loading skeleton** — currently just text; add faint concentric circle rings to match the wheel shape while API loads

### Phase 2c — V2 (Stellarium-inspired)
*(Inspired by https://www.youtube.com/watch?v=hBLA4WHQEIw)*

- [ ] **Time scrubber** — date/time slider + play button; backend already accepts any datetime, just need frontend UI and D3 transitions between planet positions
- [ ] **Planetary glyphs** — SVG sprite per graha replacing plain dots: Saturn with rings, Jupiter with bands, Sun as disc, Moon showing phase
- [ ] **Moon phase rendering** — compute illumination fraction from elongation; render crescent/gibbous shape as SVG arc inside the Moon glyph
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
