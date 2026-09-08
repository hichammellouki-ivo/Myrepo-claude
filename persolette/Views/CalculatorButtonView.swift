import SwiftUI

enum CalculatorButtonStyle {
    case number
    case function
    case accent
}

/// A single calculator key: generously sized, well-spaced by its parent
/// layout, with a soft spring "press" animation and haptic feedback so
/// the whole keypad feels fluid and precise to tap.
struct CalculatorButtonView: View {
    let title: String
    var systemImage: String? = nil
    let style: CalculatorButtonStyle
    var accessibilityLabelText: String? = nil
    let action: () -> Void

    @State private var isPressed = false

    var body: some View {
        Button {
            Haptics.light()
            action()
        } label: {
            Group {
                if let systemImage {
                    Image(systemName: systemImage)
                        .font(.system(size: 24, weight: .medium))
                } else {
                    Text(title)
                        .font(.system(size: 30, weight: .medium, design: .rounded))
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .foregroundStyle(foregroundColor)
        }
        .background(background)
        .clipShape(Capsule())
        .scaleEffect(isPressed ? 0.88 : 1.0)
        .animation(.spring(response: 0.25, dampingFraction: 0.55), value: isPressed)
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in isPressed = true }
                .onEnded { _ in isPressed = false }
        )
        .accessibilityLabel(accessibilityLabelText ?? title)
    }

    @ViewBuilder
    private var background: some View {
        switch style {
        case .number:
            Theme.numberButtonBackground
        case .function:
            Theme.functionButtonBackground
        case .accent:
            Theme.accentGradient
        }
    }

    private var foregroundColor: Color {
        switch style {
        case .number:
            return Theme.numberButtonText
        case .function:
            return Theme.functionButtonText
        case .accent:
            return Theme.accentText
        }
    }
}
