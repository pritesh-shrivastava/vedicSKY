# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Vedic Skyview** is a personal iOS AR app that overlays Navagraha (9 planet) positions, Rashi bands, and Nakshatra grid on a live camera feed, using on-device Swiss Ephemeris calculations (Lahiri ayanamsha, sidereal, topocentric). Not intended for distribution.

Full architecture: `engg_design_doc.md`. Current milestone: **M3 — Basic AR Scene**.

## Build & Test

**Xcode project:** `Vedic Skyview/Vedic Skyview.xcodeproj`
- iOS 16+ deployment target, Xcode 14+ (Xcode 16 on CI)
- Build and run tests via Xcode or `xcodebuild`

**Run Swift tests (command line):**
```bash
xcodebuild test -project "Vedic Skyview/Vedic Skyview.xcodeproj" \
  -scheme "Vedic Skyview" -destination "platform=iOS Simulator,name=iPhone 14"
```

**Run a single Swift test:**
```bash
xcodebuild test -project "Vedic Skyview/Vedic Skyview.xcodeproj" \
  -scheme "Vedic Skyview" -only-testing:"Vedic SkyviewTests/EphemerisTests/testFixturesMatch" \
  -destination "platform=iOS Simulator,name=iPhone 14"
```

**Python reference tests:**
```bash
python -m pytest scripts/test_graha_positions.py -v
```

**Generate fixture JSON** (requires `pip install swisseph pandas`):
```bash
python scripts/export_fixtures.py
# writes Vedic Skyview/Vedic SkyviewTests/EphemerisTests/graha_fixtures.json
```

## Repo Structure

```
/                                         ← git repo root
├── scripts/
│   ├── graha_positions_reference.py      ← Canonical Python ground truth
│   ├── export_fixtures.py                ← Generates fixtures from Python ref
│   └── test_graha_positions.py           ← Python tests for reference impl
└── Vedic Skyview/                        ← ALL Swift/Xcode files live here
    ├── Vedic Skyview.xcodeproj
    ├── Ephemeris/
    │   └── EphemerisEngine.swift         ← Swiss Ephemeris Swift wrapper
    ├── Coordinates/                      ← M2 coordinate pipeline
    │   ├── SphericalMath.swift
    │   ├── SiderealTime.swift
    │   └── CoordinatePipeline.swift
    ├── Resources/ephemeris/              ← .se1 binary data files (only relevant ones)
    ├── Source/ThirdParty/swisseph/       ← libswe C sources
    ├── Vedic Skyview/                    ← App source (ContentView, App entry)
    ├── Vedic SkyviewTests/               ← XCTest suite
    │   ├── EphemerisTests/
    │   │   ├── EphemerisTests.swift
    │   │   └── graha_fixtures.json       ← Ground-truth fixture (test bundle resource)
    │   └── CoordinateTests/CoordinateTests.swift
    └── VedicSkyview-Bridging-Header.h    ← Exposes swephexp.h to Swift
```

## File Placement Rules

**All new Swift source files must be created inside `Vedic Skyview/`**, never at the repo root. Follow this pattern:

| What | Where |
|---|---|
| New Swift source layer (e.g. AR, UI) | `Vedic Skyview/<LayerName>/` |
| New XCTest file | `Vedic Skyview/Vedic SkyviewTests/<GroupName>/` |
| New Python script or test | `scripts/` |
| XCTest fixture data (JSON, etc.) | `Vedic Skyview/Vedic SkyviewTests/<TestGroupName>/` — add as bundle resource on test target |
| New ephemeris data files | `Vedic Skyview/Resources/ephemeris/` |

**When adding a new Swift file in Xcode:**
- Right-click the appropriate group in the Navigator → Add Files
- "Copy items if needed" = **OFF** if you created the file in the right place on disk already; **ON** only if the file is outside `Vedic Skyview/`
- Never use `path = ../` references in the Xcode project — all paths should be relative within `Vedic Skyview/`

## Architecture

The pipeline is: **Ephemeris Engine → Coordinate Pipeline → AR Renderer**

| Layer | File(s) | Status |
|---|---|---|
| Ephemeris Engine | `Vedic Skyview/Ephemeris/EphemerisEngine.swift` | M1 complete, tests passing |
| Coordinate Pipeline | `Vedic Skyview/Coordinates/CoordinatePipeline.swift` | M2 complete |
| AR Scene | `Vedic Skyview/AR/JyotishARViewController.swift` | M3 (not yet created) |
| SwiftUI HUD | `Vedic Skyview/UI/` | M5 (not yet created) |

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

The ephemeris files in `Vedic Skyview/Resources/ephemeris/` are **tracked in git** (trimmed to 1900–2100 range, ~1.9 MB total). Four files are present: `sepl_18.se1` (planets), `semo_18.se1` (moon), `sefstars.txt` (fixed stars), `seorbel.txt` (orbital elements). The path is passed to `swe_set_ephe_path` at init.

## libswe Integration

Swiss Ephemeris C sources live in `Vedic Skyview/Source/ThirdParty/swisseph/`. The bridging header at `Vedic Skyview/VedicSkyview-Bridging-Header.h` includes `swephexp.h`. C sources are compiled directly into the Xcode target — no package manager needed.

## Coordinate Pipeline (M2)

The transformation chain for placing grahas in AR space:
```
Sidereal Ecliptic (λ, β)
  → eclipticToEquatorial(ε)  → (RA, Dec)
  → equatorialToHorizontal(lat, lon, LST)  → (Alt, Az)
  → altAzToARVector()  → SIMD3<Float> in ARKit world space
```
ARKit frame with `.gravityAndHeading`: +X=East, +Y=Up, -Z=North. Sky-sphere radius = 1000 units.

## Testing Approach

- Swift `EphemerisTests.testFixturesMatch` loads `graha_fixtures.json` from the test bundle (`Bundle(for: EphemerisTests.self)`) and compares computed vs expected longitudes within `tol = 1e-4°`
- Fixture JSON lives at `Vedic Skyview/Vedic SkyviewTests/EphemerisTests/graha_fixtures.json` (tracked in git, bundled in the test target)
- Regenerate it with `python scripts/export_fixtures.py` (writes to the same path)
- Fixture test cases use Ujjain (23.1765°N, 75.7885°E) as the reference location for dates: 2026-01-01, 2000-01-01, 1990-12-23
