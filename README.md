# Jyotish AR — Project README

Personal research tool. iOS AR app that overlays Navagraha positions, Rashi bands,
and Nakshatra grid on a live camera feed using on-device Swiss Ephemeris calculations
(Lahiri ayanamsha, sidereal, topocentric).

**Docs:** See `jyotish_ar_eng_design.md` for full architecture.
**Reference implementation:** `graha_positions_reference.py` — canonical Python ground truth; all iOS Swift output must match this script's output for the same inputs.

---

## Repo Structure (planned)

```
/
├── README.md
├── jyotish_ar_eng_design.md
├── graha_positions_reference.py    ← reference implementation + test harness
├── iOS/                            ← Xcode project
└── data/                           ← generated CSVs / JSON fixtures
```

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

## TODO

### ✅ Done

- **Verify nakshatra test cases (topocentric, Ujjain)** — Tests in `graha_positions_reference.py` have been run and verified locally for three fixtures: `2026-01-01 00:00 IST`, `2000-01-01 12:00 IST`, and `1990-12-23 21:57 IST`. All use Ujjain (23.1828°N, 75.7772°E) as the reference observer with `swe.FLG_TOPOCTR`. Expected nakshatra values have been updated in the script and the test harness exits non-zero on failure. 

---

### 🟡 iOS v1 milestones (in order)

- [ ] **M1 — Ephemeris Core**: Integrate `libswe` C sources into Xcode, create Swift bridging header, implement `EphemerisEngine.swift` mirroring the Python reference. Use `swe_set_topo` for topocentric positions and `SE_MEAN_NODE` for Rahu. Verify Surya's sidereal longitude for a chosen fixture matches `graha_positions_reference.py` output to within 0.0001°.

- [ ] **M2 — Coordinate Pipeline**: Implement full `sidereal ecliptic → equatorial → horizontal → ARKit world vector` chain in `CoordinatePipeline.swift`. Validate against Stellarium for a known star (Spica/Chitra ~180° sidereal) at a specific lat/lon/time.

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
| Rahu node type | Mean node (`SE_MEAN_NODE`) | Smoother for Jyotish; true node oscillates |
| Ketu | `(Rahu + 180°) % 360` | Derived, not a SWE body |
| Positions | Topocentric (`SEFLG_TOPOCTR`) | Observer location via `swe_set_topo` |
| Rashi span | 30° | 12 × 30° = 360° |
| Nakshatra span | 13°20′ = 360/27° | 27 × 13°20′ = 360° |
| Pada span | 3°20′ = 360/108° | 4 padas per nakshatra |
| iOS target | 16+ | ARKit 6 + RealityKit 2 |