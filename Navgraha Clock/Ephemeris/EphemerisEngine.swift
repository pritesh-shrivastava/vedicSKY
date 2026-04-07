import Foundation

// NOTE: This file is a scaffold for the Swift wrapper around Swiss Ephemeris C API.
// Requirements (do these in your Xcode project):
//  - Add swisseph C sources to the project and compile them into the target.
//  - Create a bridging header that includes `swephexp.h` so the C symbols are visible from Swift.
//  - Add the ephemeris data files to your app/test bundle and pass the path to `EphemerisEngine`.

public struct GrahaPosition {
    public let graha: String
    public let tropicalLongitude: Double
    public let siderealLongitude: Double
    public let julianDay: Double
    public let ayanamsha: Double
}

public final class EphemerisEngine {
    private let ephePath: String

    // Mapping of Graha English names to Swiss Ephemeris integer IDs.
    // Ensure the bridging header exposes SE_SUN etc. from `swephexp.h`.
    private static let sweIds: [String: Int32] = [
        "Surya": Int32(SE_SUN),
        "Chandra": Int32(SE_MOON),
        "Mangala": Int32(SE_MARS),
        "Budha": Int32(SE_MERCURY),
        "Guru": Int32(SE_JUPITER),
        "Shukra": Int32(SE_VENUS),
        "Shani": Int32(SE_SATURN),
        "Rahu": Int32(SE_MEAN_NODE),  // SE_MEAN_NODE = 10, matches Python swe.MEAN_NODE = 10
        // Ketu is computed as Rahu + 180°
    ]

    public init(ephePath: String) {
        self.ephePath = ephePath
        // set ephemeris path for the C library
        swe_set_ephe_path(ephePath)
        // default to Lahiri sidereal mode as in Python reference
        swe_set_sid_mode(SE_SIDM_LAHIRI, 0, 0)
    }

    /// Compute topocentric positions for the canonical grahas for a given UTC `date` and observer location.
    /// - Parameters:
    ///   - date: Date in UTC (best to pass a Date created with Calendar/TimeZone UTC)
    ///   - latitude: observer latitude (deg)
    ///   - longitude: observer longitude (deg)
    ///   - altitude: observer altitude (meters)
    /// - Returns: array of `GrahaPosition` in the same order as the `grahaOrder` array below.
    public func positions(for date: Date, latitude: Double, longitude: Double, altitude: Double) -> [GrahaPosition] {
        // Convert Date -> UTC components
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(secondsFromGMT: 0)!
        let comps = calendar.dateComponents([.year, .month, .day, .hour, .minute, .second], from: date)
        let year = Int32(comps.year ?? 1970)
        let month = Int32(comps.month ?? 1)
        let day = Int32(comps.day ?? 1)
        let hour = Double((comps.hour ?? 0)) + Double((comps.minute ?? 0))/60.0 + Double((comps.second ?? 0))/3600.0

        // Compute Julian Day using C API. The exact swe function signature may vary; adjust if needed.
        let jdUt = swe_julday(Int32(year), Int32(month), Int32(day), hour, Int32(SE_GREG_CAL))

        // set topocentric location
        swe_set_topo(longitude, latitude, altitude)

        // ayanamsha
        let ay = swe_get_ayanamsa_ut(jdUt)

        var results: [GrahaPosition] = []

        // Calculate nodes first (Rahu), so we can compute Ketu
        var rahuTropical: Double = 0.0
        var ketuTropical: Double = 0.0

        // helper to call swe_calc_ut for a given body id
        func calcBody(_ id: Int32) -> Double {
            var xx = [Double](repeating: 0.0, count: 6)
            // serr buffer
            var serr = [CChar](repeating: 0, count: 256)
            // SEFLG_TOPOCTR is expected to be available via bridging header
            swe_calc_ut(jdUt, id, Int32(SEFLG_TOPOCTR), &xx, &serr)
            return xx[0]
        }

        if let rahuId = EphemerisEngine.sweIds["Rahu"] {
            rahuTropical = calcBody(rahuId) .truncatingRemainder(dividingBy: 360.0)
            ketuTropical = fmod(rahuTropical + 180.0, 360.0)
        }

        // canonical order matching Python reference
        let grahaOrder = ["Surya","Chandra","Mangala","Budha","Guru","Shukra","Shani","Rahu","Ketu"]

        for graha in grahaOrder {
            var tropicalLon: Double
            if graha == "Ketu" {
                tropicalLon = ketuTropical
            } else if graha == "Rahu" {
                tropicalLon = rahuTropical
            } else if let id = EphemerisEngine.sweIds[graha] {
                tropicalLon = calcBody(id).truncatingRemainder(dividingBy: 360.0)
            } else {
                tropicalLon = 0.0
            }

            let siderealLon = fmod(tropicalLon - ay + 360.0, 360.0)

            let pos = GrahaPosition(
                graha: graha,
                tropicalLongitude: tropicalLon,
                siderealLongitude: siderealLon,
                julianDay: jdUt,
                ayanamsha: ay
            )
            results.append(pos)
        }

        return results
    }
}
