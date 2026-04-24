import XCTest
@testable import NavgrahaClock

final class CoordinateTests: XCTestCase {

    // ──────────────────────────────────────────────────────────────
    // MARK: - Double extensions
    // ──────────────────────────────────────────────────────────────

    func testToRadians() {
        XCTAssertEqual((180.0).toRadians, Double.pi,  accuracy: 1e-10)
        XCTAssertEqual(( 90.0).toRadians, Double.pi / 2, accuracy: 1e-10)
        XCTAssertEqual((  0.0).toRadians, 0.0, accuracy: 1e-10)
    }

    func testToDegrees() {
        XCTAssertEqual(Double.pi.toDegrees,       180.0, accuracy: 1e-10)
        XCTAssertEqual((Double.pi / 2).toDegrees,  90.0, accuracy: 1e-10)
    }

    func testMod_positiveInput() {
        XCTAssertEqual((370.0).mod(360), 10.0, accuracy: 1e-10)
        XCTAssertEqual((360.0).mod(360),  0.0, accuracy: 1e-10)
        XCTAssertEqual(( 45.0).mod(360), 45.0, accuracy: 1e-10)
    }

    func testMod_negativeInput() {
        // Negative modulo must return a positive result (Python % behaviour)
        XCTAssertEqual((-10.0).mod(360), 350.0, accuracy: 1e-10)
        XCTAssertEqual((-360.0).mod(360),  0.0, accuracy: 1e-10)
    }

    // ──────────────────────────────────────────────────────────────
    // MARK: - Julian Day
    // ──────────────────────────────────────────────────────────────

    func testJulianDayJ2000Noon() {
        // J2000.0 epoch: 2000-01-01 12:00:00 UTC → JD = 2451545.0 (exact)
        var comps = DateComponents()
        comps.year = 2000; comps.month = 1; comps.day = 1
        comps.hour = 12;   comps.minute = 0; comps.second = 0
        comps.timeZone = TimeZone(secondsFromGMT: 0)
        let date = Calendar(identifier: .gregorian).date(from: comps)!

        XCTAssertEqual(julianDayUT(from: date), 2_451_545.0, accuracy: 1e-6)
    }

    func testJulianDayJ2000Midnight() {
        // 2000-01-01 00:00:00 UTC → JD = 2451544.5
        var comps = DateComponents()
        comps.year = 2000; comps.month = 1; comps.day = 1
        comps.hour = 0;    comps.minute = 0; comps.second = 0
        comps.timeZone = TimeZone(secondsFromGMT: 0)
        let date = Calendar(identifier: .gregorian).date(from: comps)!

        XCTAssertEqual(julianDayUT(from: date), 2_451_544.5, accuracy: 1e-6)
    }

    // ──────────────────────────────────────────────────────────────
    // MARK: - GMST / LST
    // ──────────────────────────────────────────────────────────────

    func testGMSTAtJ2000() {
        // IAU 1982: GMST at J2000.0 noon = 280.46061837° (constant term of the polynomial)
        let gmst = greenwichMeanSiderealTime(julianDate: 2_451_545.0)
        XCTAssertEqual(gmst, 280.46061837, accuracy: 1e-4)
    }

    func testLSTAddsLongitude() {
        let jd = 2_451_545.0
        let lon = 75.7885   // Ujjain longitude
        let gmst = greenwichMeanSiderealTime(julianDate: jd)
        let lst  = localSiderealTime(julianDate: jd, longitude: lon)
        XCTAssertEqual(lst, (gmst + lon).mod(360), accuracy: 1e-10)
    }

    func testLSTIsNormalized() {
        // Result must always be in [0, 360)
        let lst = localSiderealTime(julianDate: 2_451_545.0, longitude: -200.0)
        XCTAssertGreaterThanOrEqual(lst, 0.0)
        XCTAssertLessThan(lst, 360.0)
    }

    // ──────────────────────────────────────────────────────────────
    // MARK: - Ecliptic → Equatorial
    // ──────────────────────────────────────────────────────────────

    func testEclipticToEquatorial_VernalEquinox() {
        // λ = 0°, β = 0° → RA = 0°, Dec = 0° (always, for any ε)
        let (ra, dec) = eclipticToEquatorial(lambda: 0, beta: 0, epsilon: 23.4393)
        XCTAssertEqual(ra,  0.0, accuracy: 1e-10)
        XCTAssertEqual(dec, 0.0, accuracy: 1e-10)
    }

    func testEclipticToEquatorial_SummerSolstice() {
        // λ = 90°, β = 0° → RA = 90°, Dec = ε
        let eps = 23.4393
        let (ra, dec) = eclipticToEquatorial(lambda: 90, beta: 0, epsilon: eps)
        XCTAssertEqual(ra,  90.0, accuracy: 1e-6)
        XCTAssertEqual(dec, eps,  accuracy: 1e-6)
    }

    func testEclipticToEquatorial_WinterSolstice() {
        // λ = 270°, β = 0° → RA = 270°, Dec = -ε
        let eps = 23.4393
        let (ra, dec) = eclipticToEquatorial(lambda: 270, beta: 0, epsilon: eps)
        XCTAssertEqual(ra,  270.0, accuracy: 1e-6)
        XCTAssertEqual(dec, -eps,  accuracy: 1e-6)
    }

    func testEclipticToEquatorial_Spica() {
        // Spica (α Vir) J2000 tropical ecliptic: λ ≈ 203.876°, β ≈ -2.052°
        // Expected equatorial: RA ≈ 201.30°, Dec ≈ -11.16°
        let (ra, dec) = eclipticToEquatorial(lambda: 203.876, beta: -2.052, epsilon: 23.4393)
        XCTAssertEqual(ra,  201.30, accuracy: 0.05)
        XCTAssertEqual(dec, -11.16, accuracy: 0.05)
    }

    func testEclipticToEquatorial_RAIsNormalized() {
        // RA must always be in [0, 360)
        for lambda in stride(from: 0.0, through: 350.0, by: 50.0) {
            let (ra, _) = eclipticToEquatorial(lambda: lambda, beta: 0, epsilon: 23.44)
            XCTAssertGreaterThanOrEqual(ra, 0.0,   "RA < 0 at λ=\(lambda)")
            XCTAssertLessThan(ra, 360.0,            "RA ≥ 360 at λ=\(lambda)")
        }
    }

    // ──────────────────────────────────────────────────────────────
    // MARK: - Equatorial → Horizontal
    // ──────────────────────────────────────────────────────────────

    func testEquatorialToHorizontal_ObjectOnMeridianDueNorth() {
        let (alt, az) = equatorialToHorizontal(ra: 0, dec: 30, latitude: 0, lst: 0)
        XCTAssertEqual(alt, 60.0, accuracy: 1e-6)
        XCTAssertEqual(az,  0.0,  accuracy: 1e-6)
    }

    func testEquatorialToHorizontal_ObjectOnMeridianDueSouth() {
        let (alt, az) = equatorialToHorizontal(ra: 0, dec: -30, latitude: 0, lst: 0)
        XCTAssertEqual(alt,  60.0, accuracy: 1e-6)
        XCTAssertEqual(az,  180.0, accuracy: 1e-6)
    }

    func testEquatorialToHorizontal_ObjectOnCelestialEquatorRising() {
        let lat = 45.0
        let (alt, _) = equatorialToHorizontal(ra: 0, dec: 0, latitude: lat, lst: 90)
        XCTAssertEqual(alt, 0.0, accuracy: 1e-6)
    }

    func testEquatorialToHorizontal_AltIsInRange() {
        let testCases: [(ra: Double, dec: Double, lat: Double, lst: Double)] = [
            (0, 0, 0, 0), (45, 20, 51.5, 100), (200, -30, -33.9, 250)
        ]
        for tc in testCases {
            let (alt, _) = equatorialToHorizontal(ra: tc.ra, dec: tc.dec,
                                                   latitude: tc.lat, lst: tc.lst)
            XCTAssertGreaterThanOrEqual(alt, -90.0)
            XCTAssertLessThanOrEqual(alt,    90.0)
        }
    }

    func testEquatorialToHorizontal_AzIsNormalized() {
        let (_, az) = equatorialToHorizontal(ra: 180, dec: -20, latitude: 35, lst: 90)
        XCTAssertGreaterThanOrEqual(az, 0.0)
        XCTAssertLessThan(az, 360.0)
    }

    // ──────────────────────────────────────────────────────────────
    // MARK: - Alt/Az → ARKit vector
    // ──────────────────────────────────────────────────────────────

    func testAltAzToARVector_Zenith() {
        let v = altAzToARVector(altitude: 90, azimuth: 0)
        XCTAssertEqual(v.x, 0, accuracy: 1e-6)
        XCTAssertEqual(v.y, 1, accuracy: 1e-6)
        XCTAssertEqual(v.z, 0, accuracy: 1e-6)
    }

    func testAltAzToARVector_NorthHorizon() {
        let v = altAzToARVector(altitude: 0, azimuth: 0)
        XCTAssertEqual(v.x,  0, accuracy: 1e-6)
        XCTAssertEqual(v.y,  0, accuracy: 1e-6)
        XCTAssertEqual(v.z, -1, accuracy: 1e-6)
    }

    func testAltAzToARVector_EastHorizon() {
        let v = altAzToARVector(altitude: 0, azimuth: 90)
        XCTAssertEqual(v.x,  1, accuracy: 1e-6)
        XCTAssertEqual(v.y,  0, accuracy: 1e-6)
        XCTAssertEqual(v.z,  0, accuracy: 1e-6)
    }

    func testAltAzToARVector_SouthHorizon() {
        let v = altAzToARVector(altitude: 0, azimuth: 180)
        XCTAssertEqual(v.x,  0, accuracy: 1e-6)
        XCTAssertEqual(v.y,  0, accuracy: 1e-6)
        XCTAssertEqual(v.z,  1, accuracy: 1e-6)
    }

    func testAltAzToARVector_IsUnitVector() {
        let cases: [(alt: Double, az: Double)] = [
            (45, 45), (0, 180), (90, 0), (-30, 270)
        ]
        for c in cases {
            let v = altAzToARVector(altitude: c.alt, azimuth: c.az)
            let len = sqrt(v.x*v.x + v.y*v.y + v.z*v.z)
            XCTAssertEqual(Double(len), 1.0, accuracy: 1e-6,
                           "Not a unit vector for alt=\(c.alt) az=\(c.az)")
        }
    }

    // ──────────────────────────────────────────────────────────────
    // MARK: - Stellarium cross-check (Spica at J2000.0 from Greenwich)
    // ──────────────────────────────────────────────────────────────

    /// Cross-check: Spica (α Vir) altitude and azimuth at J2000.0 epoch
    /// as seen from Greenwich (lat 51.4779°N, lon 0°).
    ///
    /// Expected values (verify manually in Stellarium):
    ///   Date/time : 2000-01-01 12:00:00 UT
    ///   Location  : Greenwich Observatory  51.4779°N  0.0°E
    ///   Object    : Spica (α Virginis)
    ///   Expected  : Alt ≈ −2.0°,  Az ≈ 255°  (below SW horizon)
    func testSpicaAltAzAtJ2000Greenwich() {
        let spicaLambda = 203.876   // tropical ecliptic longitude, degrees
        let spicaBeta   = -2.052    // ecliptic latitude, degrees
        let epsilon     = 23.4393   // obliquity at J2000

        let (ra, dec) = eclipticToEquatorial(lambda: spicaLambda, beta: spicaBeta, epsilon: epsilon)

        let jd  = 2_451_545.0
        let lat = 51.4779
        let lon = 0.0
        let lst = localSiderealTime(julianDate: jd, longitude: lon)

        let (alt, az) = equatorialToHorizontal(ra: ra, dec: dec, latitude: lat, lst: lst)

        XCTAssertEqual(alt, -2.093, accuracy: 0.1, "Spica altitude mismatch")
        XCTAssertEqual(az, 254.632, accuracy: 0.5, "Spica azimuth mismatch")
    }
}
