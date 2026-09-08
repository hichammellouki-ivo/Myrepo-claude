import SwiftUI
import UIKit

/// Centralized, adaptive color palette (light + dark) and haptics helpers,
/// used to give every screen a consistent, polished look.
enum Theme {
    static let screenBackground = Color(UIColor { trait in
        trait.userInterfaceStyle == .dark
            ? UIColor(red: 0.05, green: 0.05, blue: 0.07, alpha: 1)
            : UIColor(red: 0.96, green: 0.96, blue: 0.98, alpha: 1)
    })

    static let displayText = Color(UIColor { trait in
        trait.userInterfaceStyle == .dark ? .white : UIColor(white: 0.08, alpha: 1)
    })

    static let previewText = Color(UIColor { trait in
        trait.userInterfaceStyle == .dark
            ? UIColor(white: 1, alpha: 0.45)
            : UIColor(white: 0.08, alpha: 0.45)
    })

    static let numberButtonBackground = Color(UIColor { trait in
        trait.userInterfaceStyle == .dark
            ? UIColor(red: 0.20, green: 0.20, blue: 0.23, alpha: 1)
            : UIColor.white
    })

    static let numberButtonText = Color(UIColor { trait in
        trait.userInterfaceStyle == .dark ? .white : UIColor(white: 0.1, alpha: 1)
    })

    static let functionButtonBackground = Color(UIColor { trait in
        trait.userInterfaceStyle == .dark
            ? UIColor(red: 0.28, green: 0.28, blue: 0.31, alpha: 1)
            : UIColor(red: 0.89, green: 0.90, blue: 0.93, alpha: 1)
    })

    static let functionButtonText = Color(UIColor { trait in
        trait.userInterfaceStyle == .dark ? .white : UIColor(white: 0.15, alpha: 1)
    })

    static let accentGradient = LinearGradient(
        colors: [
            Color(red: 1.0, green: 0.62, blue: 0.13),
            Color(red: 1.0, green: 0.45, blue: 0.13)
        ],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static let accentText = Color.white
}

enum Haptics {
    static func light() {
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
    }

    static func selection() {
        UISelectionFeedbackGenerator().selectionChanged()
    }
}
