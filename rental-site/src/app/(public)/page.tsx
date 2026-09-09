import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-10">
      <section className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
          Bienvenue
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-neutral-600">
          Consultez nos annonces, vérifiez les disponibilités et réservez en quelques
          clics. Une fois votre séjour réservé, effectuez votre check-in en ligne pour
          recevoir votre code d&apos;accès.
        </p>
      </section>

      <section className="grid gap-6 sm:grid-cols-2">
        <Link
          href="/annonces"
          className="group flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm transition hover:border-neutral-900 hover:shadow-md"
        >
          <span className="text-3xl">🔎</span>
          <h2 className="text-xl font-semibold text-neutral-900">
            Annonces &amp; réservation
          </h2>
          <p className="text-sm text-neutral-600">
            Parcourez les appartements disponibles, filtrez selon vos besoins (ville,
            dates, budget, nombre de voyageurs...) et réservez directement en ligne.
          </p>
          <span className="mt-2 text-sm font-medium text-neutral-900 group-hover:underline">
            Voir les annonces →
          </span>
        </Link>

        <Link
          href="/checkin"
          className="group flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm transition hover:border-neutral-900 hover:shadow-md"
        >
          <span className="text-3xl">🪪</span>
          <h2 className="text-xl font-semibold text-neutral-900">Check-in</h2>
          <p className="text-sm text-neutral-600">
            Vous avez déjà réservé ? Effectuez votre check-in en ligne en transmettant
            une pièce d&apos;identité. Après validation, vous recevrez automatiquement
            votre code d&apos;accès par e-mail.
          </p>
          <span className="mt-2 text-sm font-medium text-neutral-900 group-hover:underline">
            Faire mon check-in →
          </span>
        </Link>
      </section>
    </div>
  );
}
