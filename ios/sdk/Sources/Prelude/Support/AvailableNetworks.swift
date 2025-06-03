import Foundation
import Network

enum AvailableNetworks {
    case lanAndCellular
    case onlyLan
    case onlyCellular

    static func read() async -> Self? {
        let networkMonitor = NWPathMonitor()
        return await withCheckedContinuation { continuation in
            networkMonitor.pathUpdateHandler = { path in
                var lanAvailable = false
                var cellularAvailable = false
                for interface in path.availableInterfaces {
                    if interface.type == .wifi || interface.type == .wiredEthernet {
                        lanAvailable = true
                    } else if interface.type == .cellular {
                        cellularAvailable = true
                    }
                }
                networkMonitor.cancel()
                let result: Self? = if lanAvailable == true, cellularAvailable == true {
                    .lanAndCellular
                } else if lanAvailable == true {
                    .onlyLan
                } else if cellularAvailable == true {
                    .onlyCellular
                } else {
                    .none
                }
                continuation.resume(with: Result.success(result))
            }
            let queue = DispatchQueue(label: "Network Monitor")
            networkMonitor.start(queue: queue)
        }
    }
}
