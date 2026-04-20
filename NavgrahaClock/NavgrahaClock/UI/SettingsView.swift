import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var vm: NavgrahaViewModel

    private let grahaList: [(String, Color)] = [
        ("Surya",   .yellow),
        ("Chandra", .white),
        ("Mangala", .red),
        ("Budha",   .green),
        ("Guru",    .orange),
        ("Shukra",  Color(white: 0.85)),
        ("Shani",   .blue),
        ("Rahu",    .purple),
        ("Ketu",    .gray),
    ]

    var body: some View {
        NavigationView {
            List {
                Section("Location") {
                    infoRow("Position", vm.locationLabel)
                }

                Section("Ephemeris") {
                    infoRow("Ayanamsha",    "Lahiri (Chitrapaksha)")
                    infoRow("Node type",    "Mean Rahu (SE_MEAN_NODE)")
                    infoRow("House system", "Placidus")
                    infoRow("Positions",    "Topocentric (SEFLG_TOPOCTR)")
                    infoRow("Data range",   "1900 – 2100")
                }

                Section("Updates") {
                    infoRow("Live interval", "60 sec")
                    HStack {
                        Text("Last computed")
                        Spacer()
                        Text(vm.lastUpdate, style: .time)
                            .foregroundColor(.secondary)
                    }
                    if vm.isTimeTravelMode {
                        HStack {
                            Text("Time-travel date")
                            Spacer()
                            Text(vm.displayDate, style: .date)
                                .foregroundColor(Color(red: 1.0, green: 0.8, blue: 0.0))
                        }
                    }
                }

                Section("Graha Colors") {
                    ForEach(grahaList, id: \.0) { name, color in
                        HStack(spacing: 10) {
                            Circle()
                                .fill(color)
                                .frame(width: 12, height: 12)
                            Text(name)
                        }
                    }
                }
            }
            .scrollContentBackground(.hidden)
            .background(Color.black)
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
        }
    }

    private func infoRow(_ label: String, _ value: String) -> some View {
        HStack {
            Text(label)
            Spacer()
            Text(value).foregroundColor(.secondary)
        }
    }
}
