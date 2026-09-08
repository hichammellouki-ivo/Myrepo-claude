import Foundation

/// Parses and evaluates calculator expressions typed by the user,
/// including nested parentheses and standard operator precedence.
///
/// Percent (`%`) is a postfix operator that divides the value (or the
/// parenthesized group) immediately to its left by 100. This keeps
/// percent well-defined and composable with parentheses, e.g.
/// `(20+5)%` -> 0.25, `50%` -> 0.5, `200×10%` -> 20.
enum CalculatorEngine {

    enum EngineError: Error {
        case invalidCharacter
        case unexpectedToken
        case divisionByZero
    }

    private enum Token: Equatable {
        case number(Double)
        case plus
        case minus
        case multiply
        case divide
        case percent
        case openParen
        case closeParen
    }

    // MARK: - Public API

    /// Evaluates a human-entered expression. Returns `nil` if the
    /// expression is malformed or evaluates to a non-finite result.
    static func evaluate(_ raw: String) -> Double? {
        let balanced = autoCloseParentheses(raw)
        guard let tokens = try? tokenize(balanced), !tokens.isEmpty else { return nil }
        var parser = Parser(tokens: tokens)
        guard let result = try? parser.parseExpression(), parser.isAtEnd else { return nil }
        guard result.isFinite else { return nil }
        return result
    }

    /// Appends any missing closing parentheses so a still-being-typed
    /// expression can be evaluated for a live preview.
    static func autoCloseParentheses(_ raw: String) -> String {
        let openCount = raw.filter { $0 == "(" }.count
        let closeCount = raw.filter { $0 == ")" }.count
        guard openCount > closeCount else { return raw }
        return raw + String(repeating: ")", count: openCount - closeCount)
    }

    // MARK: - Tokenizer

    private static func tokenize(_ string: String) throws -> [Token] {
        var tokens: [Token] = []
        var numberBuffer = ""
        let chars = Array(string)
        var index = 0

        func flushNumber() throws {
            guard !numberBuffer.isEmpty else { return }
            guard let value = Double(numberBuffer) else { throw EngineError.invalidCharacter }
            tokens.append(.number(value))
            numberBuffer = ""
        }

        while index < chars.count {
            let char = chars[index]
            switch char {
            case "0"..."9", ".":
                numberBuffer.append(char)
            case "+":
                try flushNumber()
                tokens.append(.plus)
            case "-", "−":
                try flushNumber()
                tokens.append(.minus)
            case "×", "*":
                try flushNumber()
                tokens.append(.multiply)
            case "÷", "/":
                try flushNumber()
                tokens.append(.divide)
            case "%":
                try flushNumber()
                tokens.append(.percent)
            case "(":
                try flushNumber()
                tokens.append(.openParen)
            case ")":
                try flushNumber()
                tokens.append(.closeParen)
            case " ":
                break
            default:
                throw EngineError.invalidCharacter
            }
            index += 1
        }
        try flushNumber()
        return tokens
    }

    // MARK: - Recursive-descent parser
    //
    // expression := term (('+' | '-') term)*
    // term       := unary (('*' | '/') unary)*
    // unary      := ('-' | '+') unary | postfix
    // postfix    := primary ('%')*
    // primary    := number | '(' expression ')'

    private struct Parser {
        let tokens: [Token]
        var position = 0

        var isAtEnd: Bool { position >= tokens.count }

        private var current: Token? { position < tokens.count ? tokens[position] : nil }

        private mutating func advance() -> Token? {
            guard let token = current else { return nil }
            position += 1
            return token
        }

        mutating func parseExpression() throws -> Double {
            var value = try parseTerm()
            while let token = current, token == .plus || token == .minus {
                _ = advance()
                let rhs = try parseTerm()
                value = (token == .plus) ? value + rhs : value - rhs
            }
            return value
        }

        private mutating func parseTerm() throws -> Double {
            var value = try parseUnary()
            while let token = current, token == .multiply || token == .divide {
                _ = advance()
                let rhs = try parseUnary()
                if token == .divide {
                    guard rhs != 0 else { throw EngineError.divisionByZero }
                    value = value / rhs
                } else {
                    value = value * rhs
                }
            }
            return value
        }

        private mutating func parseUnary() throws -> Double {
            if current == .minus {
                _ = advance()
                return -(try parseUnary())
            }
            if current == .plus {
                _ = advance()
                return try parseUnary()
            }
            return try parsePostfix()
        }

        private mutating func parsePostfix() throws -> Double {
            var value = try parsePrimary()
            while current == .percent {
                _ = advance()
                value = value / 100
            }
            return value
        }

        private mutating func parsePrimary() throws -> Double {
            guard let token = advance() else { throw EngineError.unexpectedToken }
            switch token {
            case .number(let value):
                return value
            case .openParen:
                let value = try parseExpression()
                guard current == .closeParen else { throw EngineError.unexpectedToken }
                _ = advance()
                return value
            default:
                throw EngineError.unexpectedToken
            }
        }
    }
}
