import SwiftUI

struct ContentView: View {
    @StateObject private var historyStore: HistoryStore
    @StateObject private var viewModel: CalculatorViewModel

    init() {
        let store = HistoryStore()
        _historyStore = StateObject(wrappedValue: store)
        _viewModel = StateObject(wrappedValue: CalculatorViewModel(historyStore: store))
    }

    var body: some View {
        GeometryReader { geometry in
            VStack(spacing: 0) {
                topBar
                Spacer(minLength: 12)
                displayArea
                Spacer(minLength: 24)
                keypad(availableWidth: geometry.size.width - 40)
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 16)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Theme.screenBackground.ignoresSafeArea())
        }
        .sheet(isPresented: $viewModel.showHistory) {
            HistoryView(historyStore: historyStore) { entry in
                viewModel.reuse(historyEntry: entry)
            }
        }
    }

    // MARK: - Top bar

    private var topBar: some View {
        HStack {
            Text("Calculatrice")
                .font(.system(.headline, design: .rounded))
                .foregroundStyle(Theme.previewText)

            Spacer()

            Button {
                Haptics.selection()
                viewModel.showHistory = true
            } label: {
                Image(systemName: "clock.arrow.circlepath")
                    .font(.system(size: 19, weight: .semibold))
                    .foregroundStyle(Theme.displayText)
                    .frame(width: 44, height: 44)
                    .background(Theme.functionButtonBackground)
                    .clipShape(Circle())
            }
            .accessibilityLabel("Historique")
        }
        .padding(.top, 8)
    }

    // MARK: - Display

    private var displayArea: some View {
        VStack(alignment: .trailing, spacing: 6) {
            Text(viewModel.previewText.isEmpty ? " " : "= \(viewModel.previewText)")
                .font(.system(size: 20, weight: .medium, design: .rounded))
                .foregroundStyle(Theme.previewText)
                .lineLimit(1)
                .opacity(viewModel.previewText.isEmpty ? 0 : 1)
                .animation(.easeInOut(duration: 0.15), value: viewModel.previewText)

            Text(viewModel.displayText)
                .font(.system(size: displayFontSize, weight: .light, design: .rounded))
                .foregroundStyle(Theme.displayText)
                .lineLimit(2)
                .minimumScaleFactor(0.4)
                .multilineTextAlignment(.trailing)
                .animation(.easeInOut(duration: 0.15), value: viewModel.displayText)
        }
        .frame(maxWidth: .infinity, alignment: .trailing)
        .contentShape(Rectangle())
        .gesture(
            DragGesture(minimumDistance: 24)
                .onEnded { value in
                    guard value.translation.width < -30, abs(value.translation.height) < 40 else { return }
                    Haptics.selection()
                    viewModel.tap(.backspace)
                }
        )
    }

    private var displayFontSize: CGFloat {
        let length = viewModel.displayText.count
        if length > 14 { return 38 }
        if length > 9 { return 52 }
        return 68
    }

    // MARK: - Keypad

    private struct KeySpec: Identifiable {
        let id = UUID()
        var title: String
        var systemImage: String? = nil
        var style: CalculatorButtonStyle
        var accessibilityLabelText: String? = nil
        var action: () -> Void
    }

    private func keypad(availableWidth: CGFloat) -> some View {
        let spacing: CGFloat = 18
        let buttonSize = (availableWidth - spacing * 3) / 4

        let rows: [[KeySpec]] = [
            [
                KeySpec(title: "AC", style: .function, accessibilityLabelText: "Tout effacer") { viewModel.tap(.clear) },
                KeySpec(title: "( )", style: .function, accessibilityLabelText: "Parenthèses") { viewModel.tap(.parenthesis) },
                KeySpec(title: "%", style: .function, accessibilityLabelText: "Pourcentage") { viewModel.tap(.percent) },
                KeySpec(title: "", systemImage: "delete.left", style: .function, accessibilityLabelText: "Effacer") { viewModel.tap(.backspace) }
            ],
            [
                KeySpec(title: "7", style: .number) { viewModel.tap(.digit(7)) },
                KeySpec(title: "8", style: .number) { viewModel.tap(.digit(8)) },
                KeySpec(title: "9", style: .number) { viewModel.tap(.digit(9)) },
                KeySpec(title: "÷", style: .function, accessibilityLabelText: "Diviser") { viewModel.tap(.op(.divide)) }
            ],
            [
                KeySpec(title: "4", style: .number) { viewModel.tap(.digit(4)) },
                KeySpec(title: "5", style: .number) { viewModel.tap(.digit(5)) },
                KeySpec(title: "6", style: .number) { viewModel.tap(.digit(6)) },
                KeySpec(title: "×", style: .function, accessibilityLabelText: "Multiplier") { viewModel.tap(.op(.multiply)) }
            ],
            [
                KeySpec(title: "1", style: .number) { viewModel.tap(.digit(1)) },
                KeySpec(title: "2", style: .number) { viewModel.tap(.digit(2)) },
                KeySpec(title: "3", style: .number) { viewModel.tap(.digit(3)) },
                KeySpec(title: "−", style: .function, accessibilityLabelText: "Soustraire") { viewModel.tap(.op(.subtract)) }
            ],
            [
                KeySpec(title: "±", style: .function, accessibilityLabelText: "Changer de signe") { viewModel.tap(.negate) },
                KeySpec(title: "0", style: .number) { viewModel.tap(.digit(0)) },
                KeySpec(title: ".", style: .number, accessibilityLabelText: "Virgule") { viewModel.tap(.decimalPoint) },
                KeySpec(title: "+", style: .function, accessibilityLabelText: "Additionner") { viewModel.tap(.op(.add)) }
            ]
        ]

        return VStack(spacing: spacing) {
            ForEach(rows.indices, id: \.self) { rowIndex in
                HStack(spacing: spacing) {
                    ForEach(rows[rowIndex]) { key in
                        CalculatorButtonView(
                            title: key.title,
                            systemImage: key.systemImage,
                            style: key.style,
                            accessibilityLabelText: key.accessibilityLabelText,
                            action: key.action
                        )
                        .frame(width: buttonSize, height: buttonSize)
                    }
                }
            }

            CalculatorButtonView(title: "=", style: .accent, accessibilityLabelText: "Égal") {
                viewModel.tap(.equals)
            }
            .frame(height: buttonSize)
        }
    }
}

#Preview {
    ContentView()
}
