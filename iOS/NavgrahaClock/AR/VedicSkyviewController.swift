import UIKit
import ARKit
import RealityKit
import CoreLocation
import Combine

/// M3 — Basic AR Scene
///
/// Places 9 Navagraha spheres on a sky-sphere of radius 1000 m using
/// ARWorldTrackingConfiguration with `.gravityAndHeading` world alignment.
/// Positions are recomputed every 60 seconds from EphemerisEngine + CoordinatePipeline.
final class VedicSkyviewController: UIViewController {

    // MARK: - AR

    private var arView: ARView!
    private var skyAnchor: AnchorEntity!
    private var grahaEntities: [String: ModelEntity] = [:]

    // MARK: - Pipeline

    private let engine = EphemerisEngine(ephePath: Bundle.main.bundlePath)
    private let pipeline = CoordinatePipeline()

    // MARK: - Location

    private let locationManager = LocationHeadingManager()
    private var locationCancellable: AnyCancellable?
    private var updateTimer: Timer?

    // MARK: - Graha style (per design doc §9)

    private static let grahaRadii: [String: Float] = [
        "Surya": 15, "Chandra": 12,
        "Mangala": 9, "Budha": 9, "Guru": 11,
        "Shukra": 9, "Shani": 10, "Rahu": 8, "Ketu": 8,
    ]

    private static let grahaColors: [String: UIColor] = [
        "Surya":   .systemYellow,
        "Chandra": .white,
        "Mangala": .systemRed,
        "Budha":   .systemGreen,
        "Guru":    .systemOrange,
        "Shukra":  UIColor(white: 0.95, alpha: 1),
        "Shani":   .systemBlue,
        "Rahu":    .systemPurple,
        "Ketu":    .systemGray,
    ]

    // MARK: - Lifecycle

    override func viewDidLoad() {
        super.viewDidLoad()
        setupARView()
        buildScene()
        observeLocation()
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        let config = ARWorldTrackingConfiguration()
        config.worldAlignment = .gravityAndHeading
        arView.session.run(config, options: [])
    }

    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        arView.session.pause()
        updateTimer?.invalidate()
        updateTimer = nil
    }

    // MARK: - AR Setup

    private func setupARView() {
        arView = ARView(frame: view.bounds)
        arView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(arView)
    }

    private func buildScene() {
        skyAnchor = AnchorEntity(world: .zero)
        arView.scene.addAnchor(skyAnchor)

        let order = ["Surya","Chandra","Mangala","Budha","Guru","Shukra","Shani","Rahu","Ketu"]
        for graha in order {
            let entity = makeGrahaEntity(graha)
            grahaEntities[graha] = entity
            skyAnchor.addChild(entity)
        }
    }

    private func makeGrahaEntity(_ graha: String) -> ModelEntity {
        let radius = Self.grahaRadii[graha] ?? 10
        let color  = Self.grahaColors[graha] ?? .white
        let mesh   = MeshResource.generateSphere(radius: radius)
        let material = SimpleMaterial(color: color, roughness: 0.5, isMetallic: false)
        let entity = ModelEntity(mesh: mesh, materials: [material])
        entity.name = graha
        // Stash below ground until the first location fix arrives
        entity.position = [0, -2000, 0]
        return entity
    }

    // MARK: - Location & Update loop

    private func observeLocation() {
        locationCancellable = locationManager.$location
            .compactMap { $0 }
            .receive(on: DispatchQueue.main)
            .sink { [weak self] _ in
                self?.updateGrahaPositions()
                self?.scheduleUpdateTimer()
            }
    }

    private func scheduleUpdateTimer() {
        guard updateTimer == nil else { return }
        updateTimer = Timer.scheduledTimer(withTimeInterval: 60, repeats: true) { [weak self] _ in
            self?.updateGrahaPositions()
        }
    }

    private func updateGrahaPositions() {
        guard let location = locationManager.location else { return }
        let lat = location.coordinate.latitude
        let lon = location.coordinate.longitude
        let alt = location.altitude
        let skyRadius: Float = 1000

        let positions = engine.positions(for: Date(), latitude: lat, longitude: lon, altitude: alt)
        for pos in positions {
            guard let entity = grahaEntities[pos.graha] else { continue }
            let unitVec = pipeline.toARVector(position: pos, latitude: lat, longitude: lon)
            entity.position = unitVec * skyRadius
        }
    }
}
