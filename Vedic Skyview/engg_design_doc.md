# Vedic Skyview — Engineering Design Document
**Version:** 0.4
**Author:** TBD
**Status:** In progress — personal research tool, no distribution

**Changelog v0.4:** M3 complete. `VedicSkyviewController` + `LocationHeadingManager` implemented. 9 Navagraha spheres on 1000 m sky-sphere; positions recomputed every 60 s via EphemerisEngine + CoordinatePipeline. Ephemeris data files trimmed to 1900–2100 (~1.9 MB) and tracked in git. Hardware constraint documented: dev Mac (2017 Intel) limited to Xcode 14 / Monterey, so on-device AR testing requires borrowing a Mac with Xcode 16.

**Changelog v0.3:** Confirmed Swift + ARKit + RealityKit as the build target (Unity path evaluated and rejected). Minor structural cleanup.

**Changelog v0.2:** Personal tool (no license concern); Python script adopted as reference implementation; nakshatra calculation fully specified; design doc aligned to existing validated Python logic.

---

## 1. Overview

A native iOS app that uses the device camera as a window into the Vedic sky. Point your phone at any part of the sky and see:
- The **9 Navagrahas** (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu) rendered at their precise sidereal positions
- The **12 Rashi** (zodiac sign) bands projected along the ecliptic
- The **27 Nakshatra** grid divisions overlaid on the ecliptic band

All calculations are **on-device, offline**, using sidereal (Lahiri ayanamsha) coordinates per the Jyotish system.

---

## 2. Goals & Non-Goals

### v1 Goals
- Real-time AR overlay on live camera feed
- Accurate sidereal positions of all 9 grahas
- Visible Rashi band (12 × 30° ecliptic sectors) as AR overlay
- Visible Nakshatra grid (27 × 13°20′ ecliptic sectors)
- Works offline, no network dependency for core features
- iOS 16+ support

### Non-Goals for v1
- Birth chart / Kundli generation
- Dasha / transit notifications
- Time travel / historical positions (future v2)
- Android support (architecture will accommodate it; no build target yet)
- Planetary conjunctions or aspect lines
- Deep-sky objects / star catalog

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        iOS App                                  │
│                                                                 │
│  ┌──────────────┐   ┌──────────────────┐   ┌────────────────┐  │
│  │  Ephemeris   │   │  Coordinate       │   │  AR Renderer   │  │
│  │  Engine      │──▶│  Pipeline         │──▶│  (ARKit +      │  │
│  │  (libswe-C)  │   │  (Swift)          │   │   RealityKit)  │  │
│  └──────────────┘   └──────────────────┘   └────────────────┘  │
│         │                   ▲                       ▲           │
│         │            ┌──────┴──────┐        ┌───────┴──────┐   │
│         │            │ Sensor Fuser│        │  UI / HUD    │   │
│         │            │ (CoreMotion │        │  (SwiftUI)   │   │
│         │            │  + CLoc.)   │        └──────────────┘   │
│         │            └─────────────┘                           │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │ Ayanamsha    │                                               │
│  │ (Lahiri)     │                                               │
│  └──────────────┘                                               │
└─────────────────────────────────────────────────────────────────┘
```

### Layer responsibilities

| Layer | Responsibility |
|---|---|
| **Ephemeris Engine** | Compute Julian Day, call Swiss Ephemeris C lib, return tropical ecliptic λ/β |
| **Ayanamsha Module** | Apply Lahiri offset → sidereal λ |
| **Coordinate Pipeline** | Ecliptic → Equatorial (RA/Dec) → Horizontal (Alt/Az) → AR world vector |
| **Sensor Fuser** | Fuse GPS (CoreLocation) + compass + gyro into a stable north/up reference frame |
| **AR Renderer** | Place RealityKit entities on a sky-sphere; draw ecliptic/rashi/nakshatra bands |
| **UI / HUD** | Labels, tap-to-identify, settings panel (SwiftUI) |

---

## 4. Ephemeris Engine

### Library: Swiss Ephemeris (libswe)

Swiss Ephemeris is the gold standard for planetary calculations. Since this is a **personal research tool with no distribution**, the AGPL license is a non-issue.

### Reference implementation

The Python script (`graha_positions_reference.py`) is the **canonical ground truth**. All Swift code must produce identical output for the same inputs (date, time, observer location, ayanamsha). The test suite in §14 uses the Python fixture output as the source of truth.

Key decisions already validated in the Python script:
- `swe.MEAN_NODE` for Rahu — smoother, preferred in Jyotish practice
- `swe.SIDM_LAHIRI` ayanamsha
- `swe.FLG_TOPOCTR` flag — topocentric positions with observer location
- Ketu = `(Rahu + 180°) % 360` — not a separate SWE body
- All longitudes `% 360` to normalise SWE output

**Integration path:**
1. Add `swisseph` C sources to the Xcode project (no external dependency manager needed)
2. Create a Swift bridging header: `#include "swephexp.h"`
3. Wrap in a Swift class `EphemerisEngine` mirroring the Python logic exactly

```swift
// EphemerisEngine.swift (sketch)
import Foundation

struct GrahaPosition {
    let graha: Graha
    let tropicalLongitude: Double   // degrees, 0–360
    let latitude: Double            // ecliptic latitude
    let distance: Double            // AU
}

final class EphemerisEngine {
    private static let sweIds: [Graha: Int32] = [
        .sun: SE_SUN, .moon: SE_MOON, .mars: SE_MARS,
        .mercury: SE_MERCURY, .jupiter: SE_JUPITER,
        .venus: SE_VENUS, .saturn: SE_SATURN,
        .rahu: SE_MEAN_NODE,
        // ketu = rahu + 180°, computed, not a SWE body
    ]

    func positions(at date: Date, observer: CLLocation) -> [GrahaPosition] {
        let jd = julianDay(from: date)
        swe_set_topo(observer.coordinate.longitude,
                     observer.coordinate.latitude,
                     observer.altitude)
        return Graha.allCases.compactMap { graha in
            position(graha: graha, julianDay: jd)
        }
    }
}
```

**Navagrahas mapped to SWE bodies:**

| Graha | Swiss Ephemeris ID | Notes |
|---|---|---|
| Surya (Sun) | `SE_SUN` | |
| Chandra (Moon) | `SE_MOON` | |
| Mangal (Mars) | `SE_MARS` | |
| Budha (Mercury) | `SE_MERCURY` | |
| Guru (Jupiter) | `SE_JUPITER` | |
| Shukra (Venus) | `SE_VENUS` | |
| Shani (Saturn) | `SE_SATURN` | |
| Rahu (N. Node) | `SE_MEAN_NODE` | Mean node; expose true node as user setting |
| Ketu (S. Node) | computed | `ketu_λ = rahu_λ + 180° mod 360°` |

**Ephemeris data files:** `sepl_18.se1`, `semo_18.se1`, `sefstars.txt`, `seorbel.txt` — trimmed to 1900–2100 range (~1.9 MB total), tracked in git under `Resources/ephemeris/`. Set the path with `swe_set_ephe_path(Bundle.main.bundlePath)`.

---

## 5. Ayanamsha & Sidereal Conversion

Jyotish uses the **sidereal zodiac**. All positions must be corrected by the ayanamsha (precession offset from the tropical vernal equinox).

```
sidereal_longitude = tropical_longitude - ayanamsha(date)
```

**Default:** Lahiri (Chitrapaksha) ayanamsha — the Indian government standard, used by most Jyotish practitioners.

```swift
enum Ayanamsha: Int32 {
    case lahiri       = 1   // SE_SIDM_LAHIRI
    case raman        = 3   // SE_SIDM_RAMAN
    case krishnamurti = 5   // SE_SIDM_KRISHNAMURTI
    case yukteshwar   = 7   // SE_SIDM_YUKTESHWAR
}

// Usage:
swe_set_sid_mode(Ayanamsha.lahiri.rawValue, 0, 0)
// Then call swe_calc_ut with SEFLG_SIDEREAL | SEFLG_TOPOCTR
```

Expose ayanamsha choice in Settings; default to Lahiri.

---

## 6. Coordinate Transformation Pipeline

The pipeline converts a graha's sidereal ecliptic coordinates into a 3D unit vector in the ARKit world frame.

```
Sidereal Ecliptic (λ, β)
        │
        ▼  [1] eclipticToEquatorial(ε)
Equatorial (RA, Dec)  — ε = obliquity of ecliptic (~23.44°)
        │
        ▼  [2] equatorialToHorizontal(lat, lon, LST)
Horizontal (Altitude, Azimuth)
        │
        ▼  [3] altAzToARVector()
AR World Space (x, y, z unit vector on sky-sphere)
```

### Step 1 — Ecliptic → Equatorial

```swift
func eclipticToEquatorial(lambda: Double, beta: Double, epsilon: Double)
    -> (ra: Double, dec: Double)
{
    let sinDec = sin(beta) * cos(epsilon) + cos(beta) * sin(epsilon) * sin(lambda)
    let dec = asin(sinDec)
    let y = sin(lambda) * cos(epsilon) - tan(beta) * sin(epsilon)
    let x = cos(lambda)
    let ra = atan2(y, x)  // 0–2π
    return (ra: ra.toDegrees.mod(360), dec: dec.toDegrees)
}
```

Obliquity ε is time-varying; use the IAU formula or call `swe_calc_ut` with `SE_ECL_NUT`.

### Step 2 — Equatorial → Horizontal

Requires observer **latitude**, **longitude**, and **Local Sidereal Time (LST)**.

```swift
func equatorialToHorizontal(ra: Double, dec: Double,
                             latitude: Double, lst: Double)
    -> (altitude: Double, azimuth: Double)
{
    let H = (lst - ra).mod(360)  // Hour Angle
    let sinAlt = sin(dec) * sin(latitude) + cos(dec) * cos(latitude) * cos(H)
    let altitude = asin(sinAlt)
    let cosAz = (sin(dec) - sin(altitude) * sin(latitude)) / (cos(altitude) * cos(latitude))
    let azimuth = atan2(-sin(H) * cos(dec), cosAz)
    return (altitude.toDegrees, azimuth.toDegrees.mod(360))
}
```

**LST computation:**
```
GMST = f(Julian Date)   // Greenwich Mean Sidereal Time (IAU formula)
LST  = GMST + longitude
```

### Step 3 — Horizontal → ARKit World Vector

ARKit's world frame with `.gravityAndHeading`:
- **+X** = East
- **+Y** = Up (gravity vector)
- **-Z** = North

```swift
func altAzToARVector(altitude: Double, azimuth: Double) -> SIMD3<Float> {
    let altR = Float(altitude.toRadians)
    let azR  = Float(azimuth.toRadians)
    let x =  sin(azR) * cos(altR)   // East component
    let y =  sin(altR)               // Up component
    let z = -cos(azR) * cos(altR)   // North component (ARKit -Z = North)
    return SIMD3<Float>(x, y, z)
}
```

Scale to a sky-sphere radius (e.g., 1000 m in ARKit units) to place all objects well behind real-world geometry.

---

## 7. Sensor Fusion — True North & Gravity

ARKit provides `ARWorldTrackingConfiguration` with `.gravityAndHeading` world alignment, which fuses:
- **CMMotionManager** (gyroscope + accelerometer) for up vector
- **CLLocationManager** (GPS + compass) for magnetic heading → true north via declination

```swift
let config = ARWorldTrackingConfiguration()
config.worldAlignment = .gravityAndHeading  // critical
session.run(config)
```

**Magnetic declination** is automatically corrected by CoreLocation when `CLLocationManager.headingOrientation` is set. This gives geographic (true) north — no manual declination math needed.

**Gotcha:** Compass accuracy degrades near metal structures. Display `CLHeading.headingAccuracy` in the HUD; warn user if > 15°.

---

## 8. Rashi & Nakshatra Grid Rendering

Both are divisions along the **sidereal ecliptic**.

| Division | Count | Arc per division |
|---|---|---|
| Rashi | 12 | 30° |
| Nakshatra | 27 | 13° 20′ |

### Ecliptic as a 3D great circle arc

1. Compute ~360 sample points along the ecliptic (λ = 0°…360°, β = 0°)
2. Run each through the full coordinate pipeline → ARKit vectors
3. Connect as a `ModelEntity` polyline or thin torus

### Nakshatra logic

Nakshatra and pada are computed from sidereal longitude using the same constants as `graha_positions_reference.py` — already tested across three fixture dates:

```
NAKSHATRA_SPAN = 360 / 27   = 13.333...°
PADA_SPAN      = 360 / 108  =  3.333...°
nakshatra_index = Int(sidereal_lon / NAKSHATRA_SPAN)                        // 0–26
pada            = Int((sidereal_lon % NAKSHATRA_SPAN) / PADA_SPAN) + 1     // 1–4
```

**Note on Abhijit:** Some traditions include a 28th nakshatra spanning ~4° in Capricorn. Omitted for v1; add as a settings toggle in v2.

### Rashi sector boundaries

At each λ = 0°, 30°, 60°…330°, place a radial line from the ecliptic inward + outward (±10° in ecliptic latitude).

```swift
struct RashiOverlay {
    let name: String        // "Mesha", "Vrishabha", etc.
    let symbol: String      // "♈", "♉", etc.
    let startLambda: Double // 0, 30, 60, ...
    let color: UIColor
    var midpointARVector: SIMD3<Float>   // for label placement
}
```

### Nakshatra sector boundaries

Same approach; 27 divisions, finer lines, smaller labels. Each nakshatra has a **yogatara** (junction star) — optionally render as a dot.

**Rendering approach:** Use `RealityKit` `MeshResource.generatePlane` for sector fills (semi-transparent), and `ModelEntity` with custom `MeshDescriptor` for boundary lines.

---

## 9. Graha Visual Design

| Graha | Visual | Rationale |
|---|---|---|
| Surya | Bright yellow disc with rays | |
| Chandra | Crescent / full circle based on phase | Phase from SWE |
| Mangal | Red disc | Traditional association |
| Budha | Green disc | Traditional |
| Guru | Orange/gold disc, largest | |
| Shukra | White/cream disc | |
| Shani | Dark blue, with ring | |
| Rahu | ☊ glyph at ecliptic/lunar-orbit intersection | See §9.1 |
| Ketu | ☋ glyph at ecliptic/lunar-orbit intersection | See §9.1 |

All entities use `BillboardComponent` so labels always face the camera.

---

## 9.1 Rahu & Ketu — Orbital Plane Visualisation

Rahu and Ketu are not physical bodies — they are the two points where the **Moon's orbital plane intersects the ecliptic**:

```
        Ecliptic (great circle)
       ───────────────────────────
              ↗  Rahu ☊          ↘  Ketu ☋
   Moon's   /   (ascending node)    (descending node)
   orbit   /                         \
  ────────                            ──────
      inclined ~5.1° to ecliptic
```

**User toggle:** `Settings > Show orbital planes` renders two great-circle arcs:
- **Ecliptic arc** — golden/amber (shared with Rashi/Nakshatra grid)
- **Lunar orbital arc** — silver/white, tilted ~5.1° to the ecliptic, ascending node at Rahu's current longitude

When both arcs are visible, Rahu and Ketu label themselves at the crossing points. When off, fall back to ☊ / ☋ glyphs.

### Math — generating the lunar orbital arc

The Moon's orbital plane is defined by:
- **λ_rahu** — sidereal longitude of ascending node (Rahu), from `SE_MEAN_NODE`
- **i** — mean inclination ≈ **5.145°** (treated as constant; true variation ±0.15° is imperceptible visually)

```swift
func lunarOrbitPoints(rahuLongitudeDeg: Double,
                      inclination: Double = 5.145,
                      sampleCount: Int = 180) -> [(lambda: Double, beta: Double)] {
    let lr  = rahuLongitudeDeg.toRadians
    let inc = inclination.toRadians
    var points: [(Double, Double)] = []

    for n in 0..<sampleCount {
        let u = Double(n) / Double(sampleCount) * 2 * .pi
        let x = cos(u) * cos(lr) - sin(u) * cos(inc) * sin(lr)
        let y = cos(u) * sin(lr) + sin(u) * cos(inc) * cos(lr)
        let z = sin(u) * sin(inc)

        let lambda = atan2(y, x).toDegrees.mod(360)
        let beta   = asin(z).toDegrees   // −5.1° to +5.1°
        points.append((lambda, beta))
    }
    return points
}
```

Each `(lambda, beta)` flows through `CoordinatePipeline` (§6) to get its ARKit vector. The two intersection points where `beta ≈ 0` are exactly `(λ_rahu, 0°)` and `(λ_rahu + 180°, 0°)` — which is exactly what SWE already gives us.

```swift
struct OrbitalPlanesOverlay {
    var eclipticArcEntity:   ModelEntity   // shared with Rashi grid
    var lunarOrbitArcEntity: ModelEntity   // silver polyline
    var rahuGlyphEntity:     ModelEntity   // ☊
    var ketuGlyphEntity:     ModelEntity   // ☋
    var isVisible: Bool = false
}
```

**Update frequency:** Rahu moves ~0.053°/day. Recompute the lunar arc at session start and once every 24 hours — no per-frame update needed.

---

## 10. AR Scene Setup

```swift
class VedicSkyviewController: UIViewController {
    var arView: ARView!
    var skyAnchor: AnchorEntity!
    var grahaEntities: [Graha: ModelEntity] = [:]
    var eclipticLineEntity: ModelEntity!

    func setupScene() {
        skyAnchor = AnchorEntity(world: .zero)
        arView.scene.addAnchor(skyAnchor)

        buildEclipticLine()
        buildRashiOverlays()
        buildNakshatraOverlays()
        buildGrahaEntities()
        buildOrbitalPlanesOverlay()   // Rahu/Ketu — hidden until user enables toggle
    }

    func updateLoop() {
        // Called on a 60-second timer, not every frame
        let positions = ephemerisEngine.positions(at: Date(), observer: currentLocation)
        for pos in positions {
            let vec = coordinatePipeline.toARVector(position: pos)
            grahaEntities[pos.graha]?.position = vec * 1000
        }
    }
}
```

**Update frequency:** Graha positions update every **60 seconds**. Rashi/Nakshatra lines are static per session.

---

## 11. Tech Stack

| Concern | Technology |
|---|---|
| Language | Swift 5.9+ |
| UI | SwiftUI (HUD, settings) + UIKit host |
| AR Framework | ARKit 6 + RealityKit 2 |
| Ephemeris | Swiss Ephemeris (libswe) via C bridging header |
| Location | CoreLocation |
| Motion | ARKit `.gravityAndHeading` (wraps CoreMotion) |
| Persistence | UserDefaults (settings only), no backend |
| Build | Xcode 14+ locally (Xcode 16 on CI), iOS 16+ deployment target |

---

## 12. Project Structure

```
Vedic Skyview/
├── App/
│   ├── VedicSkyviewApp.swift
│   └── ContentView.swift
├── AR/
│   ├── VedicSkyviewController.swift   # M3 — basic AR scene (implemented)
│   ├── SkySceneBuilder.swift          # builds rashi/nakshatra geometry
│   ├── GrahaEntityFactory.swift
│   └── BillboardSystem.swift
├── Ephemeris/
│   ├── EphemerisEngine.swift           # Swift wrapper for libswe
│   ├── AyanamshaManager.swift
│   └── swisseph/                       # C sources + headers
│       ├── sweph.c, swedate.c, ...
│       └── swephexp.h
├── Coordinates/
│   ├── CoordinatePipeline.swift        # Full λ,β → ARKit vector
│   ├── SiderealTime.swift
│   └── SphericalMath.swift
├── Models/
│   ├── Graha.swift
│   ├── Rashi.swift
│   ├── Nakshatra.swift
│   └── GrahaPosition.swift
├── Sensors/
│   └── LocationHeadingManager.swift
├── UI/
│   ├── HUDView.swift
│   ├── GrahaDetailSheet.swift
│   └── SettingsView.swift
└── Resources/
    └── ephemeris/                      # .se1 data files
```

---

## 13. Key Engineering Risks & Mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| Compass inaccuracy indoors / near metal | High | Show accuracy indicator; prompt user to step outside |
| ARKit `.gravityAndHeading` drift | Medium | Re-calibrate on tap; optional manual azimuth correction |
| Rahu/Ketu are nodes, not bodies — confusing to users | Medium | Onboarding tooltip explaining shadow grahas |
| Swiss Ephemeris AGPL license | **N/A** | Personal research tool — not a concern. Revisit if ever distributed. |
| 30 MB ephemeris data bundle size | Low | Use On-Demand Resources for non-current centuries |
| Obliquity/LST math precision | Medium | Unit test all coordinate transforms against known almanac values |
| RealityKit entity count performance | Low | 9 grahas + ~50 line segments = trivial |

---

## 14. Testing Strategy

### Unit Tests

- **Ephemeris accuracy:** `graha_positions_reference.py` is ground truth. Swift output must match Python to within 0.0001° for the same (date, time, observer location). Export Python fixture output as JSON and consume it in XCTest.
- **Nakshatra/Pada:** Verify span constants (`360/27`, `360/108`) and pada boundaries. Three verified fixture dates already exist in the Python test harness (2026-01-01, 2000-01-01, 1990-12-23, all topocentric at Ujjain).
- **Coordinate pipeline:** Pick a known star (e.g. Spica/Chitra at ~180° sidereal) with known RA/Dec; verify Alt/Az at a specific lat/lon/time matches Stellarium.
- **Ayanamsha:** Verify Lahiri offset for J2000 ≈ 23°51′ — already passing in the Python reference.

### Integration Tests

- Run full pipeline on all Python fixtures and diff output.
- Automate with XCTest.

### Manual / AR Tests

- Point device at Sun during daylight — Surya marker must align with the actual Sun.
- Verify Rashi labels match Stellarium at the same time.

---

## 15. Android / Cross-Platform Path (Future)

The Ephemeris and Coordinate layers are pure math with no Apple APIs and can be reused when needed:

- **Recommended path:** JNI to libswe (already C) for the ephemeris on Android; rewrite the ~150-line coordinate pipeline in Kotlin natively.
- Alternative: Kotlin Multiplatform for the coordinate pipeline, sharing it with a Kotlin Android app while keeping Swift for iOS.

Not a v1 concern — decide when you reach Android.

---

## 16. Milestones

| Milestone | Deliverables | Est. Effort |
|---|---|---|
| M1 — Ephemeris Core | libswe integrated in Xcode, all 9 graha positions computable in Swift, output matches Python fixture | done |
| M2 — Coordinate Pipeline | Full λ,β → Alt/Az → ARKit vector; validated against Stellarium | done |
| M3 — Basic AR Scene | 9 Navagraha spheres on 1000 m sky-sphere; `VedicSkyviewController` + `LocationHeadingManager`; 60 s update loop | testing pending |
| M4 — Rashi / Nakshatra Grid | Ecliptic line + 12 Rashi bands + 27 Nakshatra boundary lines + orbital planes toggle | 1.5 weeks |
| M5 — Polish & HUD | Graha labels, tap-to-identify sheet, compass accuracy warning, settings panel | 1 week |
| M6 — QA | Point at Sun during daylight, verify Rashi labels vs Stellarium, TestFlight | 1 week |

**Total estimated:** ~7–8 weeks solo

---

## 17. Open Questions

1. **True node vs Mean node for Rahu?** Mean node is smoother for Jyotish practice; true node oscillates. Currently defaulting to mean node; expose as a user setting.
2. **Retrograde (vakri) indicator?** Show ℞ badge when longitude speed from SWE is negative. Good v2 feature.
3. **Moon phase rendering?** Compute illuminated fraction from SWE for Chandra's visual appearance. Deferred to v2.
4. **Special yogas in HUD?** Display active yogas (e.g. Gajakesari, Budhaditya) when current positions form them. Deferred to v2.
5. **App name decided:** "Vedic Skyview". "Akasha Darshan" (आकाश दर्शन, "vision of the sky") remains a candidate for a future rename before public release.