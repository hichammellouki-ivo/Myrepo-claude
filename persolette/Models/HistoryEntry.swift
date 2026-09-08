import Foundation

/// A single completed calculation, timestamped so it can be grouped by day.
struct HistoryEntry: Identifiable, Codable, Equatable {
    let id: UUID
    let expression: String
    let result: String
    let date: Date

    init(id: UUID = UUID(), expression: String, result: String, date: Date = Date()) {
        self.id = id
        self.expression = expression
        self.result = result
        self.date = date
    }
}

/// A day's worth of history entries, newest first.
struct HistoryDayGroup: Identifiable {
    let id: Date
    let entries: [HistoryEntry]
}
