import SwiftUI

struct ContentView: View {
    @StateObject private var vm = NavgrahaViewModel()

    var body: some View {
        TabView {
            RashiWheelView()
                .tabItem { Label("Chakra", systemImage: "circle") }

            CelestialSphereView()
                .tabItem { Label("Sphere", systemImage: "globe") }

            NorthIndianKundaliView()
                .tabItem { Label("North", systemImage: "square.grid.2x2") }

            SouthIndianKundaliView()
                .tabItem { Label("South", systemImage: "tablecells") }
        }
        .environmentObject(vm)
        .background(Color.black)
        .preferredColorScheme(.dark)
    }
}
