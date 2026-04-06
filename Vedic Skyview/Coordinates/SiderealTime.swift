import Foundation

// MARK: - Julian Date

/// Convert a UTC `Date` to a Julian Day Number (UT).
///
/// Uses the same algorithm as Swiss Ephemeris `swe_julday` (proleptic Gregorian calendar).
func julianDayUT(from date: Date) -> Double {
    var cal = Calendar(identifier: .gregorian)
    cal.timeZone = TimeZone(secondsFromGMT: 0)!
    let c = cal.dateComponents([.year, .month, .day, .hour, .minute, .second, .nanosecond], from: date)

    let Y = Double(c.year ?? 2000)
    let M = Double(c.month ?? 1)
    let D = Double(c.day ?? 1)
    let h = Double(c.hour ?? 0)
        + Double(c.minute ?? 0) / 60.0
        + Double(c.second ?? 0) / 3600.0
        + Double(c.nanosecond ?? 0) / 3_600_000_000_000.0

    // Standard JD formula (valid for Gregorian dates after 1582-10-15)
    let A = floor((14 - M) / 12)
    let y = Y + 4800 - A
    let m = M + 12 * A - 3

    let JDN = D + floor((153 * m + 2) / 5) + 365 * y
            + floor(y / 4) - floor(y / 100) + floor(y / 400) - 32045

    return JDN + (h - 12.0) / 24.0   // noon correction: JD epoch is noon
}

// MARK: - Greenwich Mean Sidereal Time

/// Compute Greenwich Mean Sidereal Time (GMST) for a given Julian Day (UT).
///
/// Uses the IAU 1982 polynomial (same formula used by most planetarium software):
///
///   GMST (degrees) = 280.46061837
///                  + 360.98564736629 × D
///                  + 0.000387933 × T²
///                  − T³ / 38710000
///
/// where D = JD − 2451545.0 (days since J2000.0) and T = D / 36525 (Julian centuries).
///
/// - Parameter julianDate: Julian Day (UT).
/// - Returns: GMST in degrees, normalised to [0, 360).
func greenwichMeanSiderealTime(julianDate jd: Double) -> Double {
    let D = jd - 2_451_545.0          // days since J2000.0
    let T = D / 36_525.0              // Julian centuries

    let gmst = 280.46061837
           + 360.98564736629 * D
           + 0.000387933 * T * T
           - (T * T * T) / 38_710_000.0

    return gmst.mod(360)
}

// MARK: - Local Sidereal Time

/// Compute Local Sidereal Time (LST) for an observer at a given geographic longitude.
///
/// - Parameters:
///   - julianDate: Julian Day (UT).
///   - longitude:  Observer longitude in degrees (East positive).
/// - Returns: LST in degrees, normalised to [0, 360).
func localSiderealTime(julianDate: Double, longitude: Double) -> Double {
    let gmst = greenwichMeanSiderealTime(julianDate: julianDate)
    return (gmst + longitude).mod(360)
}
