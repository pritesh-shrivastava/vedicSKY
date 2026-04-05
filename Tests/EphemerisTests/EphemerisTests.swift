import XCTest

@testable import Vedic_Skyview // replace with your module/app target name if different

final class EphemerisTests: XCTestCase {
    // Tolerance in degrees for longitude comparisons
    let tol: Double = 5e-4

    func testFixturesMatch() throws {
        // Possible locations to find the fixtures file; try several fallbacks so the test is easy to run locally.
        let candidatePaths = [
            // relative to test file when running in repository
            URL(fileURLWithPath: #file).deletingLastPathComponent().deletingLastPathComponent().appendingPathComponent("fixtures/graha_fixtures.json"),
            // project root relative (when xcode cwd == project root)
            URL(fileURLWithPath: FileManager.default.currentDirectoryPath).appendingPathComponent("Tests/fixtures/graha_fixtures.json"),
            // bundle resource (if you add fixtures to test bundle resources)
            Bundle(for: EphemerisTests.self).url(forResource: "graha_fixtures", withExtension: "json", subdirectory: "fixtures"),
        ].compactMap { $0 }

        guard let fixturesURL = candidatePaths.first(where: { FileManager.default.fileExists(atPath: $0.path) }) else {
            throw XCTSkip("graha_fixtures.json not found in expected locations; generate with scripts/export_fixtures.py")
        }

        let data = try Data(contentsOf: fixturesURL)
        let raw = try JSONSerialization.jsonObject(with: data) as? [[String:Any]]
        XCTAssertNotNil(raw)

        // Path to ephemeris data bundled in the app/tests. Update as needed.
        let ephePath = URL(fileURLWithPath: #file)
            .deletingLastPathComponent() // EphemerisTests/
            .deletingLastPathComponent() // Tests/
            .deletingLastPathComponent() // project root
            .appendingPathComponent("Resources/ephemeris")
            .path
        let engine = EphemerisEngine(ephePath: ephePath)

        for caseObj in raw ?? [] {
            guard let caseDict = caseObj["case"] as? [String:Any],
                  let rows = caseObj["rows"] as? [[String:Any]] else { continue }

            let dateStr = caseDict["date"] as? String ?? "1970-01-01"
            let timeStr = caseDict["time"] as? String ?? "00:00:00"
            let loc = caseDict["location"] as? [String:Any] ?? [:]
            let tz = loc["timezone"] as? String ?? "UTC"

            // Build Date in the provided timezone, then convert to UTC Date for the engine
            let formatter = ISO8601DateFormatter()
            formatter.formatOptions = [.withFullDate]
            // Simplest: construct DateComponents
            let dateParts = dateStr.split(separator: "-").map { Int($0) ?? 0 }
            let timeParts = timeStr.split(separator: ":").map { Int($0) ?? 0 }
            var comps = DateComponents()
            comps.year = dateParts.count > 0 ? dateParts[0] : 1970
            comps.month = dateParts.count > 1 ? dateParts[1] : 1
            comps.day = dateParts.count > 2 ? dateParts[2] : 1
            comps.hour = timeParts.count > 0 ? timeParts[0] : 0
            comps.minute = timeParts.count > 1 ? timeParts[1] : 0
            comps.second = timeParts.count > 2 ? timeParts[2] : 0
            comps.timeZone = TimeZone(identifier: tz) ?? TimeZone(secondsFromGMT: 0)

            let calendar = Calendar(identifier: .gregorian)
            guard let localDate = calendar.date(from: comps) else { continue }
            let lat = loc["latitude"] as? Double ?? 0.0
            let lon = loc["longitude"] as? Double ?? 0.0
            let alt = loc["altitude"] as? Double ?? 0.0

            let computed = engine.positions(for: localDate, latitude: lat, longitude: lon, altitude: alt)

            // Build a lookup by graha name for computed positions
            var computedByName: [String: GrahaPosition] = [:]
            for p in computed { computedByName[p.graha] = p }

            for row in rows {
                guard let graha = row["graha"] as? String,
                      let expectedSidereal = row["sidereal_lon"] as? Double,
                      let expectedTropical = row["tropical_lon"] as? Double else { continue }

                guard let comp = computedByName[graha] else {
                    XCTFail("Missing computed graha: \(graha)")
                    continue
                }

                XCTAssertEqual(comp.siderealLongitude, expectedSidereal, accuracy: tol, "sidereal lon mismatch for \(graha)")
                XCTAssertEqual(comp.tropicalLongitude, expectedTropical, accuracy: tol, "tropical lon mismatch for \(graha)")
            }
        }
    }
}
