import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { ListingForm } from "@/components/ListingForm";
import {
  updateListingAction,
  deletePhotoAction,
  addCalendarFeedAction,
  deleteCalendarFeedAction,
  syncCalendarFeedAction,
  addManualBlockAction,
  deleteBlockedPeriodAction,
} from "@/actions/admin-listings";

const PLATFORM_LABELS: Record<string, string> = {
  AIRBNB: "Airbnb",
  BOOKING: "Booking.com",
  OTHER: "Autre",
};

export default async function EditListingPage({
  params,
}: PageProps<"/admin/listings/[id]">) {
  const { id } = await params;

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      photos: { orderBy: { position: "asc" } },
      calendarFeeds: { orderBy: { createdAt: "asc" } },
      blockedPeriods: {
        where: { source: "MANUAL" },
        orderBy: { startDate: "asc" },
      },
    },
  });

  if (!listing) notFound();

  const publicBaseUrl = process.env.PUBLIC_BASE_URL || "http://localhost:3000";
  const exportUrl = `${publicBaseUrl}/api/ical/${listing.slug}`;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">{listing.title}</h1>
        <p className="mt-1 text-sm text-neutral-600">/annonces/{listing.slug}</p>
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold text-neutral-900">Informations générales</h2>
        <ListingForm
          action={updateListingAction}
          isEdit
          submitLabel="Enregistrer les modifications"
          defaults={{
            id: listing.id,
            title: listing.title,
            description: listing.description,
            address: listing.address,
            city: listing.city,
            country: listing.country,
            pricePerNight: listing.pricePerNight,
            cleaningFee: listing.cleaningFee,
            maxGuests: listing.maxGuests,
            bedrooms: listing.bedrooms,
            bathrooms: listing.bathrooms,
            beds: listing.beds,
            accessDetails: listing.accessDetails,
            amenities: JSON.parse(listing.amenities || "[]"),
            active: listing.active,
          }}
        />
      </section>

      {listing.photos.length > 0 && (
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-neutral-900">Photos</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {listing.photos.map((photo) => (
              <div key={photo.id} className="group relative h-32 overflow-hidden rounded-lg">
                <Image src={photo.url} alt="" fill sizes="200px" className="object-cover" />
                <form action={deletePhotoAction} className="absolute right-1 top-1">
                  <input type="hidden" name="photoId" value={photo.id} />
                  <input type="hidden" name="listingId" value={listing.id} />
                  <button
                    type="submit"
                    className="rounded-full bg-black/60 px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100"
                  >
                    ✕
                  </button>
                </form>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-neutral-900">
          Synchronisation des calendriers (Airbnb / Booking.com)
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          Importez les calendriers iCal d&apos;Airbnb et Booking.com pour bloquer
          automatiquement les dates déjà réservées sur ces plateformes. Pour la
          synchronisation inverse, copiez le lien d&apos;export ci-dessous dans les
          paramètres de synchronisation de calendrier d&apos;Airbnb / Booking.com.
        </p>

        <div className="mt-3 flex items-center gap-2 rounded-lg bg-neutral-100 p-3 text-sm">
          <code className="flex-1 overflow-x-auto whitespace-nowrap">{exportUrl}</code>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {listing.calendarFeeds.map((feed) => (
            <div
              key={feed.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-200 p-3 text-sm"
            >
              <div className="min-w-0">
                <p className="font-medium text-neutral-900">
                  {PLATFORM_LABELS[feed.platform] ?? feed.platform}
                </p>
                <p className="truncate text-xs text-neutral-500">{feed.icalUrl}</p>
                <p className="text-xs text-neutral-400">
                  {feed.lastSyncAt
                    ? `Dernière synchro : ${formatDate(feed.lastSyncAt)} (${feed.lastSyncStatus})`
                    : "Pas encore synchronisé"}
                  {feed.lastSyncError && (
                    <span className="text-red-500"> — {feed.lastSyncError}</span>
                  )}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <form action={syncCalendarFeedAction}>
                  <input type="hidden" name="feedId" value={feed.id} />
                  <input type="hidden" name="listingId" value={listing.id} />
                  <button
                    type="submit"
                    className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium hover:bg-neutral-100"
                  >
                    Synchroniser
                  </button>
                </form>
                <form action={deleteCalendarFeedAction}>
                  <input type="hidden" name="feedId" value={feed.id} />
                  <input type="hidden" name="listingId" value={listing.id} />
                  <button
                    type="submit"
                    className="rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    Supprimer
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>

        <form
          action={addCalendarFeedAction}
          className="mt-4 flex flex-wrap items-end gap-3 border-t border-neutral-100 pt-4"
        >
          <input type="hidden" name="listingId" value={listing.id} />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-neutral-600">Plateforme</label>
            <select
              name="platform"
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="AIRBNB">Airbnb</option>
              <option value="BOOKING">Booking.com</option>
              <option value="OTHER">Autre</option>
            </select>
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-xs font-medium text-neutral-600">Lien iCal (.ics)</label>
            <input
              name="icalUrl"
              type="url"
              placeholder="https://www.airbnb.fr/calendar/ical/..."
              required
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
          >
            Ajouter
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-neutral-900">Blocages manuels</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Bloquez des dates manuellement (travaux, usage personnel...).
        </p>

        <div className="mt-4 flex flex-col gap-2">
          {listing.blockedPeriods.map((block) => (
            <div
              key={block.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-neutral-200 p-3 text-sm"
            >
              <span>
                {formatDate(block.startDate)} → {formatDate(block.endDate)}
                {block.note && <span className="text-neutral-500"> — {block.note}</span>}
              </span>
              <form action={deleteBlockedPeriodAction}>
                <input type="hidden" name="blockId" value={block.id} />
                <input type="hidden" name="listingId" value={listing.id} />
                <button
                  type="submit"
                  className="rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  Supprimer
                </button>
              </form>
            </div>
          ))}
        </div>

        <form
          action={addManualBlockAction}
          className="mt-4 flex flex-wrap items-end gap-3 border-t border-neutral-100 pt-4"
        >
          <input type="hidden" name="listingId" value={listing.id} />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-neutral-600">Du</label>
            <input
              name="startDate"
              type="date"
              required
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-neutral-600">Au</label>
            <input
              name="endDate"
              type="date"
              required
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-xs font-medium text-neutral-600">Note (optionnel)</label>
            <input
              name="note"
              type="text"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
          >
            Bloquer
          </button>
        </form>
      </section>
    </div>
  );
}
