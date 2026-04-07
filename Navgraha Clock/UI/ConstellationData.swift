import Foundation

/// A single star in a constellation, positioned by sidereal ecliptic coordinates.
/// siderealLon: Lahiri sidereal longitude (degrees, J2000.0 tropical − 23.85°)
/// eclipticLat: ecliptic latitude β (degrees; positive = north of ecliptic)
struct ConstellationStar {
    let siderealLon: Double
    let eclipticLat: Double
}

/// A zodiac constellation's stick figure — a set of stars and the lines connecting them.
struct ZodiacConstellation {
    let name: String
    let stars: [ConstellationStar]
    let lines: [(Int, Int)]   // pairs of star indices to connect with a line
}

/// Hardcoded sidereal ecliptic coordinates for key stars in each zodiac constellation.
/// Tropical J2000.0 coordinates converted to Lahiri sidereal by subtracting ~23.85°.
/// Accuracy: ±1–2° (sufficient for visual stick figures on the wheel).
let zodiacConstellations: [ZodiacConstellation] = [

    // MESHA (Aries) — Ram — sidereal 0°–30°
    ZodiacConstellation(name: "Mesha", stars: [
        ConstellationStar(siderealLon:  4.3, eclipticLat:  9.9),  // Hamal (α Ari)
        ConstellationStar(siderealLon:  1.7, eclipticLat:  8.5),  // Sheratan (β Ari)
        ConstellationStar(siderealLon:  1.2, eclipticLat:  7.8),  // Mesarthim (γ Ari)
        ConstellationStar(siderealLon: 12.5, eclipticLat:  2.5),  // 41 Ari
    ], lines: [(2,1),(1,0),(0,3)]),

    // VRISHABHA (Taurus) — Bull — sidereal 30°–60°
    ZodiacConstellation(name: "Vrishabha", stars: [
        ConstellationStar(siderealLon: 41.2, eclipticLat: -5.5),  // Aldebaran (α Tau)
        ConstellationStar(siderealLon: 36.7, eclipticLat:  4.0),  // Elnath (β Tau)
        ConstellationStar(siderealLon: 33.0, eclipticLat: -3.0),  // θ Tau (Pleiades group)
        ConstellationStar(siderealLon: 44.7, eclipticLat: -4.0),  // ε Tau
        ConstellationStar(siderealLon: 46.1, eclipticLat: -5.8),  // δ Tau
        ConstellationStar(siderealLon: 48.5, eclipticLat: -2.0),  // ζ Tau (tip of horn)
    ], lines: [(2,0),(0,3),(3,4),(0,1),(1,5)]),

    // MITHUNA (Gemini) — Twins — sidereal 60°–90°
    ZodiacConstellation(name: "Mithuna", stars: [
        ConstellationStar(siderealLon: 75.3, eclipticLat:  6.7),  // Pollux (β Gem)
        ConstellationStar(siderealLon: 72.5, eclipticLat:  9.9),  // Castor (α Gem)
        ConstellationStar(siderealLon: 68.2, eclipticLat:  1.0),  // Alhena (γ Gem)
        ConstellationStar(siderealLon: 66.9, eclipticLat:  0.2),  // Wasat (δ Gem)
        ConstellationStar(siderealLon: 64.7, eclipticLat: -7.0),  // Mebsuda (ε Gem)
        ConstellationStar(siderealLon: 62.0, eclipticLat:-10.0),  // Tejat Posterior (μ Gem)
    ], lines: [(5,4),(4,3),(3,2),(2,0),(0,1),(1,3)]),

    // KARKATA (Cancer) — Crab — sidereal 90°–120°
    ZodiacConstellation(name: "Karkata", stars: [
        ConstellationStar(siderealLon: 96.7, eclipticLat:  0.0),  // Asellus Australis (δ Cnc)
        ConstellationStar(siderealLon: 95.3, eclipticLat:  3.2),  // Asellus Borealis (γ Cnc)
        ConstellationStar(siderealLon: 89.3, eclipticLat: -5.0),  // Acubens (α Cnc)
        ConstellationStar(siderealLon:103.8, eclipticLat:  5.0),  // Altarf (β Cnc)
        ConstellationStar(siderealLon:104.5, eclipticLat: -1.5),  // ι Cnc
    ], lines: [(2,0),(0,1),(1,3),(3,4)]),

    // SIMHA (Leo) — Lion — sidereal 120°–150°
    ZodiacConstellation(name: "Simha", stars: [
        ConstellationStar(siderealLon: 125.8, eclipticLat:  0.5),  // Regulus (α Leo)
        ConstellationStar(siderealLon: 153.5, eclipticLat: 14.0),  // Denebola (β Leo)
        ConstellationStar(siderealLon: 142.0, eclipticLat:  9.8),  // Algieba (γ Leo)
        ConstellationStar(siderealLon: 138.5, eclipticLat:  5.2),  // Zosma (δ Leo)
        ConstellationStar(siderealLon: 129.3, eclipticLat:  9.2),  // Adhafera (ζ Leo)
        ConstellationStar(siderealLon: 128.0, eclipticLat: 11.5),  // Rasalas (μ Leo)
        ConstellationStar(siderealLon: 130.2, eclipticLat: 15.0),  // ε Leo
    ], lines: [(0,4),(4,5),(5,6),(6,2),(2,3),(3,1),(2,0)]),

    // KANYA (Virgo) — Maiden — sidereal 150°–180°
    ZodiacConstellation(name: "Kanya", stars: [
        ConstellationStar(siderealLon: 176.3, eclipticLat: -2.1),  // Spica (α Vir)
        ConstellationStar(siderealLon: 158.2, eclipticLat:  8.6),  // Zavijava (β Vir)
        ConstellationStar(siderealLon: 166.9, eclipticLat:  1.5),  // Porrima (γ Vir)
        ConstellationStar(siderealLon: 169.4, eclipticLat:  5.0),  // δ Vir
        ConstellationStar(siderealLon: 172.2, eclipticLat: 10.5),  // Vindemiatrix (ε Vir)
        ConstellationStar(siderealLon: 178.5, eclipticLat: -8.5),  // ζ Vir
    ], lines: [(1,3),(3,4),(3,2),(2,0),(0,5)]),

    // TULA (Libra) — Scales — sidereal 180°–210°
    ZodiacConstellation(name: "Tula", stars: [
        ConstellationStar(siderealLon: 185.8, eclipticLat:  0.7),  // Zubenelgenubi (α Lib)
        ConstellationStar(siderealLon: 188.7, eclipticLat:  8.9),  // Zubeneschamali (β Lib)
        ConstellationStar(siderealLon: 194.3, eclipticLat: -2.1),  // Zubenelakrab (γ Lib)
        ConstellationStar(siderealLon: 200.1, eclipticLat:  1.6),  // υ Lib
    ], lines: [(0,1),(0,2),(2,3),(1,3)]),

    // VRISCHIKA (Scorpius) — Scorpion — sidereal 210°–240°
    ZodiacConstellation(name: "Vrischika", stars: [
        ConstellationStar(siderealLon: 215.5, eclipticLat: -4.6),  // Antares (α Sco)
        ConstellationStar(siderealLon: 210.2, eclipticLat:  1.0),  // Graffias (β Sco)
        ConstellationStar(siderealLon: 211.8, eclipticLat: -1.6),  // δ Sco
        ConstellationStar(siderealLon: 213.5, eclipticLat: -2.8),  // π Sco
        ConstellationStar(siderealLon: 220.3, eclipticLat: -6.0),  // τ Sco
        ConstellationStar(siderealLon: 226.5, eclipticLat:-13.0),  // ε Sco
        ConstellationStar(siderealLon: 232.0, eclipticLat:-15.5),  // Shaula (λ Sco)
        ConstellationStar(siderealLon: 234.1, eclipticLat:-13.0),  // Lesath (υ Sco)
    ], lines: [(1,2),(2,3),(3,0),(0,4),(4,5),(5,6),(6,7)]),

    // DHANU (Sagittarius) — Archer — sidereal 240°–270°
    ZodiacConstellation(name: "Dhanu", stars: [
        ConstellationStar(siderealLon: 246.8, eclipticLat: -6.5),  // Kaus Australis (ε Sgr)
        ConstellationStar(siderealLon: 244.7, eclipticLat: -2.3),  // Kaus Media (δ Sgr)
        ConstellationStar(siderealLon: 243.7, eclipticLat:  3.5),  // Kaus Borealis (λ Sgr)
        ConstellationStar(siderealLon: 252.7, eclipticLat: -3.4),  // Nunki (σ Sgr)
        ConstellationStar(siderealLon: 248.0, eclipticLat:  2.0),  // φ Sgr
        ConstellationStar(siderealLon: 239.5, eclipticLat: -4.2),  // Alnasl (γ Sgr)
    ], lines: [(5,1),(1,2),(1,0),(0,3),(3,4),(4,2)]),

    // MAKARA (Capricornus) — Sea-Goat — sidereal 270°–300°
    ZodiacConstellation(name: "Makara", stars: [
        ConstellationStar(siderealLon: 277.5, eclipticLat: -7.5),  // Algedi (α Cap)
        ConstellationStar(siderealLon: 278.3, eclipticLat: -4.5),  // Dabih (β Cap)
        ConstellationStar(siderealLon: 288.7, eclipticLat: -2.1),  // Nashira (γ Cap)
        ConstellationStar(siderealLon: 291.3, eclipticLat: -2.5),  // Deneb Algedi (δ Cap)
        ConstellationStar(siderealLon: 283.0, eclipticLat: -4.0),  // ζ Cap
        ConstellationStar(siderealLon: 279.5, eclipticLat:-10.5),  // θ Cap
    ], lines: [(0,1),(1,5),(5,4),(4,3),(3,2),(2,1)]),

    // KUMBHA (Aquarius) — Water-Bearer — sidereal 300°–330°
    ZodiacConstellation(name: "Kumbha", stars: [
        ConstellationStar(siderealLon: 302.0, eclipticLat:  8.7),  // Sadalmelik (α Aqr)
        ConstellationStar(siderealLon: 304.1, eclipticLat: -9.0),  // Sadalsuud (β Aqr)
        ConstellationStar(siderealLon: 309.5, eclipticLat: -1.4),  // Sadachbia (γ Aqr)
        ConstellationStar(siderealLon: 313.8, eclipticLat: -1.6),  // Skat (δ Aqr)
        ConstellationStar(siderealLon: 317.5, eclipticLat:-10.0),  // ε Aqr
        ConstellationStar(siderealLon: 298.4, eclipticLat: -6.0),  // ζ Aqr
    ], lines: [(5,1),(1,0),(1,2),(2,3),(3,4)]),

    // MINA (Pisces) — Fish — sidereal 330°–360°
    ZodiacConstellation(name: "Mina", stars: [
        ConstellationStar(siderealLon: 355.3, eclipticLat:  9.2),  // Alrescha (α Psc)
        ConstellationStar(siderealLon: 340.5, eclipticLat:  3.6),  // β Psc
        ConstellationStar(siderealLon: 336.5, eclipticLat:  5.8),  // γ Psc
        ConstellationStar(siderealLon: 348.7, eclipticLat:  7.5),  // η Psc
        ConstellationStar(siderealLon: 352.0, eclipticLat: 12.0),  // ω Psc
        ConstellationStar(siderealLon: 342.0, eclipticLat: -8.5),  // ν Psc (south fish)
    ], lines: [(2,1),(1,5),(2,3),(3,4),(4,0),(0,3)]),
]
