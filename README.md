# Navgraha Clock

Real-time Vedic astrology app showing the 9 Navagraha (planet) positions and Lagna using Swiss Ephemeris calculations (Lahiri ayanamsha, sidereal, topocentric).

**Live demo:** *(Streamlit URL goes here after deployment)*

---

## What it shows

- **9 Navagrahas** — Surya, Chandra, Mangala, Budha, Guru, Shukra, Shani, Rahu, Ketu
- **Lagna** (Ascendant) — computed from observer location
- **4 views** — Rashi Chakra wheel, Celestial Map, North Indian Kundali, South Indian Kundali
- Positions update every 60 seconds

---

## Platforms

| Folder | Platform | Status |
|---|---|---|
| `streamlit/` | Web (Streamlit) | In progress |
| `iOS/` | Native iOS (SwiftUI) | Complete — M1–M5, blocked on Xcode 14 / iOS 18 deploy |
| `web/` | React web app | Planned (Phase 2) |

---

## Run the Streamlit app locally

**Requirements:** Python 3.9+, pip

```bash
pip install streamlit streamlit-autorefresh pyswisseph pandas matplotlib
streamlit run streamlit/app.py
```

Opens at `http://localhost:8501`.

---

## Deploy to Streamlit Community Cloud (free)

1. Push this repo to GitHub (must be public)
2. Go to [share.streamlit.io](https://share.streamlit.io)
3. Connect your GitHub account → select this repo
4. Set **Main file path** to `streamlit/app.py`
5. Click Deploy — get a permanent `yourname.streamlit.app` URL

---

## Tech stack

- **Calculations:** [Swiss Ephemeris](https://www.astro.com/swisseph/) via `pyswisseph` (Python) and `libswe` C (iOS)
- **Ayanamsha:** Lahiri / Chitrapaksha
- **Web:** Python + Streamlit + matplotlib
- **iOS:** SwiftUI + Swift + libswe compiled directly into the Xcode target
- **Accuracy:** matches canonical Python reference to within 0.0001° for identical inputs

---

## Run Python tests

```bash
pip install swisseph pandas pytest
python -m pytest scripts/test_graha_positions.py -v
```

## Run iOS tests (requires macOS + Xcode 14+)

```bash
xcodebuild test \
  -project "iOS/NavgrahaClock.xcodeproj" \
  -scheme "NavgrahaClock" \
  -destination "platform=iOS Simulator,name=iPhone 14"
```

---

## Design doc

See `DESIGN.md` for the web port architecture, folder decisions, and Phase 2 React plan.
