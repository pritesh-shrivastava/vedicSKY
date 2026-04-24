# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Navgraha Clock** — multi-platform Vedic astrology app. iOS app in `iOS/`, Streamlit web POC in `streamlit/`, React web app (Phase 2) in `web/`.

**iOS app** (`iOS/`) — Native iOS app visualising the 9 Navagraha positions and Lagna in real time using on-device Swiss Ephemeris calculations (Lahiri ayanamsha, sidereal, topocentric). Four tabs: Rashi Chakra wheel, Celestial Sphere (orthographic globe), North Indian Kundali, South Indian Kundali. Architecture: `iOS/design_doc.md`.

**Streamlit POC** (`streamlit/`) — Python web app using `scripts/graha_positions_reference.py` for calculations. Deploy to Streamlit Community Cloud. See `DESIGN.md`.

**Status:** iOS M1–M5 complete. Streamlit POC in progress. v2 AR Sky Overlay planned — see `iOS/design_doc.md §11`.

## Hardware Constraints

**Dev machine:** MacBook Air 2017 (Intel) — max macOS is **Monterey 12**, max Xcode is **14.x**

| What | Works? | Notes |
|---|---|---|
| Build + unit tests (Simulator) | ✅ | Use `iPhone 14` simulator, not iPhone 15 |
| Deploy to iPhone XR (iOS 18) via USB | ❌ | Xcode 14 has no iOS 18 device support files; needs Xcode 16 |
| AR testing on Simulator | ❌ | ARKit world tracking not available in Simulator |
| Apple Developer Program / TestFlight | ❌ (skipped) | $99/year — not worth it for a learning project |

**Current test strategy:** Run unit tests on the iPhone 14 Simulator. For AR (v2) validation, borrow a Mac with Xcode 16 to do a single USB deploy with a free personal provisioning profile (expires every 7 days, free Apple ID is enough).

**Apple Developer Program cost:**
- Public App Store distribution → $99/year (skipped — personal project)
- Running on your own iPhone via USB → **free**, personal Apple ID is enough
- Free provisioning profile expires every 7 days; renew by hitting Run in Xcode again

## Build & Test

**Xcode project:** `iOS/NavgrahaClock.xcodeproj`
- iOS 16+ deployment target, Xcode 14+
- Build and run tests via Xcode or `xcodebuild`

**Run Swift tests (command line):**
```bash
xcodebuild test -project "iOS/NavgrahaClock.xcodeproj" \
  -scheme "NavgrahaClock" -destination "platform=iOS Simulator,name=iPhone 14"
```

**Run a single Swift test:**
```bash
xcodebuild test -project "iOS/NavgrahaClock.xcodeproj" \
  -scheme "NavgrahaClock" -only-testing:"NavgrahaClockTests/EphemerisTests/testFixturesMatch" \
  -destination "platform=iOS Simulator,name=iPhone 14"
```

**Python reference tests:**
```bash
python -m pytest scripts/test_graha_positions.py -v
```

**Generate fixture JSON** (requires `pip install swisseph pandas`):
```bash
python scripts/export_fixtures.py
# writes iOS/NavgrahaClockTests/EphemerisTests/graha_fixtures.json
```

## Repo Structure

```
/                                              ← git repo root
├── DESIGN.md                                  ← Web port design doc
├── scripts/
│   ├── graha_positions_reference.py           ← Canonical Python ground truth
│   ├── export_fixtures.py                     ← Generates fixtures from Python ref
│   └── test_graha_positions.py                ← Python tests for reference impl
├── streamlit/                                 ← Streamlit POC (Phase 1 web)
│   ├── app.py
│   └── requirements.txt
├── web/                                       ← React web app (Phase 2, planned)
│   └── README.md
└── iOS/                                       ← iOS app (fully self-contained)
    ├── NavgrahaClock.xcodeproj
    ├── README.md
    ├── design_doc.md
    ├── NavgrahaClock/                         ← App source
    │   ├── NavgrahaClockApp.swift
    │   ├── ContentView.swift                  ← 4-tab root view
    │   ├── AR/
    │   │   └── VedicSkyviewController.swift   ← v2 AR scene (not in build target yet)
    │   ├── Ephemeris/EphemerisEngine.swift
    │   ├── Coordinates/
    │   │   ├── CoordinatePipeline.swift
    │   │   ├── SiderealTime.swift
    │   │   └── SphericalMath.swift
    │   ├── Sensors/LocationHeadingManager.swift
    │   ├── UI/
    │   │   ├── NavgrahaViewModel.swift         ← shared ObservableObject
    │   │   ├── RashiWheelView.swift            ← Tab 1: ecliptic wheel
    │   │   ├── CelestialSphereView.swift       ← Tab 2: orthographic globe
    │   │   ├── NorthIndianKundaliView.swift    ← Tab 3: North chart
    │   │   ├── SouthIndianKundaliView.swift    ← Tab 4: South chart
    │   │   └── ConstellationData.swift         ← hardcoded star data
    │   ├── Source/ThirdParty/swisseph/         ← libswe C sources
    │   ├── Resources/ephemeris/                ← .se1 files
    │   └── NavgrahaClock-Bridging-Header.h
    ├── NavgrahaClockTests/                     ← XCTest suite
    │   ├── EphemerisTests/
    │   │   ├── EphemerisTests.swift
    │   │   └── graha_fixtures.json             ← ground-truth fixture data
    │   ├── CoordinateTests/
    │   │   └── CoordinateTests.swift
    │   └── NavgrahaClockTests.swift
    └── NavgrahaClockUITests/
```

## File Placement Rules

New Swift source files go inside `iOS/NavgrahaClock/`. Follow this pattern:

| What | Where |
|---|---|
| New Swift source layer (e.g. AR, UI) | `iOS/NavgrahaClock/<LayerName>/` |
| New XCTest file | `iOS/NavgrahaClockTests/<GroupName>/` |
| New Python script or test | `scripts/` |
| XCTest fixture data (JSON, etc.) | `iOS/NavgrahaClockTests/<TestGroupName>/` — add as bundle resource on test target |
| New ephemeris data files | `iOS/NavgrahaClock/Resources/ephemeris/` |
| Streamlit web app files | `streamlit/` |

**When adding a new Swift file in Xcode:**
- Right-click the appropriate group in the Navigator → Add Files
- "Copy items if needed" = **OFF** if you created the file in the right place on disk already
- Never use `path = ../` references — all paths should be relative within `iOS/`

## Architecture

```
EphemerisEngine (libswe C)  ──►  NavgrahaViewModel  ──►  RashiWheelView
LocationHeadingManager ─────────► (ObservableObject)  ──►  CelestialSphereView
                                                       ──►  NorthIndianKundaliView
                                                       ──►  SouthIndianKundaliView
```

| Layer | File(s) | Status |
|---|---|---|
| Ephemeris Engine | `iOS/NavgrahaClock/Ephemeris/EphemerisEngine.swift` | M1 complete, tests passing |
| Coordinate Pipeline | `iOS/NavgrahaClock/Coordinates/CoordinatePipeline.swift` | M1 complete, tests passing |
| Rashi Wheel | `iOS/NavgrahaClock/UI/RashiWheelView.swift` | M2 complete |
| Celestial Sphere | `iOS/NavgrahaClock/UI/CelestialSphereView.swift` | M3 complete |
| Kundali Charts | `iOS/NavgrahaClock/UI/North+SouthIndianKundaliView.swift` | M4 complete |
| Polish (M5) | Tap sheet, time-travel, settings | complete |
| AR Sky Overlay (v2) | `iOS/NavgrahaClock/AR/VedicSkyviewController.swift` | coded, device test pending |
| Streamlit POC | `streamlit/app.py` | in progress |

## Key Implementation Rules

**Ground truth:** `scripts/graha_positions_reference.py` is the canonical reference. All Swift output must match it to within **0.0001°** for identical inputs. Never change the Python script's computation logic — it's the test oracle.

**Swiss Ephemeris constants** (must match Python exactly):
- Ayanamsha: `SE_SIDM_LAHIRI` (Lahiri/Chitrapaksha)
- Rahu: `SE_MEAN_NODE` (not true node)
- Ketu: computed as `(rahu_tropical + 180°) % 360°` — not a SWE body
- Flags: `SEFLG_TOPOCTR` for topocentric positions
- Always call `swe_set_topo(lon, lat, alt)` before `swe_calc_ut`

**Graha order** (canonical, matches Python): `["Surya","Chandra","Mangala","Budha","Guru","Shukra","Shani","Rahu","Ketu"]`

**Nakshatra math:**
```
NAKSHATRA_SPAN = 360/27  = 13.333...°
PADA_SPAN      = 360/108 =  3.333...°
nakshatra_index = Int(sidereal_lon / NAKSHATRA_SPAN)           // 0–26
pada            = Int((sidereal_lon % NAKSHATRA_SPAN) / PADA_SPAN) + 1  // 1–4
```

## Ephemeris Data Files

The ephemeris files in `iOS/NavgrahaClock/Resources/ephemeris/` are **tracked in git** (trimmed to 1900–2100 range, ~1.9 MB total). Four files: `sepl_18.se1` (planets), `semo_18.se1` (moon), `sefstars.txt` (fixed stars), `seorbel.txt` (orbital elements). The path is passed to `swe_set_ephe_path` at init.

## libswe Integration

Swiss Ephemeris C sources live in `iOS/NavgrahaClock/Source/ThirdParty/swisseph/`. The bridging header at `iOS/NavgrahaClock/NavgrahaClock-Bridging-Header.h` includes `swephexp.h`. C sources are compiled directly into the Xcode target — no package manager needed.

## Coordinate Pipeline

The transformation chain (v1 views use up to Alt/Az; v2 AR extends to ARKit vector):
```
Sidereal Ecliptic (λ, β)
  → eclipticToEquatorial(ε)  → (RA, Dec)
  → equatorialToHorizontal(lat, lon, LST)  → (Alt, Az)
  → altAzToARVector()  → SIMD3<Float> in ARKit world space  [v2 AR only]
```
ARKit frame with `.gravityAndHeading`: +X=East, +Y=Up, -Z=North. Sky-sphere radius = 1000 units.

## Testing Approach

- Swift `EphemerisTests.testFixturesMatch` loads `graha_fixtures.json` from the test bundle (`Bundle(for: EphemerisTests.self)`) and compares computed vs expected longitudes within `tol = 1e-4°`
- Fixture JSON lives at `iOS/NavgrahaClockTests/EphemerisTests/graha_fixtures.json` (tracked in git, bundled in the test target)
- Regenerate it with `python scripts/export_fixtures.py`
- Fixture test cases use Ujjain (23.1765°N, 75.7885°E) as the reference location for dates: 2026-01-01, 2000-01-01, 1990-12-23

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health
