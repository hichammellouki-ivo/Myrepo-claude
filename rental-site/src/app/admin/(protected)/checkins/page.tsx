import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { approveCheckInAction, rejectCheckInAction } from "@/actions/admin-checkins";

const DOCUMENT_LABELS: Record<string, string> = {
  ID_CARD: "Carte d'identité",
  PASSPORT: "Passeport",
  DRIVER_LICENSE: "Permis de conduire",
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  PENDING: { label: "En attente", className: "bg-amber-100 text-amber-800" },
  APPROVED: { label: "Validé", className: "bg-green-100 text-green-800" },
  REJECTED: { label: "Refusé", className: "bg-red-100 text-red-800" },
};

export default async function AdminCheckInsPage() {
  const checkIns = await prisma.checkIn.findMany({
    orderBy: [{ status: "asc" }, { submittedAt: "desc" }],
    include: { booking: { include: { listing: true } } },
  });

  const pending = checkIns.filter((c) => c.status === "PENDING");
  const others = checkIns.filter((c) => c.status !== "PENDING");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Check-ins</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Validez les pièces d&apos;identité pour envoyer automatiquement le code d&apos;accès.
        </p>
      </div>

      <section>
        <h2 className="mb-3 font-semibold text-neutral-900">
          En attente de validation ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-500">
            Aucun check-in en attente.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {pending.map((checkIn) => (
              <div
                key={checkIn.id}
                className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:flex-row sm:justify-between"
              >
                <div className="flex-1">
                  <p className="text-sm text-neutral-500">
                    Réservation {checkIn.booking.reference} — {checkIn.booking.listing.title}
                  </p>
                  <p className="font-medium text-neutral-900">{checkIn.guestFullName}</p>
                  <p className="text-sm text-neutral-500">
                    {DOCUMENT_LABELS[checkIn.documentType]} · soumis le{" "}
                    {formatDate(checkIn.submittedAt)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <a
                      href={`/api/uploads/${checkIn.documentFrontPath}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium hover:bg-neutral-100"
                    >
                      Voir le recto
                    </a>
                    {checkIn.documentBackPath && (
                      <a
                        href={`/api/uploads/${checkIn.documentBackPath}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium hover:bg-neutral-100"
                      >
                        Voir le verso
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:w-72">
                  <form action={approveCheckInAction} className="flex flex-col gap-2">
                    <input type="hidden" name="checkInId" value={checkIn.id} />
                    <label className="text-xs font-medium text-neutral-600">
                      Code d&apos;accès (laisser vide pour générer automatiquement)
                    </label>
                    <input
                      name="accessCode"
                      type="text"
                      placeholder="Génération automatique"
                      className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                    />
                    <button
                      type="submit"
                      className="rounded-full bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
                    >
                      Valider et envoyer le code d&apos;accès
                    </button>
                  </form>

                  <form action={rejectCheckInAction} className="flex flex-col gap-2">
                    <input type="hidden" name="checkInId" value={checkIn.id} />
                    <input
                      name="reason"
                      type="text"
                      placeholder="Motif du refus (visible par le voyageur)"
                      className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                    />
                    <button
                      type="submit"
                      className="rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                    >
                      Refuser
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-semibold text-neutral-900">Historique</h2>
        {others.length === 0 ? (
          <p className="text-sm text-neutral-500">Aucun check-in traité pour le moment.</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Voyageur</th>
                  <th className="px-4 py-3 font-medium">Annonce</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium">Traité le</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {others.map((checkIn) => (
                  <tr key={checkIn.id}>
                    <td className="px-4 py-3">{checkIn.guestFullName}</td>
                    <td className="px-4 py-3 text-neutral-600">{checkIn.booking.listing.title}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_LABELS[checkIn.status].className}`}
                      >
                        {STATUS_LABELS[checkIn.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {checkIn.reviewedAt ? formatDate(checkIn.reviewedAt) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
