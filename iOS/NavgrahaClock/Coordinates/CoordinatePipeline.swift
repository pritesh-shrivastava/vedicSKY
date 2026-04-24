import Foundation
import simd

/// Full coordinate transformation chain:
///
///   Sidereal Ecliptic (λ, β)
///     → eclipticToEquatorial(ε)   → (RA, Dec)
///     → equatorialToHorizontal    → (Alt, Az)
///     → altAzToARVector           → SIMD3<Float> unit vector
///
/// Obliquity ε is queried from Swiss Ephemeris (SE_ECL_NUT) at the
/// Julian Day stored in the `GrahaPosition`, so it is time-accurate.
public struct CoordinatePipeline {

    // MARK: - Public API

    /// Convert a graha's sidereal ecliptic position into an ARKit world-space unit vector.
    ///
    /// - Parameters:
    ///   - position:  Output from `EphemerisEngine.positions(for:latitude:longitude:altitude:)`.
    ///   - latitude:  Observer geodetic latitude in degrees (North positive).
    ///   - longitude: Observer geodetic longitude in degrees (East positive).
    /// - Returns: Unit vector in ARKit world space (`.gravityAndHeading` frame).
    ///   Multiply by sky-sphere radius (e.g. 1000) before placing a RealityKit entity.
    public func toARVector(position: GrahaPosition,
                           latitude: Double,
                           longitude: Double) -> SIMD3<Float>
    {
        let (alt, az) = toHorizontal(position: position, latitude: latitude, longitude: longitude)
        return altAzToARVector(altitude: alt, azimuth: az)
    }

    /// Intermediate step: sidereal ecliptic → (Altitude, Azimuth) in degrees.
    ///
    /// Useful for unit tests and for Stellarium cross-checks.
    public func toHorizontal(position: GrahaPosition,
                              latitude: Double,
                              longitude: Double) -> (altitude: Double, azimuth: Double)
    {
        let jd = position.julianDay

        // Step 0 — obliquity of the ecliptic from Swiss Ephemeris.
        let epsilon = obliquity(julianDay: jd)

        // Step 1 — Ecliptic → Equatorial.
        // GrahaPosition carries sidereal longitude; ecliptic latitude β is 0° for
        // the nodes (Rahu/Ketu) and very small for other bodies. EphemerisEngine
        // currently only exposes longitude, so β = 0 is the correct default.
        // When ecliptic latitude is added to GrahaPosition, pass it here.
        let (ra, dec) = eclipticToEquatorial(
            lambda: position.siderealLongitude,
            beta:   0.0,
            epsilon: epsilon
        )

        // Step 2 — Equatorial → Horizontal.
        let lst = localSiderealTime(julianDate: jd, longitude: longitude)
        return equatorialToHorizontal(ra: ra, dec: dec, latitude: latitude, lst: lst)
    }

    // MARK: - Obliquity

    /// Query the true obliquity of the ecliptic (ε) from Swiss Ephemeris.
    ///
    /// `swe_calc_ut` with body `SE_ECL_NUT` returns:
    ///   xx[0] = true obliquity (nutation applied)
    ///   xx[1] = mean obliquity
    ///
    /// We use true obliquity for higher accuracy.
    /// Falls back to the IAU mean-obliquity polynomial if the C call fails.
    private func obliquity(julianDay jd: Double) -> Double {
        var xx = [Double](repeating: 0, count: 6)
        var serr = [CChar](repeating: 0, count: 256)
        let rc = swe_calc_ut(jd, Int32(SE_ECL_NUT), 0, &xx, &serr)
        if rc >= 0 {
            return xx[0]   // true obliquity in degrees
        }
        // Fallback: IAU mean obliquity polynomial (error < 1″ near J2000)
        let T = (jd - 2_451_545.0) / 36_525.0
        return 23.439291111
             - 0.013004167 * T
             - 0.000000164 * T * T
             + 0.000000504 * T * T * T
    }
}
