import Foundation
import Combine

/// Persists every calculation with no cap on how many are kept, so the
/// history is unlimited and survives app relaunches. Entries are stored
/// as JSON in the app's Documents directory.
final class HistoryStore: ObservableObject {
    @Published private(set) var entries: [HistoryEntry] = []

    private let fileURL: URL
    private let saveQueue = DispatchQueue(label: "com.calculator.historystore", qos: .utility)

    init(fileName: String = "calculation_history.json") {
        let documents = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        self.fileURL = documents.appendingPathComponent(fileName)
        load()
    }

    func add(expression: String, result: String) {
        let entry = HistoryEntry(expression: expression, result: result, date: Date())
        entries.insert(entry, at: 0)
        persist()
    }

    func delete(at offsets: IndexSet, in section: [HistoryEntry]) {
        let idsToRemove = Set(offsets.map { section[$0].id })
        entries.removeAll { idsToRemove.contains($0.id) }
        persist()
    }

    func clearAll() {
        entries.removeAll()
        persist()
    }

    /// All entries grouped by calendar day, most recent day first,
    /// most recent entry first within each day.
    var groupedByDay: [HistoryDayGroup] {
        let calendar = Calendar.current
        let groups = Dictionary(grouping: entries) { calendar.startOfDay(for: $0.date) }
        return groups
            .map { HistoryDayGroup(id: $0.key, entries: $0.value.sorted { $0.date > $1.date }) }
            .sorted { $0.id > $1.id }
    }

    // MARK: - Persistence

    private func load() {
        guard let data = try? Data(contentsOf: fileURL) else { return }
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        if let decoded = try? decoder.decode([HistoryEntry].self, from: data) {
            entries = decoded.sorted { $0.date > $1.date }
        }
    }

    private func persist() {
        let snapshot = entries
        let url = fileURL
        saveQueue.async {
            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            guard let data = try? encoder.encode(snapshot) else { return }
            try? data.write(to: url, options: .atomic)
        }
    }
}
