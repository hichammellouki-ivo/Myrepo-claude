const WEEKDAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];
const MONTH_FORMATTER = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });

type Props = {
  unavailableDates: Set<string>;
  monthsToShow?: number;
};

function toKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function buildMonthGrid(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(Date.UTC(year, month, 1));
  const startWeekday = (firstDay.getUTCDay() + 6) % 7; // lundi = 0
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  const cells: (Date | null)[] = Array(startWeekday).fill(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(Date.UTC(year, month, day)));
  }
  return cells;
}

export function AvailabilityCalendar({ unavailableDates, monthsToShow = 3 }: Props) {
  const today = new Date();
  const startYear = today.getUTCFullYear();
  const startMonth = today.getUTCMonth();

  const months = Array.from({ length: monthsToShow }, (_, i) => {
    const date = new Date(Date.UTC(startYear, startMonth + i, 1));
    return { year: date.getUTCFullYear(), month: date.getUTCMonth() };
  });

  const todayKey = toKey(today);

  return (
    <div>
      <div className="mb-3 flex items-center gap-4 text-xs text-neutral-600">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border border-neutral-300 bg-white" />
          Disponible
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-neutral-300" />
          Indisponible
        </span>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {months.map(({ year, month }) => {
          const cells = buildMonthGrid(year, month);
          const label = MONTH_FORMATTER.format(new Date(Date.UTC(year, month, 1)));
          return (
            <div key={`${year}-${month}`}>
              <p className="mb-2 text-center text-sm font-medium capitalize text-neutral-800">
                {label}
              </p>
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-neutral-400">
                {WEEKDAY_LABELS.map((d, i) => (
                  <span key={i}>{d}</span>
                ))}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-1">
                {cells.map((date, i) => {
                  if (!date) return <span key={i} />;
                  const key = toKey(date);
                  const isPast = key < todayKey;
                  const isUnavailable = unavailableDates.has(key) || isPast;
                  return (
                    <span
                      key={i}
                      title={isUnavailable ? "Indisponible" : "Disponible"}
                      className={`flex h-7 items-center justify-center rounded-md text-xs ${
                        isUnavailable
                          ? "bg-neutral-200 text-neutral-400 line-through"
                          : "bg-white text-neutral-700 ring-1 ring-neutral-200"
                      }`}
                    >
                      {date.getUTCDate()}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
