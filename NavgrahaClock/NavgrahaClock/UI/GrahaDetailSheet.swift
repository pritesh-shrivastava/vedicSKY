import SwiftUI

private let rashiNames = [
    "Mesha", "Vrishabha", "Mithuna", "Karkata",
    "Simha", "Kanya", "Tula", "Vrischika",
    "Dhanu", "Makara", "Kumbha", "Mina",
]

private let nakshatraNames: [String] = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
    "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
    "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishtha",
    "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati",
]

private let grahaColors: [String: Color] = [
    "Surya":   .yellow,
    "Chandra": .white,
    "Mangala": .red,
    "Budha":   .green,
    "Guru":    .orange,
    "Shukra":  Color(white: 0.95),
    "Shani":   .blue,
    "Rahu":    .purple,
    "Ketu":    .gray,
]

struct GrahaDetailSheet: View {
    let graha: GrahaPoint

    private static let nakshatraSpan = 360.0 / 27.0
    private static let padaSpan      = 360.0 / 108.0

    private var rashiIndex: Int        { Int(graha.siderealLon / 30.0) % 12 }
    private var degreesInRashi: Double { graha.siderealLon.truncatingRemainder(dividingBy: 30.0) }
    private var nakshatraIndex: Int    { Int(graha.siderealLon / Self.nakshatraSpan) % 27 }
    private var pada: Int              { Int(graha.siderealLon.truncatingRemainder(dividingBy: Self.nakshatraSpan) / Self.padaSpan) + 1 }
    private var degInNakshatra: Double { graha.siderealLon.truncatingRemainder(dividingBy: Self.nakshatraSpan) }
    private var color: Color           { grahaColors[graha.name] ?? .white }

    private let labelColor = Color(red: 0.5, green: 0.5, blue: 0.7)

    var body: some View {
        VStack(spacing: 20) {
            Text(graha.name)
                .font(.title.bold())
                .foregroundColor(color)
                .padding(.top, 24)

            Grid(alignment: .leading, horizontalSpacing: 20, verticalSpacing: 12) {
                GridRow {
                    Text("Sidereal Lon")
                        .font(.subheadline).foregroundColor(labelColor)
                        .gridColumnAlignment(.trailing)
                    Text(String(format: "%.4f°", graha.siderealLon))
                        .font(.subheadline.monospacedDigit()).foregroundColor(.white)
                }
                GridRow {
                    Text("Rashi")
                        .font(.subheadline).foregroundColor(labelColor)
                        .gridColumnAlignment(.trailing)
                    Text("\(rashiNames[rashiIndex])  (\(rashiIndex + 1))")
                        .font(.subheadline).foregroundColor(.white)
                }
                GridRow {
                    Text("In Rashi")
                        .font(.subheadline).foregroundColor(labelColor)
                        .gridColumnAlignment(.trailing)
                    Text(String(format: "%.2f°", degreesInRashi))
                        .font(.subheadline.monospacedDigit()).foregroundColor(.white)
                }
                GridRow {
                    Text("Nakshatra")
                        .font(.subheadline).foregroundColor(labelColor)
                        .gridColumnAlignment(.trailing)
                    Text("\(nakshatraNames[nakshatraIndex])  (pada \(pada))")
                        .font(.subheadline).foregroundColor(.white)
                }
                GridRow {
                    Text("In Nakshatra")
                        .font(.subheadline).foregroundColor(labelColor)
                        .gridColumnAlignment(.trailing)
                    Text(String(format: "%.2f°", degInNakshatra))
                        .font(.subheadline.monospacedDigit()).foregroundColor(.white)
                }
            }
            .padding(.horizontal, 32)

            Spacer()
        }
        .frame(maxWidth: .infinity)
        .background(Color.black)
        .presentationDetents([.medium])
        .presentationDragIndicator(.visible)
    }
}
