# Navgraha Clock

A personal iOS app visualising the 9 Navagraha positions and Lagna in real time using on-device Swiss Ephemeris calculations (Lahiri ayanamsha, sidereal, topocentric).

**Four views, one tab bar:**

| Tab | View | Description |
|---|---|---|
| Chakra | Rashi Wheel | Circular ecliptic wheel — 12 Rashis, 27 Nakshatras, constellation stick figures, 9 graha dots, Lagna marker |
| Sphere | Celestial Sphere | Orthographic globe — equatorial grid, ecliptic, lunar orbit arc, Rahu/Ketu nodes, draggable rotation |
| North | North Indian Kundali | House-fixed diamond chart — grahas in their houses |
| South | South Indian Kundali | Sign-fixed 4×4 grid — grahas in their Rashi cells |

**Ground truth:** `../scripts/graha_positions_reference.py` — canonical Python reference. Swift output must match to within 0.0001° for the same inputs.

---

## v2 Roadmap

| Feature | Status | Notes |
|---|---|---|
| **AR Sky Overlay** | Coded, untested on device | `AR/VedicSkyviewController.swift` — ARKit + RealityKit scene placing 9 Navagraha spheres on a 1000 m sky-sphere |
| Rashi / Nakshatra AR bands | Not started | Ecliptic arc segments as AR planes |
| SwiftUI HUD | Not started | Tap-to-identify, graha name labels in AR |
| Time-travel scrubber | Not started | Drag to set custom date/time |
| Retrograde (vakri) badges | Not started | ℞ indicator when SWE velocity < 0 |
| Birth chart mode | Not started | Freeze positions to a birth date + location |

**AR blocker:** Needs a Mac with Xcode 16 for on-device testing. A free personal Apple ID provisioning profile is enough — no $99 developer program required. Profile expires every 7 days; renew by hitting Run in Xcode.

---

## Repo Structure

```
NavgrahaClock/
├── NavgrahaClock.xcodeproj
├── NavgrahaClockApp.swift
├── ContentView.swift               ← 4-tab root view
├── Ephemeris/
│   └── EphemerisEngine.swift       ← Swiss Ephemeris wrapper (Lahiri, topocentric)
├── Coordinates/
│   ├── SphericalMath.swift         ← eclipticToEquatorial, altAz helpers
│   ├── SiderealTime.swift          ← GMST / LST computation
│   └── CoordinatePipeline.swift    ← full ecliptic → equatorial → horizontal pipeline
├── Sensors/
│   └── LocationHeadingManager.swift ← CoreLocation Combine publisher
├── Source/ThirdParty/swisseph/     ← libswe C sources (copied from Vedic Skyview)
├── Resources/ephemeris/            ← sepl_18.se1, semo_18.se1, sefstars.txt, seorbel.txt
├── UI/
│   ├── NavgrahaViewModel.swift     ← shared ObservableObject; EphemerisEngine + Lagna
│   ├── RashiWheelView.swift        ← Tab 1: circular ecliptic wheel
│   ├── CelestialSphereView.swift   ← Tab 2: orthographic celestial globe
│   ├── NorthIndianKundaliView.swift ← Tab 3: North Indian chart
│   ├── SouthIndianKundaliView.swift ← Tab 4: South Indian chart
│   └── ConstellationData.swift     ← hardcoded zodiac constellation star data
└── NavgrahaClock-Bridging-Header.h ← exposes swephexp.h to Swift
```

---

## Build & Run

**Requirements:** Xcode 14+ (Xcode 16 recommended), iOS 16+ target, iPhone 14 Simulator or physical device.

```bash
# Build and run unit tests
xcodebuild test -project "NavgrahaClock/NavgrahaClock.xcodeproj" \
  -scheme "NavgrahaClock" -destination "platform=iOS Simulator,name=iPhone 14"
```

**Simulator location:** `Features → Location → Custom Location` — e.g. Bhopal: 23.259°N, 77.412°E

---

## Key Constants

| Constant | Value |
|---|---|
| Ayanamsha | Lahiri (`SE_SIDM_LAHIRI`) |
| Rahu | Mean node (`SE_MEAN_NODE`) |
| Ketu | `(Rahu + 180°) % 360` |
| Positions | Topocentric (`SEFLG_TOPOCTR`) |
| Fallback location | Ujjain 23.1765°N, 75.7885°E |
| Update interval | 60 seconds |
| Lagna house system | Placidus (`swe_houses` with `"P"`) |
| Lunar orbit inclination | 5.145° |
