import Link from "next/link";

const tabs = [
  { href: "/annonces", label: "Annonces & réservation" },
  { href: "/checkin", label: "Check-in" },
];

export function PublicNav() {
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight text-neutral-900">
          🏠 Locations courte durée
        </Link>
        <nav className="flex items-center gap-2">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
            >
              {tab.label}
            </Link>
          ))}
          <Link
            href="/admin"
            className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-500 transition hover:bg-neutral-100"
          >
            Espace admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
