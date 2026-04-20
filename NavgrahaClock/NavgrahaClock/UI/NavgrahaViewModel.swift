import Foundation
import CoreLocation
import Combine

struct GrahaPoint: Identifiable {
    let id = UUID()
    let name: String
    let siderealLon: Double
}

final class NavgrahaViewModel: ObservableObject {
    @Published var grahaPoints: [GrahaPoint] = []
    @Published var lagnaSidereal: Double = 0
    @Published var locationLabel: String = "Locating…"
    @Published var lastUpdate: Date = Date()
    @Published var selectedGraha: GrahaPoint? = nil
    @Published var isTimeTravelMode: Bool = false
    @Published var displayDate: Date = Date()

    private let engine = EphemerisEngine(ephePath: Bundle.main.bundlePath)
    private let locationManager = LocationHeadingManager()
    private var locationCancellable: AnyCancellable?
    private var updateTimer: Timer?

    // Fallback: Ujjain — traditional Vedic reference meridian
    private var latitude: Double = 23.1765
    private var longitude: Double = 75.7885
    private var altitude: Double = 0

    init() {
        locationCancellable = locationManager.$location
            .compactMap { $0 }
            .receive(on: DispatchQueue.main)
            .sink { [weak self] loc in
                guard let self else { return }
                self.latitude = loc.coordinate.latitude
                self.longitude = loc.coordinate.longitude
                self.altitude = loc.altitude
                self.locationLabel = self.cityLabel(lat: self.latitude, lon: self.longitude)
                self.refresh()
                self.startTimer()
            }

        // Fire immediately with fallback location so UI isn't blank
        refresh()
        startTimer()
    }

    private func startTimer() {
        guard updateTimer == nil else { return }
        updateTimer = Timer.scheduledTimer(withTimeInterval: 60, repeats: true) { [weak self] _ in
            guard let self, !self.isTimeTravelMode else { return }
            self.refresh()
        }
    }

    func setTimeTravel(to date: Date) {
        isTimeTravelMode = true
        displayDate = date
        refresh()
    }

    func returnToLive() {
        isTimeTravelMode = false
        displayDate = Date()
        refresh()
    }

    func refresh() {
        let date = isTimeTravelMode ? displayDate : Date()
        let positions = engine.positions(for: date, latitude: latitude, longitude: longitude, altitude: altitude)
        grahaPoints = positions.map { GrahaPoint(name: $0.graha, siderealLon: $0.siderealLongitude) }
        lagnaSidereal = computeLagna(date: date)
        lastUpdate = date
    }

    private func computeLagna(date: Date) -> Double {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(secondsFromGMT: 0)!
        let c = calendar.dateComponents([.year, .month, .day, .hour, .minute, .second], from: date)
        let hour = Double(c.hour ?? 0) + Double(c.minute ?? 0) / 60.0 + Double(c.second ?? 0) / 3600.0
        let jd = swe_julday(Int32(c.year ?? 2000), Int32(c.month ?? 1), Int32(c.day ?? 1), hour, Int32(SE_GREG_CAL))

        var cusps = [Double](repeating: 0, count: 13)
        var ascmc = [Double](repeating: 0, count: 10)
        // "P" = Placidus house system; ascmc[0] = Ascendant tropical longitude
        swe_houses(jd, latitude, longitude, Int32(UInt8(ascii: "P")), &cusps, &ascmc)

        let ay = swe_get_ayanamsa_ut(jd)
        return (ascmc[0] - ay + 360).truncatingRemainder(dividingBy: 360)
    }

    private func cityLabel(lat: Double, lon: Double) -> String {
        // Simple quadrant-based label — replace with CLGeocoder if desired
        return String(format: "%.2f°%@, %.2f°%@",
                      abs(lat), lat >= 0 ? "N" : "S",
                      abs(lon), lon >= 0 ? "E" : "W")
    }
}
