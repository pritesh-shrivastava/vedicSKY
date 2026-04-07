import SwiftUI

/// Celestial Sphere view — orthographic projection of the sky globe.
///
/// Matches the Stellarium "celestial sphere" style:
///   - Blue equatorial RA/Dec grid
///   - Green ecliptic great circle with degree markers
///   - White lunar orbital arc (~5.1° inclined to ecliptic)
///   - Red Rahu/Ketu tick marks at ecliptic/lunar-orbit intersections
///   - Nakshatra names along the ecliptic
///   - Graha dots at their equatorial (RA, Dec) positions
///   - "Dhruva" (North Celestial Pole) labeled at top
///
/// The sphere is oriented so that the ecliptic is tilted ~23.44° from the
/// equatorial plane, just like the real sky.
struct CelestialSphereView: View {
    @EnvironmentObject var vm: NavgrahaViewModel

    // Rotation: user can drag to spin the sphere
    @State private var rotationDeg: Double = 0   // longitude offset (degrees)
    @GestureState private var dragOffset: Double = 0

    var body: some View {
        VStack(spacing: 0) {
            GeometryReader { geo in
                let size   = geo.size
                let center = CGPoint(x: size.width / 2, y: size.height / 2)
                let radius = min(size.width, size.height) * 0.44

                let currentRotation = rotationDeg + dragOffset

                Canvas { ctx, _ in
                    drawSphereBackground(ctx, center, radius)
                    drawEquatorialGrid(ctx, center, radius, rot: currentRotation)
                    drawEcliptic(ctx, center, radius, rot: currentRotation)
                    drawLunarOrbit(ctx, center, radius, rot: currentRotation)
                    drawNakshatraLabels(ctx, center, radius, rot: currentRotation)
                    drawGrahas(ctx, center, radius, rot: currentRotation)
                    drawPoleLabel(ctx, center, radius)
                    drawSphereRim(ctx, center, radius)
                }
                .gesture(
                    DragGesture()
                        .updating($dragOffset) { value, state, _ in
                            state = value.translation.width * 0.3
                        }
                        .onEnded { value in
                            rotationDeg += value.translation.width * 0.3
                        }
                )
            }

            statusBar
                .frame(height: 44)
                .background(Color.black.opacity(0.85))
        }
        .background(Color.black)
        .ignoresSafeArea(edges: .top)
    }

    // MARK: - Orthographic projection

    /// Project equatorial (RA degrees, Dec degrees) onto the 2D canvas.
    /// rot: longitude rotation offset in degrees (for dragging).
    /// Returns nil if the point is on the back hemisphere.
    private func project(ra: Double, dec: Double, center: CGPoint, radius: CGFloat, rot: Double) -> CGPoint? {
        let raR  = ((ra + rot).truncatingRemainder(dividingBy: 360)).toRad
        let decR = dec.toRad

        // Orthographic: x = cos(dec)·sin(RA), y = -sin(dec)
        // Backface: cos(dec)·cos(RA) < 0  → behind the sphere
        let x3 =  cos(decR) * sin(raR)
        let y3 = -sin(decR)
        let z3 =  cos(decR) * cos(raR)

        guard z3 >= 0 else { return nil }   // back hemisphere hidden

        return CGPoint(
            x: center.x + CGFloat(x3) * radius,
            y: center.y + CGFloat(y3) * radius
        )
    }

    // MARK: - Drawing

    private func drawSphereBackground(_ ctx: GraphicsContext, _ center: CGPoint, _ radius: CGFloat) {
        let rect = CGRect(x: center.x - radius, y: center.y - radius,
                          width: radius * 2, height: radius * 2)
        ctx.fill(Path(ellipseIn: rect), with: .color(Color(red: 0.01, green: 0.01, blue: 0.06)))
    }

    private func drawSphereRim(_ ctx: GraphicsContext, _ center: CGPoint, _ radius: CGFloat) {
        let rect = CGRect(x: center.x - radius, y: center.y - radius,
                          width: radius * 2, height: radius * 2)
        ctx.stroke(Path(ellipseIn: rect),
                   with: .color(Color(red: 0.2, green: 0.3, blue: 0.6)),
                   lineWidth: 2)
    }

    /// Draw the equatorial RA/Dec grid — blue lines.
    private func drawEquatorialGrid(_ ctx: GraphicsContext, _ center: CGPoint, _ radius: CGFloat, rot: Double) {
        let gridColor = Color(red: 0.15, green: 0.2, blue: 0.6)

        // Declination circles: -60, -30, 0 (equator), 30, 60
        for dec in stride(from: -60.0, through: 60.0, by: 30.0) {
            var path = Path()
            var first = true
            for ra in stride(from: 0.0, through: 360.0, by: 3.0) {
                guard let pt = project(ra: ra, dec: dec, center: center, radius: radius, rot: rot) else {
                    first = true; continue
                }
                if first { path.move(to: pt); first = false } else { path.addLine(to: pt) }
            }
            ctx.stroke(path, with: .color(gridColor), lineWidth: dec == 0 ? 1.2 : 0.6)
        }

        // RA lines every 30° (2 hours)
        for ra in stride(from: 0.0, through: 330.0, by: 30.0) {
            var path = Path()
            var first = true
            for dec in stride(from: -90.0, through: 90.0, by: 3.0) {
                guard let pt = project(ra: ra, dec: dec, center: center, radius: radius, rot: rot) else {
                    first = true; continue
                }
                if first { path.move(to: pt); first = false } else { path.addLine(to: pt) }
            }
            ctx.stroke(path, with: .color(gridColor), lineWidth: 0.6)
        }
    }

    /// Draw the ecliptic great circle — green.
    private func drawEcliptic(_ ctx: GraphicsContext, _ center: CGPoint, _ radius: CGFloat, rot: Double) {
        let eclipticColor = Color(red: 0.2, green: 0.7, blue: 0.2)
        let epsilon = 23.44   // obliquity of ecliptic (degrees)

        var path = Path()
        var first = true
        for lon in stride(from: 0.0, through: 360.0, by: 2.0) {
            let (ra, dec) = eclipticToEquatorial(lambda: lon, beta: 0, epsilon: epsilon)
            guard let pt = project(ra: ra, dec: dec, center: center, radius: radius, rot: rot) else {
                first = true; continue
            }
            if first { path.move(to: pt); first = false } else { path.addLine(to: pt) }
        }
        ctx.stroke(path, with: .color(eclipticColor), lineWidth: 1.8)

        // Degree tick marks every 30° along ecliptic
        for lon in stride(from: 0.0, through: 330.0, by: 30.0) {
            let (ra, dec) = eclipticToEquatorial(lambda: lon, beta: 0, epsilon: epsilon)
            guard let pt = project(ra: ra, dec: dec, center: center, radius: radius, rot: rot) else { continue }
            let dot = CGRect(x: pt.x - 2.5, y: pt.y - 2.5, width: 5, height: 5)
            ctx.fill(Path(ellipseIn: dot), with: .color(eclipticColor))
            var t = Text("\(Int(lon))°").font(.system(size: 8)).foregroundColor(eclipticColor)
            ctx.draw(t, at: CGPoint(x: pt.x + 6, y: pt.y - 4), anchor: .leading)
        }
    }

    /// Draw the lunar orbital arc — white, inclined ~5.1° to ecliptic.
    /// Rahu longitude comes from the ViewModel.
    private func drawLunarOrbit(_ ctx: GraphicsContext, _ center: CGPoint, _ radius: CGFloat, rot: Double) {
        let epsilon     = 23.44
        let inclination = 5.145   // Moon's orbital inclination to ecliptic

        // Find Rahu's sidereal longitude from grahaPoints
        let rahuLon = vm.grahaPoints.first(where: { $0.name == "Rahu" })?.siderealLon ?? 0

        var path = Path()
        var first = true
        for i in 0...180 {
            let u = Double(i) / 180.0 * 2 * Double.pi
            let lr = rahuLon.toRad
            let inc = inclination.toRad

            // Parametric lunar orbit in ecliptic coords
            let x3 = cos(u) * cos(lr) - sin(u) * cos(inc) * sin(lr)
            let y3 = cos(u) * sin(lr) + sin(u) * cos(inc) * cos(lr)
            let z3 = sin(u) * sin(inc)

            let lonEc = atan2(y3, x3) * 180 / Double.pi
            let latEc = asin(max(-1, min(1, z3))) * 180 / Double.pi

            let (ra, dec) = eclipticToEquatorial(lambda: lonEc.truncatingRemainder(dividingBy: 360) + (lonEc < 0 ? 360 : 0),
                                                  beta: latEc, epsilon: epsilon)
            guard let pt = project(ra: ra, dec: dec, center: center, radius: radius, rot: rot) else {
                first = true; continue
            }
            if first { path.move(to: pt); first = false } else { path.addLine(to: pt) }
        }
        ctx.stroke(path, with: .color(.white.opacity(0.75)), lineWidth: 1.2)

        // Rahu marker (ascending node) — red tick
        drawNodeMarker(at: rahuLon, label: "Rahu ☊", ctx: ctx, center: center, radius: radius, rot: rot, epsilon: epsilon)
        // Ketu marker (descending node)
        let ketuLon = (rahuLon + 180).truncatingRemainder(dividingBy: 360)
        drawNodeMarker(at: ketuLon, label: "Ketu ☋", ctx: ctx, center: center, radius: radius, rot: rot, epsilon: epsilon)
    }

    private func drawNodeMarker(at lon: Double, label: String, ctx: GraphicsContext,
                                 _ center: CGPoint, _ radius: CGFloat, rot: Double, epsilon: Double) {
        let (ra, dec) = eclipticToEquatorial(lambda: lon, beta: 0, epsilon: epsilon)
        guard let pt = project(ra: ra, dec: dec, center: center, radius: radius, rot: rot) else { return }

        // Red cross tick
        let size: CGFloat = 8
        var tick = Path()
        tick.move(to: CGPoint(x: pt.x - size, y: pt.y))
        tick.addLine(to: CGPoint(x: pt.x + size, y: pt.y))
        tick.move(to: CGPoint(x: pt.x, y: pt.y - size))
        tick.addLine(to: CGPoint(x: pt.x, y: pt.y + size))
        ctx.stroke(tick, with: .color(.red), lineWidth: 2)

        var t = Text(label).font(.system(size: 8, weight: .bold)).foregroundColor(.red)
        ctx.draw(t, at: CGPoint(x: pt.x + 10, y: pt.y), anchor: .leading)
    }

    /// Draw nakshatra names along the ecliptic — green labels.
    private func drawNakshatraLabels(_ ctx: GraphicsContext, _ center: CGPoint, _ radius: CGFloat, rot: Double) {
        let epsilon = 23.44
        let span    = 360.0 / 27.0
        let nakshatraNames = [
            "Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra",
            "Punarvasu","Pushya","Ashlesha","Magha","Purva Phalguni","Uttara Phalguni",
            "Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha",
            "Mula","Purva Ashadha","Uttara Ashadha","Shravana","Dhanishtha",
            "Shatabhisha","Purva Bhadrapada","Uttara Bhadrapada","Revati",
        ]
        let labelColor = Color(red: 0.3, green: 0.8, blue: 0.4)

        for (i, name) in nakshatraNames.enumerated() {
            let midLon = Double(i) * span + span / 2
            // Place label slightly north of ecliptic (β = 4°)
            let (ra, dec) = eclipticToEquatorial(lambda: midLon, beta: 4, epsilon: epsilon)
            guard let pt = project(ra: ra, dec: dec, center: center, radius: radius, rot: rot) else { continue }

            var t = Text(name).font(.system(size: 7)).foregroundColor(labelColor)
            ctx.draw(t, at: pt, anchor: .center)
        }
    }

    /// Draw graha dots at their equatorial positions.
    private func drawGrahas(_ ctx: GraphicsContext, _ center: CGPoint, _ radius: CGFloat, rot: Double) {
        let epsilon = 23.44
        let grahaColors: [String: Color] = [
            "Surya": .yellow, "Chandra": .white, "Mangala": .red,
            "Budha": .green, "Guru": .orange, "Shukra": Color(white: 0.95),
            "Shani": .blue, "Rahu": .purple, "Ketu": .gray,
        ]

        for graha in vm.grahaPoints {
            let (ra, dec) = eclipticToEquatorial(lambda: graha.siderealLon, beta: 0, epsilon: epsilon)
            guard let pt = project(ra: ra, dec: dec, center: center, radius: radius, rot: rot) else { continue }

            let color = grahaColors[graha.name] ?? .white
            let dotR: CGFloat = graha.name == "Surya" ? 9 : (graha.name == "Chandra" ? 7 : 5)
            let dotRect = CGRect(x: pt.x - dotR, y: pt.y - dotR, width: dotR * 2, height: dotR * 2)
            ctx.fill(Path(ellipseIn: dotRect), with: .color(color))

            // Glow for Surya
            if graha.name == "Surya" {
                let glowRect = CGRect(x: pt.x - 14, y: pt.y - 14, width: 28, height: 28)
                ctx.fill(Path(ellipseIn: glowRect), with: .color(Color.yellow.opacity(0.15)))
            }

            var t = Text(graha.name).font(.system(size: 9, weight: .semibold)).foregroundColor(color)
            ctx.draw(t, at: CGPoint(x: pt.x, y: pt.y - dotR - 6), anchor: .center)
        }
    }

    /// Label the North Celestial Pole at the top of the sphere.
    private func drawPoleLabel(_ ctx: GraphicsContext, _ center: CGPoint, _ radius: CGFloat) {
        // NCP is at Dec = +90, always at top regardless of rotation
        let polePt = CGPoint(x: center.x, y: center.y - radius)
        let dot = CGRect(x: polePt.x - 3, y: polePt.y - 3, width: 6, height: 6)
        ctx.fill(Path(ellipseIn: dot), with: .color(.white))
        var t = Text("Dhruva ✦").font(.system(size: 9, weight: .medium)).foregroundColor(.white)
        ctx.draw(t, at: CGPoint(x: polePt.x, y: polePt.y - 12), anchor: .center)
    }

    // MARK: - Status bar

    private var statusBar: some View {
        HStack(spacing: 12) {
            Image(systemName: "location.fill")
                .font(.caption2)
                .foregroundColor(Color(red: 0.3, green: 0.8, blue: 0.8))
            Text(vm.locationLabel)
                .font(.caption2)
                .foregroundColor(Color(red: 0.5, green: 0.5, blue: 0.7))

            Spacer()

            Image(systemName: "hand.draw")
                .font(.caption2)
                .foregroundColor(.gray)
            Text("Drag to rotate")
                .font(.caption2)
                .foregroundColor(.gray)

            Button {
                vm.refresh()
            } label: {
                Image(systemName: "arrow.clockwise")
                    .font(.caption)
                    .foregroundColor(Color(red: 1.0, green: 0.8, blue: 0.0))
            }
        }
        .padding(.horizontal, 16)
    }
}

// MARK: - Double helper (local to this file, avoids redeclaration)

private extension Double {
    var toRad: Double { self * .pi / 180.0 }
}
