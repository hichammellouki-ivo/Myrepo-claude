import Foundation
import Combine

enum CalculatorOperator: String, CaseIterable {
    case add = "+"
    case subtract = "-"
    case multiply = "×"
    case divide = "÷"
}

enum CalculatorButton: Hashable {
    case digit(Int)
    case decimalPoint
    case op(CalculatorOperator)
    case percent
    case parenthesis
    case negate
    case clear
    case backspace
    case equals
}

@MainActor
final class CalculatorViewModel: ObservableObject {

    @Published private(set) var expression: String = ""
    @Published private(set) var displayText: String = "0"
    @Published private(set) var previewText: String = ""
    @Published private(set) var isShowingResult: Bool = false
    @Published var showHistory: Bool = false

    let historyStore: HistoryStore

    private let operatorCharacters: Set<Character> = ["+", "-", "×", "÷"]
    private let maxExpressionLength = 60

    init(historyStore: HistoryStore) {
        self.historyStore = historyStore
    }

    // MARK: - Derived state

    private var openParenthesesCount: Int {
        expression.filter { $0 == "(" }.count - expression.filter { $0 == ")" }.count
    }

    // MARK: - Input handling

    func tap(_ button: CalculatorButton) {
        let isAlwaysAllowed = button == .clear || button == .backspace || button == .equals
        guard expression.count < maxExpressionLength || isAlwaysAllowed else { return }

        switch button {
        case .digit(let value):
            insertDigit(value)
        case .decimalPoint:
            insertDecimalPoint()
        case .op(let op):
            insertOperator(op)
        case .percent:
            insertPercent()
        case .parenthesis:
            insertParenthesis()
        case .negate:
            negateCurrentNumber()
        case .clear:
            clearAll()
        case .backspace:
            deleteLast()
        case .equals:
            evaluateAndCommit()
        }

        refreshPreview()
    }

    /// Loads a past result back into the display so the user can continue
    /// calculating from it.
    func reuse(historyEntry: HistoryEntry) {
        expression = historyEntry.result
        isShowingResult = true
        showHistory = false
        syncDisplayFromExpression()
        refreshPreview()
    }

    // MARK: - Individual operations

    private func insertDigit(_ value: Int) {
        if isShowingResult { expression = "" }
        isShowingResult = false

        if expression.isEmpty || expression == "0" {
            expression = "\(value)"
        } else {
            expression.append(String(value))
        }
        syncDisplayFromExpression()
    }

    private func insertDecimalPoint() {
        if isShowingResult { expression = "" }
        isShowingResult = false

        let segment = currentNumberSegment()
        if segment.contains(".") { return }

        let last = expression.last
        if last == nil || operatorCharacters.contains(last!) || last! == "(" {
            expression.append("0.")
        } else {
            expression.append(".")
        }
        syncDisplayFromExpression()
    }

    private func insertOperator(_ op: CalculatorOperator) {
        isShowingResult = false

        guard let last = expression.last else {
            if op == .subtract { expression = "-" }
            syncDisplayFromExpression()
            return
        }

        if operatorCharacters.contains(last) {
            expression.removeLast()
            expression.append(op.rawValue)
        } else if last == "(" {
            if op == .subtract { expression.append(op.rawValue) }
        } else {
            expression.append(op.rawValue)
        }
        syncDisplayFromExpression()
    }

    private func insertPercent() {
        guard let last = expression.last, last.isNumber || last == ")" else { return }
        isShowingResult = false
        expression.append("%")
        syncDisplayFromExpression()
    }

    private func insertParenthesis() {
        if isShowingResult { expression = "" }
        isShowingResult = false

        guard let last = expression.last else {
            expression.append("(")
            syncDisplayFromExpression()
            return
        }

        if operatorCharacters.contains(last) || last == "(" {
            expression.append("(")
        } else if openParenthesesCount > 0, last.isNumber || last == ")" || last == "%" {
            expression.append(")")
        } else if last.isNumber || last == "." || last == ")" || last == "%" {
            expression.append("×(")
        } else {
            expression.append("(")
        }
        syncDisplayFromExpression()
    }

    private func negateCurrentNumber() {
        isShowingResult = false

        guard !expression.isEmpty else {
            expression = "-"
            syncDisplayFromExpression()
            return
        }

        var chars = Array(expression)

        // If the expression ends with a wrapped "(-123.4)", unwrap it.
        if chars.last == ")" {
            var i = chars.count - 2
            var digits = ""
            while i >= 0, chars[i].isNumber || chars[i] == "." {
                digits = String(chars[i]) + digits
                i -= 1
            }
            if i >= 1, chars[i] == "-", chars[i - 1] == "(", !digits.isEmpty {
                let openIndex = i - 1
                chars.removeSubrange(openIndex...(chars.count - 1))
                chars.append(contentsOf: digits)
                expression = String(chars)
                syncDisplayFromExpression()
                return
            }
        }

        // Otherwise wrap the trailing number as "(-123.4)".
        var i = chars.count - 1
        var digits = ""
        while i >= 0, chars[i].isNumber || chars[i] == "." {
            digits = String(chars[i]) + digits
            i -= 1
        }
        guard !digits.isEmpty else { return }
        let start = i + 1
        chars.removeSubrange(start..<chars.count)
        chars.append(contentsOf: Array("(-\(digits))"))
        expression = String(chars)
        syncDisplayFromExpression()
    }

    private func clearAll() {
        expression = ""
        isShowingResult = false
        syncDisplayFromExpression()
    }

    private func deleteLast() {
        guard !expression.isEmpty else { return }
        isShowingResult = false
        expression.removeLast()
        syncDisplayFromExpression()
    }

    private func evaluateAndCommit() {
        guard !expression.isEmpty, !isShowingResult else { return }
        guard let result = CalculatorEngine.evaluate(expression) else {
            displayText = "Erreur"
            previewText = ""
            return
        }
        let formatted = Self.format(result)
        historyStore.add(expression: expression, result: formatted)
        expression = formatted
        isShowingResult = true
        syncDisplayFromExpression()
        previewText = ""
    }

    // MARK: - Helpers

    private func currentNumberSegment() -> String {
        var segment = ""
        for char in expression.reversed() {
            if char.isNumber || char == "." {
                segment.append(char)
            } else {
                break
            }
        }
        return String(segment.reversed())
    }

    private func syncDisplayFromExpression() {
        displayText = expression.isEmpty ? "0" : expression
    }

    private func refreshPreview() {
        guard !expression.isEmpty, !isShowingResult, let last = expression.last else {
            previewText = ""
            return
        }
        guard last.isNumber || last == ")" || last == "%" else {
            previewText = ""
            return
        }
        if let value = CalculatorEngine.evaluate(expression), Self.format(value) != expression {
            previewText = Self.format(value)
        } else {
            previewText = ""
        }
    }

    static func format(_ value: Double) -> String {
        if value.isNaN || value.isInfinite { return "Erreur" }
        if value == value.rounded(), abs(value) < 1e15 {
            return integerFormatter.string(from: NSNumber(value: value)) ?? "\(value)"
        }
        return decimalFormatter.string(from: NSNumber(value: value)) ?? "\(value)"
    }

    // Locale is pinned to en_US_POSIX (decimal point) regardless of the
    // device's language, because formatted results are fed straight back
    // into `CalculatorEngine`, which only recognizes "." as the decimal
    // separator. Only the grouping separator is customized for display.
    private static let integerFormatter: NumberFormatter = {
        let formatter = NumberFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.numberStyle = .decimal
        formatter.maximumFractionDigits = 0
        formatter.usesGroupingSeparator = true
        formatter.groupingSeparator = " "
        return formatter
    }()

    private static let decimalFormatter: NumberFormatter = {
        let formatter = NumberFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.numberStyle = .decimal
        formatter.decimalSeparator = "."
        formatter.maximumFractionDigits = 9
        formatter.minimumFractionDigits = 0
        formatter.usesGroupingSeparator = true
        formatter.groupingSeparator = " "
        return formatter
    }()
}
