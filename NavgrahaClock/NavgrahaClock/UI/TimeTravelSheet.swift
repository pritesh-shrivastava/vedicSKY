import SwiftUI

struct TimeTravelSheet: View {
    @EnvironmentObject var vm: NavgrahaViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var selectedDate = Date()

    private let minDate = Calendar.current.date(from: DateComponents(year: 1900, month: 1, day: 1))!
    private let maxDate = Calendar.current.date(from: DateComponents(year: 2100, month: 12, day: 31))!

    var body: some View {
        NavigationView {
            VStack(spacing: 24) {
                DatePicker(
                    "Date & Time",
                    selection: $selectedDate,
                    in: minDate...maxDate,
                    displayedComponents: [.date, .hourAndMinute]
                )
                .datePickerStyle(.graphical)
                .colorScheme(.dark)
                .padding(.horizontal)

                HStack(spacing: 16) {
                    Button("Back to Live") {
                        vm.returnToLive()
                        dismiss()
                    }
                    .buttonStyle(.bordered)
                    .foregroundColor(.green)

                    Button("Set Time") {
                        vm.setTimeTravel(to: selectedDate)
                        dismiss()
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(Color(red: 0.4, green: 0.3, blue: 0.0))
                    .foregroundColor(Color(red: 1.0, green: 0.8, blue: 0.0))
                }
                .padding(.horizontal)

                Spacer()
            }
            .navigationTitle("Time Travel")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
            .background(Color.black)
        }
        .onAppear {
            selectedDate = vm.isTimeTravelMode ? vm.displayDate : Date()
        }
    }
}
