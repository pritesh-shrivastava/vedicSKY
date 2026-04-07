import SwiftUI

/// South Indian Kundali — sign-fixed rectangular grid.
///
/// Rashis always occupy the same cells; house numbers rotate based on Lagna.
///
///   ┌──────┬──────┬──────┬──────┐
///   │ Mina │Mesha │Vrish │Mithu │   row 0
///   ├──────┼──────┴──────┼──────┤
///   │Kumbha│             │Karka │   row 1
///   ├──────┤   (center)  ├──────┤
///   │Makara│             │Simha │   row 2
///   ├──────┼──────┬──────┼──────┤
///   │Dhanu │Vrish │Tula  │Kanya │   row 3
///   └──────┴──────┴──────┴──────┘
///    col 0   col 1  col 2  col 3
///
/// The 4 inner corner cells of the 4×4 grid are empty (center area).
struct SouthIndianKundaliView: View {
    @EnvironmentObject var vm: NavgrahaViewModel

    // Fixed rashi assignment for each of the 12 outer cells.
    // Encoded as (row, col) → rashiIndex (0 = Mesha)
    // Layout: top row L→R: Mina(11), Mesha(0), Vrishabha(1), Mithuna(2)
    //         right col T→B: Karkata(3), Simha(4)
    //         bottom row R→L: Kanya(5), Tula(6), Vrischika(7), Dhanu(8)
    //         left col B→T: Makara(9), Kumbha(10)
    private let cells: [(row: Int, col: Int, rashi: Int)] = [
        (0, 0, 11), (0, 1,  0), (0, 2,  1), (0, 3,  2),  // top row
        (1, 3,  3),                                         // right col top
        (2, 3,  4),                                         // right col bottom
        (3, 3,  5), (3, 2,  6), (3, 1,  7), (3, 0,  8),  // bottom row
        (2, 0,  9),                                         // left col bottom
        (1, 0, 10),                                         // left col top
    ]

    private let rashiNames = [
        "Mesha","Vrishabha","Mithuna","Karkata",
        "Simha","Kanya","Tula","Vrischika",
        "Dhanu","Makara","Kumbha","Mina",
    ]
    private let rashiSymbols = [
        "🐏","🐂","👯","🦀","🦁","👩","⚖️","🦂","🏹","🐐","💧","🐟",
    ]

    private var lagnaRashi: Int { Int(vm.lagnaSidereal / 30.0) % 12 }

    private func houseForRashi(_ rashi: Int) -> Int {
        (rashi - lagnaRashi + 12) % 12 + 1
    }

    private func grahasInRashi(_ rashi: Int) -> [String] {
        vm.grahaPoints.filter { Int($0.siderealLon / 30.0) % 12 == rashi }.map(\.name)
    }

    var body: some View {
        GeometryReader { geo in
            let size = geo.size
            let gridSize = min(size.width, size.height) * 0.95
            let cellSize = gridSize / 4
            let left = (size.width  - gridSize) / 2
            let top  = (size.height - gridSize) / 2

            ZStack {
                Color.black

                // Grid lines
                Canvas { ctx, _ in
                    let gridColor = Color(red: 0.3, green: 0.5, blue: 0.3)
                    let stroke = GraphicsContext.Shading.color(gridColor)

                    // Outer border
                    let outerRect = CGRect(x: left, y: top, width: gridSize, height: gridSize)
                    ctx.stroke(Path(outerRect), with: stroke, lineWidth: 1.5)

                    // 4×4 grid lines
                    for i in 1..<4 {
                        let x = left + CGFloat(i) * cellSize
                        var p = Path()
                        p.move(to: CGPoint(x: x, y: top))
                        p.addLine(to: CGPoint(x: x, y: top + gridSize))
                        ctx.stroke(p, with: stroke, lineWidth: 1.0)

                        let y = top + CGFloat(i) * cellSize
                        var h = Path()
                        h.move(to: CGPoint(x: left, y: y))
                        h.addLine(to: CGPoint(x: left + gridSize, y: y))
                        ctx.stroke(h, with: stroke, lineWidth: 1.0)
                    }

                    // Inner 2×2 center box (merges the 4 inner cells)
                    let innerRect = CGRect(x: left + cellSize, y: top + cellSize,
                                          width: cellSize * 2, height: cellSize * 2)
                    ctx.fill(Path(innerRect), with: .color(Color(red: 0.05, green: 0.05, blue: 0.1)))
                    ctx.stroke(Path(innerRect), with: stroke, lineWidth: 1.5)
                }

                // Cell labels
                ForEach(cells, id: \.rashi) { cell in
                    cellView(cell: cell, left: left, top: top, cellSize: cellSize)
                }

                // Center label
                Text("Navgraha\nClock")
                    .font(.system(size: 10, weight: .medium))
                    .multilineTextAlignment(.center)
                    .foregroundColor(Color(red: 0.3, green: 0.5, blue: 0.3))
                    .position(x: left + gridSize / 2, y: top + gridSize / 2)
            }
        }
        .background(Color.black)
        .ignoresSafeArea(edges: .top)
    }

    @ViewBuilder
    private func cellView(cell: (row: Int, col: Int, rashi: Int),
                          left: CGFloat, top: CGFloat, cellSize: CGFloat) -> some View {
        let cx = left + CGFloat(cell.col) * cellSize + cellSize / 2
        let cy = top  + CGFloat(cell.row) * cellSize + cellSize / 2
        let rashi   = cell.rashi
        let house   = houseForRashi(rashi)
        let grahas  = grahasInRashi(rashi)
        let isLagna = house == 1
        let houseColor: Color = isLagna ? Color(red: 1, green: 0.8, blue: 0) : Color(red: 0.5, green: 0.5, blue: 0.7)

        VStack(spacing: 1) {
            Text("\(house)")
                .font(.system(size: 9, weight: .bold))
                .foregroundColor(houseColor)
            HStack(spacing: 1) {
                Text(rashiSymbols[rashi])
                    .font(.system(size: 11))
                Text(String(rashiNames[rashi].prefix(3)))
                    .font(.system(size: 8))
                    .foregroundColor(Color(red: 0.3, green: 0.8, blue: 0.8))
            }
            ForEach(grahas, id: \.self) { g in
                Text(abbreviate(g))
                    .font(.system(size: 8, weight: .bold))
                    .foregroundColor(grahaColor(g))
            }
        }
        .position(x: cx, y: cy)
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
