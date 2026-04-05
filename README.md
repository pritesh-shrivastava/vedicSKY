# Vedic Skyview — Project README

Personal research tool. iOS AR app that overlays Navagraha positions, Rashi bands,
and Nakshatra grid on a live camera feed using on-device Swiss Ephemeris calculations
(Lahiri ayanamsha, sidereal, topocentric).

**Docs:** See `jyotish_ar_eng_design.md` for full architecture.
**Reference implementation:** `scripts/graha_positions_reference.py` — canonical Python ground truth; all iOS Swift output must match this script's output for the same inputs.

---

## Repo Structure

```
/                                         ← git repo root
├── README.md
├── jyotish_ar_eng_design.md
├── scripts/
│   ├── graha_positions_reference.py      ← reference implementation + test harness
│   ├── export_fixtures.py                ← generates graha_fixtures.json
│   └── test_graha_positions.py           ← Python tests for reference impl
└── Vedic Skyview/                        ← ALL Swift/Xcode files live here
    ├── Vedic Skyview.xcodeproj
    ├── Ephemeris/EphemerisEngine.swift   ← Swift wrapper for libswe C API
    ├── Coordinates/                      ← M2 coordinate pipeline
    │   ├── SphericalMath.swift
    │   ├── SiderealTime.swift
    │   └── CoordinatePipeline.swift
    ├── Resources/ephemeris/              ← .se1 binary data files (not in git)
    │   └── sat/plmolist.txt              ← planetary moon index (required)
    ├── Source/ThirdParty/swisseph/       ← libswe C sources
    └── Vedic SkyviewTests/               ← XCTest suite
        ├── EphemerisTests/               ← testFixturesMatch (M1)
        │   ├── EphemerisTests.swift
        │   └── graha_fixtures.json       ← ground-truth fixture (test bundle resource)
        └── CoordinateTests/              ← coordinate pipeline tests (M2)
```

**Note:** The `.se1` ephemeris data files in `Vedic Skyview/Resources/ephemeris/` are not committed to this repository due to their size. Obtain them from the Swiss Ephemeris distribution (astro.com or `github.com/aloistr/swisseph`) and place them in that directory. The `sat/` subdirectory and its `plmolist.txt` index file must also be present.

---

## Design Decisions

### Rahu & Ketu — orbital plane intersection (not just glyphs)

Rather than rendering Rahu/Ketu as arbitrary symbols at a computed longitude, the AR scene shows what they actually are — the two points where the **Moon's orbital plane intersects the ecliptic**.

User toggle: `Show orbital planes` renders:
- **Ecliptic arc** — amber/gold great circle (shared with Rashi/Nakshatra grid)
- **Lunar orbit arc** — silver great circle, inclined ~5.1° to the ecliptic, rotating so its ascending node sits at Rahu's current longitude
- **Rahu ☊ / Ketu ☋** — labelled at the two crossing points

When the toggle is off, fall back to plain ☊ / ☋ glyphs at the computed positions.

See §9.1 of the design doc for the full parametric math.

---

### 🟡 iOS v1 milestones (in order)

- [x] **M1 — Ephemeris Core**: Integrate `libswe` C sources into Xcode, create Swift bridging header, implement `EphemerisEngine.swift` mirroring the Python reference. Use `swe_set_topo` for topocentric positions and `SE_MEAN_NODE` for Rahu. All 9 graha positions verified against `graha_positions_reference.py` fixtures — tests passing.

- [ ] **M2 — Coordinate Pipeline**: Implement full `sidereal ecliptic → equatorial → horizontal → ARKit world vector` chain in `CoordinatePipeline.swift`. `SphericalMath.swift`, `SiderealTime.swift`, and `CoordinatePipeline.swift` created; XCTests written. Pending: Stellarium cross-check for Spica/Chitra at a specific lat/lon/time.

- [ ] **M3 — Basic AR Scene**: 9 graha dots visible on sky with rough alignment. Use `ARWorldTrackingConfiguration.worldAlignment = .gravityAndHeading`.

- [ ] **M4 — Rashi / Nakshatra Grid + Orbital Planes**: Ecliptic arc + 12 Rashi bands + 27 Nakshatra boundary lines + lunar orbital arc (silver, ~5.1° inclined). Rahu/Ketu render as intersection glyphs ☊ ☋ at crossing points. Settings toggle to show/hide arcs.

- [ ] **M5 — Polish & HUD**: Graha labels (billboarded), tap-to-identify bottom sheet, compass accuracy warning (`CLHeading.headingAccuracy` > 15° triggers alert), settings panel (ayanamsha choice, mean vs true node).

- [ ] **M6 — QA**: Point device at Sun during daylight — Surya marker must align with actual Sun. Verify Rashi labels match Stellarium and Python reference for chosen fixtures.

---

### 🟢 v2 / future features

- [ ] **Time travel**: Scrub to past/future dates to see sky positions at any time (useful for birth chart visualisation).

- [ ] **Retrograde (vakri) indicator**: Badge graha labels with ℞ when planet is in retrograde. Compute from SWE velocity output (negative longitude speed = vakri).

- [ ] **Moon phase rendering**: Compute illuminated fraction from SWE for Chandra's visual — show crescent vs full disc.

- [ ] **Abhijit nakshatra**: Optional 28th nakshatra (~4° in Capricorn/Makara). Add as a settings toggle; off by default.

- [ ] **True node vs Mean node for Rahu**: Currently defaulting to `SE_MEAN_NODE`. Expose as a user setting.

- [ ] **Dasha / transit alerts**: Notify when a graha changes Rashi or Nakshatra.

- [ ] **Birth chart / Kundli**: Generate a static chart from birth date + location.

- [ ] **Android port**: Ephemeris layer reusable via JNI (libswe is C); coordinate pipeline is plain math, straightforward to port to Kotlin. See §15 of design doc.

---

### ⚪ Low priority / revisit later

- [ ] **Swiss Ephemeris license**: Currently AGPL — fine for personal use. If this ever becomes a distributed or paid app, purchase the commercial license (~€100 one-time from astro.com).

- [ ] **App name**: "Akasha Darshan" (आकाश दर्शन) is a candidate. Decide before any public release.

- [ ] **Special yogas in HUD**: Display active yogas (e.g. Gajakesari, Budhaditya) when current positions form them.

- [ ] **ODR for ephemeris data files**: The bundled `.se1` files are ~30 MB. For non-current centuries, use On-Demand Resources to download on first use.

---

## Quick reference — key constants

| Constant | Value | Notes |
|---|---|---|
| Ayanamsha | Lahiri (`SE_SIDM_LAHIRI`) | Indian government standard |
| Rahu node type | Mean node (`SE_MEAN_NODE`) | Smoother for Jyotish/Jyotisha practice; true node oscillates |
| Ketu | `(Rahu + 180°) % 360` | Derived, not a SWE body |
| Positions | Topocentric (`SEFLG_TOPOCTR`) | Observer location via `swe_set_topo` |
| Rashi span | 30° | 12 × 30° = 360° |
| Nakshatra span | 13°20′ = 360/27° | 27 × 13°20′ = 360° |
| Pada span | 3°20′ = 360/108° | 4 padas per nakshatra |
| iOS target | 16+ | ARKit 6 + RealityKit 2 |