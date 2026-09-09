import { prisma } from "@/lib/prisma";
import { formatDate, formatPrice } from "@/lib/format";

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  PENDING: { label: "En attente", className: "bg-amber-100 text-amber-800" },
  CONFIRMED: { label: "Confirmée", className: "bg-green-100 text-green-800" },
  CANCELLED: { label: "Annulée", className: "bg-neutral-200 text-neutral-600" },
};

const CHECKIN_LABELS: Record<string, string> = {
  NONE: "Check-in non fait",
  PENDING: "Check-in en attente",
  APPROVED: "Check-in validé",
  REJECTED: "Check-in refusé",
};

export default async function AdminBookingsPage() {
  const bookings = await prisma.booking.findMany({
    orderBy: { startDate: "desc" },
    include: { listing: true, checkIn: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Réservations</h1>
        <p className="mt-1 text-sm text-neutral-600">Toutes les réservations reçues.</p>
      </div>

      {bookings.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-500">
          Aucune réservation pour le moment.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Référence</th>
                <th className="px-4 py-3 font-medium">Annonce</th>
                <th className="px-4 py-3 font-medium">Voyageur</th>
                <th className="px-4 py-3 font-medium">Dates</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium">Check-in</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td className="px-4 py-3 font-mono text-xs">{booking.reference}</td>
                  <td className="px-4 py-3">{booking.listing.title}</td>
                  <td className="px-4 py-3">
                    <div>{booking.guestName}</div>
                    <div className="text-xs text-neutral-500">{booking.guestEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
                  </td>
                  <td className="px-4 py-3">{formatPrice(booking.totalPrice)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_LABELS[booking.status].className}`}
                    >
                      {STATUS_LABELS[booking.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {CHECKIN_LABELS[booking.checkIn?.status ?? "NONE"]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
