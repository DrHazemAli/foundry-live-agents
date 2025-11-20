// swift-tools-version:5.5
import PackageDescription

let package = Package(
    name: "StreamingResponses",
    platforms: [.macOS(.v12)],
    dependencies: [],
    targets: [
        .executableTarget(
            name: "StreamingResponses",
            dependencies: []
        )
    ]
)
