import CryptoKit

#if os(iOS)
    import UIKit
#else
    import Foundation
#endif

extension Device: CollectableFamily {
    static func collect() -> Device {
        var bootTime: Date? {
            guard let value = try? Sysctl.value(to: timeval.self, for: [CTL_KERN, KERN_BOOTTIME]) else {
                return nil
            }

            return Date(timeIntervalSince1970: TimeInterval(value.tv_sec) +
                TimeInterval(value.tv_usec) / 1_000_000)
        }

        var hostname: String? {
            try? Sysctl.string(for: [CTL_KERN, KERN_HOSTNAME])
        }

        var kernelVersion: String? {
            try? Sysctl.string(for: [CTL_KERN, KERN_VERSION])
        }

        var osBuild: String? {
            try? Sysctl.string(for: [CTL_KERN, KERN_OSVERSION])
        }

        var osRelease: String? {
            try? Sysctl.string(for: [CTL_KERN, KERN_OSRELEASE])
        }

        var osRevision: Int32? {
            try? Sysctl.value(to: Int32.self, for: [CTL_KERN, KERN_OSREV])
        }

        var osType: String? {
            try? Sysctl.string(for: [CTL_KERN, KERN_OSTYPE])
        }

        var systemName: String? {
            #if os(iOS)
                UIDevice.current.systemName
            #else
                nil
            #endif
        }

        var systemVersion: String? {
            #if os(iOS)
                UIDevice.current.systemVersion
            #else
                nil
            #endif
        }

        var name: String? {
            #if os(iOS)
                UIDevice.current.name
            #else
                nil
            #endif
        }

        var localeCurrent: String? {
            Locale.autoupdatingCurrent.identifier
        }

        var localePreferred: [String]? { // swiftlint:disable:this discouraged_optional_collection
            Locale.preferredLanguages
        }

        var timeZoneCurrent: String? {
            TimeZone.autoupdatingCurrent.identifier
        }

        var vendorId: String? {
            #if os(iOS)
                UIDevice.current.identifierForVendor?.uuidString
            #else
                nil
            #endif
        }

        #if os(iOS)
            UIDevice.current.isBatteryMonitoringEnabled = true
        #endif

        var batteryLevel: Float? {
            #if os(iOS)
                UIDevice.current.batteryLevel
            #else
                nil
            #endif
        }

        var batteryState: BatteryState? {
            #if os(iOS)
                BatteryState.from(UIDevice.current.batteryState)
            #else
                nil
            #endif
        }

        var fontsDigest: String? {
            var hasher = SHA256()

            for family in UIFont.familyNames.sorted() {
                hasher.update(data: Data(family.utf8))
                for name in UIFont.fontNames(forFamilyName: family).sorted() {
                    hasher.update(data: Data(name.utf8))
                }
            }

            return hasher.finalize().compactMap { String(format: "%02x", $0) }.joined()
        }

        var simulator: Bool {
            #if targetEnvironment(simulator)
                true
            #else
                false
            #endif
        }

        return Device(
            platform: .apple,
            bootTime: bootTime,
            hostname: hostname,
            kernelVersion: kernelVersion,
            osBuild: osBuild,
            osRelease: osRelease,
            osType: osType,
            systemName: systemName,
            systemVersion: systemVersion,
            vendorId: vendorId,
            name: name,
            localeCurrent: localeCurrent,
            localePreferred: localePreferred,
            timeZoneCurrent: timeZoneCurrent,
            batteryLevel: batteryLevel,
            batteryState: batteryState,
            fontsDigest: fontsDigest,
            simulator: simulator
        )
    }
}

extension BatteryState {
    static func from(_ state: UIDevice.BatteryState) -> Self? {
        switch state {
        case .unknown:
            return .unknown
        case .unplugged:
            return .unplugged
        case .charging:
            return .charging
        case .full:
            return .full
        default:
            return .unspecified
        }
    }
}
