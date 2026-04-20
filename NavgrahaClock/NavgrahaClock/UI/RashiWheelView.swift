import SwiftUI

// MARK: - Rashi reference data

private let rashis: [(name: String, symbol: String, startDeg: Double)] = [
    ("Mesha",     "🐏",   0), ("Vrishabha", "🐂",  30),
    ("Mithuna",   "👯",  60), ("Karkata",   "🦀",  90),
    ("Simha",     "🦁", 120), ("Kanya",     "👩", 150),
    ("Tula",      "⚖️", 180), ("Vrischika", "🦂", 210),
    ("Dhanu",     "🏹", 240), ("Makara",    "🐐", 270),
    ("Kumbha",    "💧", 300), ("Mina",      "🐟", 330),
]

private let nakshatraNames: [String] = [
    "Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra",
    "Punarvasu","Pushya","Ashlesha","Magha","Purva Phalguni","Uttara Phalguni",
    "Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha",
    "Mula","Purva Ashadha","Uttara Ashadha","Shravana","Dhanishtha",
    "Shatabhisha","Purva Bhadrapada","Uttara Bhadrapada","Revati",
]

// MARK: - Graha color map

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

// MARK: - Palette constants

private let eclipticGreen    = Color(red: 0.2, green: 0.6, blue: 0.2)
private let nakshatraGreen   = Color(red: 0.2, green: 0.4, blue: 0.2)
private let constellationRed = Color(red: 0.8, green: 0.1, blue: 0.1)
private let rashiCyan        = Color(red: 0.3, green: 0.8, blue: 0.8)
private let grahaLabelGray   = Color(red: 0.5, green: 0.5, blue: 0.7)
private let lagnaGold        = Color(red: 1.0, green: 0.8, blue: 0.0)

// MARK: - Projection helpers

private extension Double {
    var toRad: Double { self * .pi / 180.0 }
}

/// Convert sidereal longitude + ecliptic latitude to screen point on the wheel.
/// lon: sidereal longitude in degrees (0 = Mesha = 3-o'clock; increases counter-clockwise)
/// lat: ecliptic latitude in degrees (positive = north of ecliptic = inward on wheel)
/// center / radius: geometry of the ecliptic circle
private func project(lon: Double, lat: Double = 0, center: CGPoint, radius: CGFloat) -> CGPoint {
    let angle = -lon.toRad              // counter-clockwise, 0° at right
    let r = radius - CGFloat(lat) * (radius / 45.0)
    return CGPoint(
        x: center.x + r * cos(angle),
        y: center.y + r * sin(angle)
    )
}

// MARK: - RashiWheelView

struct RashiWheelView: View {
    @EnvironmentObject var vm: NavgrahaViewModel
    @State private var showTimeTravelSheet = false

    var body: some View {
        VStack(spacing: 0) {
            GeometryReader { geo in
                let size = geo.size
                let center = CGPoint(x: size.width / 2, y: size.height / 2)
                let radius = min(size.width, size.height) * 0.40

                Canvas { ctx, _ in
                    drawNakshatraLines(ctx, center, radius)
                    drawRashiLines(ctx, center, radius)
                    drawEclipticCircle(ctx, center, radius)
                    drawConstellations(ctx, center, radius)
                    drawRashiLabels(ctx, center, radius, size)
                    drawNakshatraLabels(ctx, center, radius)
                    drawLagna(ctx, center, radius)
                    drawGrahas(ctx, center, radius)
                }
                .background(Color.black)
                .onTapGesture { location in
                    hitTestGraha(at: location, center: center, radius: radius)
                }
            }

            statusBar
                .frame(height: 44)
                .background(Color.black.opacity(0.85))
        }
        .background(Color.black)
        .ignoresSafeArea(edges: .top)
        .sheet(isPresented: $showTimeTravelSheet) {
            TimeTravelSheet()
                .environmentObject(vm)
        }
    }

    private func hitTestGraha(at location: CGPoint, center: CGPoint, radius: CGFloat) {
        let threshold: CGFloat = 25
        var best: (GrahaPoint, CGFloat)? = nil
        for g in vm.grahaPoints {
            let pt = project(lon: g.siderealLon, lat: 0, center: center, radius: radius)
            let d = hypot(location.x - pt.x, location.y - pt.y)
            if d < threshold, best == nil || d < best!.1 {
                best = (g, d)
            }
        }
        if let (g, _) = best {
            vm.selectedGraha = g
        }
    }

    // MARK: - Drawing

    private func drawNakshatraLines(_ ctx: GraphicsContext, _ center: CGPoint, _ radius: CGFloat) {
        let span = 360.0 / 27.0
        var path = Path()
        for i in 0..<27 {
            let lon = Double(i) * span
            let inner = project(lon: lon, lat: 0, center: center, radius: radius * 0.85)
            let outer = project(lon: lon, lat: 0, center: center, radius: radius * 1.15)
            path.move(to: inner)
            path.addLine(to: outer)
        }
        ctx.stroke(path, with: .color(nakshatraGreen), lineWidth: 0.5)
    }

    private func drawRashiLines(_ ctx: GraphicsContext, _ center: CGPoint, _ radius: CGFloat) {
        var path = Path()
        for i in 0..<12 {
            let lon = Double(i) * 30.0
            let inner = project(lon: lon, lat: 0, center: center, radius: radius * 0.70)
            let outer = project(lon: lon, lat: 0, center: center, radius: radius * 1.20)
            path.move(to: inner)
            path.addLine(to: outer)
        }
        ctx.stroke(path, with: .color(eclipticGreen), lineWidth: 1.0)
    }

    private func drawEclipticCircle(_ ctx: GraphicsContext, _ center: CGPoint, _ radius: CGFloat) {
        let rect = CGRect(x: center.x - radius, y: center.y - radius,
                          width: radius * 2, height: radius * 2)
        ctx.stroke(Path(ellipseIn: rect), with: .color(eclipticGreen), lineWidth: 2.5)
    }

    private func drawConstellations(_ ctx: GraphicsContext, _ center: CGPoint, _ radius: CGFloat) {
        for constellation in zodiacConstellations {
            let pts = constellation.stars.map { star in
                project(lon: star.siderealLon, lat: star.eclipticLat, center: center, radius: radius)
            }
            var path = Path()
            for (a, b) in constellation.lines {
                guard a < pts.count, b < pts.count else { continue }
                path.move(to: pts[a])
                path.addLine(to: pts[b])
            }
            ctx.stroke(path, with: .color(constellationRed), lineWidth: 1.2)

            // Small dot at each star
            for pt in pts {
                let dot = Path(ellipseIn: CGRect(x: pt.x - 2, y: pt.y - 2, width: 4, height: 4))
                ctx.fill(dot, with: .color(constellationRed.opacity(0.7)))
            }
        }
    }

    private func drawRashiLabels(_ ctx: GraphicsContext, _ center: CGPoint, _ radius: CGFloat, _ size: CGSize) {
        let labelRadius = radius * 1.35
        for rashi in rashis {
            let midLon = rashi.startDeg + 15.0
            let pt = project(lon: midLon, lat: 0, center: center, radius: labelRadius)

            // Sanskrit name
            let nameText = Text(rashi.name).font(.system(size: 10, weight: .medium)).foregroundColor(rashiCyan)
            ctx.draw(nameText, at: pt, anchor: .center)

            // Symbol below name
            let symbolPt = CGPoint(x: pt.x, y: pt.y + 14)
            var symText = Text(rashi.symbol).font(.system(size: 13))
            ctx.draw(symText, at: symbolPt, anchor: .center)
        }
    }

    private func drawNakshatraLabels(_ ctx: GraphicsContext, _ center: CGPoint, _ radius: CGFloat) {
        let span = 360.0 / 27.0
        let labelRadius = radius * 0.74
        for (i, name) in nakshatraNames.enumerated() {
            let midLon = Double(i) * span + span / 2.0
            let angle = -midLon.toRad
            let pt = project(lon: midLon, lat: 0, center: center, radius: labelRadius)

            ctx.drawLayer { layerCtx in
                layerCtx.translateBy(x: pt.x, y: pt.y)
                // Rotate label to be tangential to the wheel
                layerCtx.rotate(by: Angle(radians: angle - .pi / 2))
                let t = Text(name).font(.system(size: 7)).foregroundColor(grahaLabelGray)
                layerCtx.draw(t, at: .zero, anchor: .center)
            }
        }
    }

    private func drawLagna(_ ctx: GraphicsContext, _ center: CGPoint, _ radius: CGFloat) {
        guard vm.lagnaSidereal > 0 || !vm.grahaPoints.isEmpty else { return }
        let pt = project(lon: vm.lagnaSidereal, lat: 0, center: center, radius: radius)

        // Draw an upward-pointing triangle
        let size: CGFloat = 10
        let angle = -vm.lagnaSidereal.toRad
        // Triangle points: tip outward, base inward
        let tip    = CGPoint(x: pt.x + size * cos(angle),   y: pt.y + size * sin(angle))
        let left   = CGPoint(x: pt.x + size * cos(angle + 2.3), y: pt.y + size * sin(angle + 2.3))
        let right  = CGPoint(x: pt.x + size * cos(angle - 2.3), y: pt.y + size * sin(angle - 2.3))

        var tri = Path()
        tri.move(to: tip)
        tri.addLine(to: left)
        tri.addLine(to: right)
        tri.closeSubpath()
        ctx.fill(tri, with: .color(lagnaGold))

        // Label
        let labelPt = project(lon: vm.lagnaSidereal, lat: 0, center: center, radius: radius * 0.88)
        let t = Text("Lagna").font(.system(size: 8, weight: .bold)).foregroundColor(lagnaGold)
        ctx.draw(t, at: labelPt, anchor: .center)
    }

    private func drawGrahas(_ ctx: GraphicsContext, _ center: CGPoint, _ radius: CGFloat) {
        let dotRadius: CGFloat = 6
        for graha in vm.grahaPoints {
            let pt = project(lon: graha.siderealLon, lat: 0, center: center, radius: radius)
            let color = grahaColors[graha.name] ?? .white

            // Dot
            let dotRect = CGRect(x: pt.x - dotRadius, y: pt.y - dotRadius,
                                 width: dotRadius * 2, height: dotRadius * 2)
            ctx.fill(Path(ellipseIn: dotRect), with: .color(color))

            // Label — offset inward (toward center)
            let labelPt = project(lon: graha.siderealLon, lat: 0, center: center, radius: radius * 0.85)
            let t = Text(graha.name).font(.system(size: 8, weight: .semibold)).foregroundColor(grahaLabelGray)
            ctx.draw(t, at: labelPt, anchor: .center)
        }
    }

    // MARK: - Status bar

    private var statusBar: some View {
        HStack(spacing: 10) {
            Image(systemName: "location.fill")
                .font(.caption2)
                .foregroundColor(rashiCyan)
            Text(vm.locationLabel)
                .font(.caption2)
                .foregroundColor(grahaLabelGray)
                .lineLimit(1)

            Spacer()

            if vm.isTimeTravelMode {
                Text(vm.displayDate, style: .date)
                    .font(.caption2.bold())
                    .foregroundColor(lagnaGold)
                Button("Live") { vm.returnToLive() }
                    .font(.caption2.bold())
                    .foregroundColor(.green)
            } else {
                Image(systemName: "clock")
                    .font(.caption2)
                    .foregroundColor(rashiCyan)
                Text(vm.lastUpdate, style: .time)
                    .font(.caption2)
                    .foregroundColor(grahaLabelGray)
            }

            Button {
                showTimeTravelSheet = true
            } label: {
                Image(systemName: vm.isTimeTravelMode ? "calendar.badge.clock" : "calendar")
                    .font(.caption)
                    .foregroundColor(vm.isTimeTravelMode ? lagnaGold : rashiCyan)
            }

            Button {
                vm.refresh()
            } label: {
                Image(systemName: "arrow.clockwise")
                    .font(.caption)
                    .foregroundColor(lagnaGold)
            }
        }
        .padding(.horizontal, 16)
    }
}
