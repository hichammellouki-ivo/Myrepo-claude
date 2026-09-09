import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";

export default async function AdminListingsPage() {
  const listings = await prisma.listing.findMany({
    orderBy: { createdAt: "desc" },
    include: { photos: { orderBy: { position: "asc" }, take: 1 }, _count: { select: { bookings: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Annonces</h1>
          <p className="mt-1 text-sm text-neutral-600">Ajoutez et gérez vos appartements.</p>
        </div>
        <Link
          href="/admin/listings/new"
          className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700"
        >
          + Ajouter une annonce
        </Link>
      </div>

      {listings.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-500">
          Aucune annonce pour le moment. Ajoutez votre première annonce pour commencer.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Annonce</th>
                <th className="px-4 py-3 font-medium">Ville</th>
                <th className="px-4 py-3 font-medium">Prix / nuit</th>
                <th className="px-4 py-3 font-medium">Réservations</th>
                <th className="px-4 py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {listings.map((listing) => (
                <tr key={listing.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/listings/${listing.id}`}
                      className="font-medium text-neutral-900 hover:underline"
                    >
                      {listing.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{listing.city}</td>
                  <td className="px-4 py-3 text-neutral-600">{formatPrice(listing.pricePerNight)}</td>
                  <td className="px-4 py-3 text-neutral-600">{listing._count.bookings}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        listing.active
                          ? "bg-green-100 text-green-800"
                          : "bg-neutral-200 text-neutral-600"
                      }`}
                    >
                      {listing.active ? "Publiée" : "Masquée"}
                    </span>
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
