// swift-tools-version:5.5
import PackageDescription

let package = Package(
    name: "InterruptionHandling",
    platforms: [.macOS(.v12)],
    dependencies: [],
    targets: [
        .executableTarget(
            name: "InterruptionHandling",
            dependencies: []
        )
    ]
)
