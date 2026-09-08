import SwiftUI

/// Unlimited, dated calculation history — grouped by day, newest first.
/// Tapping an entry loads its result back into the calculator; swiping
/// deletes it.
struct HistoryView: View {
    @ObservedObject var historyStore: HistoryStore
    @Environment(\.dismiss) private var dismiss
    var onSelect: (HistoryEntry) -> Void

    var body: some View {
        NavigationStack {
            Group {
                if historyStore.entries.isEmpty {
                    emptyState
                } else {
                    list
                }
            }
            .navigationTitle("Historique")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Fermer") { dismiss() }
                }
                if !historyStore.entries.isEmpty {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button("Tout effacer", role: .destructive) {
                            historyStore.clearAll()
                        }
                    }
                }
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "clock.arrow.circlepath")
                .font(.system(size: 44))
                .foregroundStyle(.secondary)
            Text("Aucun calcul pour l'instant")
                .font(.headline)
            Text("Vos calculs apparaîtront ici, classés par date, sans limite.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var list: some View {
        List {
            ForEach(historyStore.groupedByDay) { group in
                Section(header: Text(Self.sectionTitle(for: group.id))) {
                    ForEach(group.entries) { entry in
                        Button {
                            onSelect(entry)
                        } label: {
                            HistoryRow(entry: entry)
                        }
                        .buttonStyle(.plain)
                    }
                    .onDelete { offsets in
                        historyStore.delete(at: offsets, in: group.entries)
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
    }

    private static func sectionTitle(for day: Date) -> String {
        if Calendar.current.isDateInToday(day) { return "Aujourd'hui" }
        if Calendar.current.isDateInYesterday(day) { return "Hier" }
        let formatter = DateFormatter()
        formatter.dateStyle = .full
        formatter.locale = Locale(identifier: "fr_FR")
        return formatter.string(from: day).capitalized
    }
}

private struct HistoryRow: View {
    let entry: HistoryEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(entry.expression)
                .font(.system(size: 15, weight: .regular, design: .rounded))
                .foregroundStyle(.secondary)
                .lineLimit(1)
            Text(entry.result)
                .font(.system(size: 22, weight: .semibold, design: .rounded))
            Text(Self.timeFormatter.string(from: entry.date))
                .font(.system(size: 11, weight: .regular))
                .foregroundStyle(.tertiary)
        }
        .padding(.vertical, 4)
    }

    private static let timeFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateStyle = .none
        formatter.timeStyle = .medium
        formatter.locale = Locale(identifier: "fr_FR")
        return formatter
    }()
}

#Preview {
    HistoryView(historyStore: HistoryStore()) { _ in }
}
