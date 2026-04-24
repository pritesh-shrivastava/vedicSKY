import Foundation
import simd

// MARK: - Double helpers

extension Double {
    var toRadians: Double { self * .pi / 180.0 }
    var toDegrees: Double { self * 180.0 / .pi }

    /// Modulo that always returns a non-negative result (like Python's % operator).
    func mod(_ m: Double) -> Double {
        let r = self.truncatingRemainder(dividingBy: m)
        return r < 0 ? r + m : r
    }
}

// MARK: - Ecliptic → Equatorial

/// Convert sidereal ecliptic coordinates to equatorial (RA / Dec).
///
/// - Parameters:
///   - lambda: Ecliptic longitude in degrees (0–360), sidereal.
///   - beta:   Ecliptic latitude in degrees (−90…+90).
///   - epsilon: Obliquity of the ecliptic in degrees (~23.44° near J2000).
/// - Returns: Right ascension and declination in degrees.
///   RA is in [0, 360); Dec is in (−90, +90].
func eclipticToEquatorial(lambda: Double, beta: Double, epsilon: Double)
    -> (ra: Double, dec: Double)
{
    let λ = lambda.toRadians
    let β = beta.toRadians
    let ε = epsilon.toRadians

    let sinDec = sin(β) * cos(ε) + cos(β) * sin(ε) * sin(λ)
    let dec = asin(sinDec)

    let y = sin(λ) * cos(ε) - tan(β) * sin(ε)
    let x = cos(λ)
    let ra = atan2(y, x)  // result in (−π, +π]

    return (ra: ra.toDegrees.mod(360), dec: dec.toDegrees)
}

// MARK: - Equatorial → Horizontal

/// Convert equatorial coordinates to local horizontal (Altitude / Azimuth).
///
/// - Parameters:
///   - ra:        Right ascension in degrees (0–360).
///   - dec:       Declination in degrees.
///   - latitude:  Observer geodetic latitude in degrees (North positive).
///   - lst:       Local Sidereal Time in degrees (0–360).
/// - Returns: Altitude (−90…+90°) and azimuth (0–360°, measured N→E).
func equatorialToHorizontal(ra: Double, dec: Double,
                             latitude: Double, lst: Double)
    -> (altitude: Double, azimuth: Double)
{
    let H  = (lst - ra).mod(360).toRadians   // Hour Angle
    let δ  = dec.toRadians
    let φ  = latitude.toRadians

    let sinAlt = sin(δ) * sin(φ) + cos(δ) * cos(φ) * cos(H)
    let altitude = asin(max(-1.0, min(1.0, sinAlt)))

    // Azimuth: atan2(−sin H · cos δ,  sin δ − sin alt · sin φ) / (cos alt · cos φ)
    let cosAlt = cos(altitude)
    let numerator   = -sin(H) * cos(δ)
    let denominator: Double
    if cosAlt < 1e-10 {
        // Object is at or very near zenith; azimuth is ill-defined — return 0.
        return (altitude.toDegrees, 0.0)
    } else {
        denominator = (sin(δ) - sin(altitude) * sin(φ)) / (cosAlt * cos(φ))
    }
    let azimuth = atan2(numerator, denominator)

    return (altitude.toDegrees, azimuth.toDegrees.mod(360))
}

// MARK: - Horizontal → ARKit world vector

/// Convert horizontal coordinates to a unit vector in ARKit world space.
///
/// ARKit frame with `.gravityAndHeading`:
///   +X = East,  +Y = Up,  −Z = North
///
/// - Parameters:
///   - altitude: Elevation angle in degrees (−90…+90).
///   - azimuth:  Azimuth in degrees (0 = North, 90 = East, measured clockwise).
/// - Returns: Unit vector on the sky sphere.
///   Multiply by sky-sphere radius (e.g. 1000) before placing a RealityKit entity.
func altAzToARVector(altitude: Double, azimuth: Double) -> SIMD3<Float> {
    let altR = Float(altitude.toRadians)
    let azR  = Float(azimuth.toRadians)

    let x =  sin(azR) * cos(altR)   // East  (+X)
    let y =  sin(altR)               // Up    (+Y)
    let z = -cos(azR) * cos(altR)   // North (−Z in ARKit)

    return SIMD3<Float>(x, y, z)
}
