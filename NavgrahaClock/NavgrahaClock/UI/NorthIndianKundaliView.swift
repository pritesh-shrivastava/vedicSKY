import SwiftUI

/// North Indian Kundali — house-fixed diamond grid.
///
/// Layout: House 1 is always in the top-center triangle.
/// Signs rotate so that the Lagna sign occupies house 1.
///
///           ┌─────────┬─────────┐
///           │  12  ╲  │  ╱  1  │
///      ┌────┼─────────┼─────────┼────┐
///      │ 11 │         │         │  2 │
///      ├────┤  Center │  Center ├────┤
///      │ 10 │         │         │  3 │
///      └────┼─────────┼─────────┼────┘
///           │  9   ╱  │  ╲  4  │
///           └─────────┴─────────┘
///                  8   5
///           ┌─────────┬─────────┐
///           │  7   ╲  │  ╱  6  │  (repeated bottom two)
///           └─────────┴─────────┘
///
/// Actual layout is a 3×3 diamond with 12 triangular/trapezoidal cells.
struct NorthIndianKundaliView: View {
    @EnvironmentObject var vm: NavgrahaViewModel

    private let rashiNames = [
        "Mesha","Vrishabha","Mithuna","Karkata",
        "Simha","Kanya","Tula","Vrischika",
        "Dhanu","Makara","Kumbha","Mina",
    ]

    // Lagna rashi index (0-based)
    private var lagnaRashi: Int {
        Int(vm.lagnaSidereal / 30.0) % 12
    }

    // For house N (1-based), which rashi index occupies it?
    private func rashiForHouse(_ house: Int) -> Int {
        (lagnaRashi + house - 1) % 12
    }

    // Which grahas are in a given house?
    private func grahasInHouse(_ house: Int) -> [String] {
        let rashi = rashiForHouse(house)
        return vm.grahaPoints.filter { Int($0.siderealLon / 30.0) % 12 == rashi }.map(\.name)
    }

    // Lagna house = 1
    private func isLagnaHouse(_ house: Int) -> Bool { house == 1 }

    var body: some View {
        GeometryReader { geo in
            let size  = geo.size
            let w     = min(size.width, size.height) * 0.92
            let left  = (size.width  - w) / 2
            let top   = (size.height - w) / 2
            let frame = CGRect(x: left, y: top, width: w, height: w)

            ZStack {
                Color.black
                northGrid(frame: frame)
                northLabels(frame: frame)
            }
        }
        .background(Color.black)
        .ignoresSafeArea(edges: .top)
    }

    // MARK: - Grid drawing

    private func northGrid(frame: CGRect) -> some View {
        Canvas { ctx, _ in
            let color  = Color(red: 0.3, green: 0.5, blue: 0.3)
            let stroke = GraphicsContext.Shading.color(color)

            let x = frame.minX, y = frame.minY
            let w = frame.width, h = frame.height
            let mx = x + w / 2, my = y + h / 2

            // Outer square
            ctx.stroke(Path(frame), with: stroke, lineWidth: 1.5)

            // Inner square (rotated 45° = diamond)
            var diamond = Path()
            diamond.move(to:    CGPoint(x: mx, y: y))        // top
            diamond.addLine(to: CGPoint(x: x + w, y: my))   // right
            diamond.addLine(to: CGPoint(x: mx, y: y + h))   // bottom
            diamond.addLine(to: CGPoint(x: x, y: my))       // left
            diamond.closeSubpath()
            ctx.stroke(diamond, with: stroke, lineWidth: 1.5)

            // Cross lines through center
            func line(_ a: CGPoint, _ b: CGPoint) {
                var p = Path(); p.move(to: a); p.addLine(to: b)
                ctx.stroke(p, with: stroke, lineWidth: 1.0)
            }
            // Horizontal and vertical through center
            line(CGPoint(x: x, y: my), CGPoint(x: x + w, y: my))
            line(CGPoint(x: mx, y: y), CGPoint(x: mx, y: y + h))

            // Diagonal lines connecting outer corners to inner diamond corners
            // Top-left quadrant diagonals
            line(CGPoint(x: x, y: y),      CGPoint(x: mx, y: my))
            line(CGPoint(x: x + w, y: y),  CGPoint(x: mx, y: my))
            line(CGPoint(x: x, y: y + h),  CGPoint(x: mx, y: my))
            line(CGPoint(x: x + w, y: y + h), CGPoint(x: mx, y: my))
        }
    }

    // MARK: - House labels

    private func northLabels(frame: CGRect) -> some View {
        // Centroids of the 12 houses in the North Indian layout
        // House 1 = top triangle, 2 = top-right trapezoid, etc.
        let x = frame.minX, y = frame.minY
        let w = frame.width, h = frame.height
        let mx = x + w / 2, my = y + h / 2
        let q  = w / 4   // quarter

        // House centroid positions (approximate, tuned visually)
        let centroids: [CGPoint] = [
            CGPoint(x: mx,       y: y + q * 0.7),    // 1  top
            CGPoint(x: mx + q,   y: y + q * 1.0),    // 2  top-right
            CGPoint(x: x + w - q * 0.7, y: my),      // 3  right-top
            CGPoint(x: mx + q,   y: my + q * 1.0),   // 4  bottom-right
            CGPoint(x: mx,       y: y + h - q * 0.7),// 5  bottom
            CGPoint(x: mx - q,   y: my + q * 1.0),   // 6  bottom-left
            CGPoint(x: x + q * 0.7, y: my),           // 7  left-bottom
            CGPoint(x: mx - q,   y: y + q * 1.0),    // 8  top-left
            CGPoint(x: mx - q * 0.5, y: my - q * 0.5),// 9 inner-left
            CGPoint(x: mx,       y: my - q * 0.3),   // 10 inner-top
            CGPoint(x: mx + q * 0.5, y: my - q * 0.5),// 11 inner-right
            CGPoint(x: mx,       y: my + q * 0.3),   // 12 inner-bottom (unused slot)
        ]

        return ZStack {
            ForEach(0..<12, id: \.self) { i in
                let house   = i + 1
                let rashi   = rashiForHouse(house)
                let grahas  = grahasInHouse(house)
                let isLagna = isLagnaHouse(house)
                let center  = centroids[i]

                VStack(spacing: 1) {
                    // Rashi abbreviation
                    Text(String(rashiNames[rashi].prefix(3)))
                        .font(.system(size: 9, weight: .medium))
                        .foregroundColor(Color(red: 0.3, green: 0.8, blue: 0.8))
                    // House number
                    Text("\(house)")
                        .font(.system(size: 8))
                        .foregroundColor(isLagna ? Color(red:1,green:0.8,blue:0) : Color(red:0.5,green:0.5,blue:0.7))
                    // Grahas
                    ForEach(grahas, id: \.self) { g in
                        Text(abbreviate(g))
                            .font(.system(size: 8, weight: .bold))
                            .foregroundColor(grahaColor(g))
                    }
                }
                .position(center)
            }
        }
    }

    private func abbreviate(_ graha: String) -> String {
        switch graha {
        case "Surya": return "Su"
        case "Chandra": return "Mo"
        case "Mangala": return "Ma"
        case "Budha": return "Bu"
        case "Guru": return "Ju"
        case "Shukra": return "Ve"
        case "Shani": return "Sa"
        case "Rahu": return "Ra"
        case "Ketu": return "Ke"
        default: return String(graha.prefix(2))
        }
    }

    private func grahaColor(_ name: String) -> Color {
        switch name {
        case "Surya": return .yellow
        case "Chandra": return .white
        case "Mangala": return .red
        case "Budha": return .green
        case "Guru": return .orange
        case "Shukra": return Color(white: 0.9)
        case "Shani": return .blue
        case "Rahu": return .purple
        case "Ketu": return .gray
        default: return .white
        }
    }
}
