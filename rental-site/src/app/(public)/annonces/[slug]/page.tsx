import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUnavailablePeriods } from "@/lib/availability";
import { formatPrice } from "@/lib/format";
import { AvailabilityCalendar } from "@/components/AvailabilityCalendar";
import { BookingForm } from "@/components/BookingForm";

function expandUnavailableDates(periods: { startDate: Date; endDate: Date }[]): Set<string> {
  const dates = new Set<string>();
  for (const period of periods) {
    const cursor = new Date(period.startDate);
    while (cursor < period.endDate) {
      dates.add(cursor.toISOString().slice(0, 10));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }
  return dates;
}

export default async function ListingDetailPage({
  params,
}: PageProps<"/annonces/[slug]">) {
  const { slug } = await params;

  const listing = await prisma.listing.findUnique({
    where: { slug },
    include: { photos: { orderBy: { position: "asc" } } },
  });

  if (!listing || !listing.active) {
    notFound();
  }

  const amenities: string[] = JSON.parse(listing.amenities || "[]");
  const unavailablePeriods = await getUnavailablePeriods(listing.id);
  const unavailableDates = expandUnavailableDates(unavailablePeriods);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-sm text-neutral-500">
          {listing.city}, {listing.country}
        </p>
        <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">{listing.title}</h1>
        <p className="mt-1 text-sm text-neutral-500">{listing.address}</p>
      </div>

      {listing.photos.length > 0 && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {listing.photos.slice(0, 4).map((photo, i) => (
            <div
              key={photo.id}
              className={`relative h-64 overflow-hidden rounded-2xl bg-neutral-100 ${
                i === 0 && listing.photos.length > 1 ? "sm:col-span-2 sm:h-96" : ""
              }`}
            >
              <Image
                src={photo.url}
                alt={listing.title}
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-cover"
                priority={i === 0}
              />
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="flex flex-col gap-8 lg:col-span-2">
          <section>
            <h2 className="text-lg font-semibold text-neutral-900">Description</h2>
            <p className="mt-2 whitespace-pre-line text-neutral-700">{listing.description}</p>
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-neutral-600">
              <li>{listing.maxGuests} voyageurs max.</li>
              <li>{listing.bedrooms} chambre(s)</li>
              <li>{listing.beds} lit(s)</li>
              <li>{listing.bathrooms} salle(s) de bain</li>
            </ul>
          </section>

          {amenities.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-neutral-900">Équipements</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {amenities.map((a) => (
                  <span
                    key={a}
                    className="rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-700"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-lg font-semibold text-neutral-900">Disponibilités</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Calendrier synchronisé avec Airbnb et Booking.com.
            </p>
            <div className="mt-3">
              <AvailabilityCalendar unavailableDates={unavailableDates} />
            </div>
          </section>

          <section className="rounded-2xl bg-neutral-100 p-4 text-sm text-neutral-600">
            <p className="font-medium text-neutral-800">Tarifs</p>
            <p className="mt-1">
              {formatPrice(listing.pricePerNight)} / nuit
              {listing.cleaningFee > 0 && (
                <> + {formatPrice(listing.cleaningFee)} de frais de ménage par séjour</>
              )}
            </p>
          </section>
        </div>

        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-6">
            <BookingForm
              listingId={listing.id}
              pricePerNight={listing.pricePerNight}
              maxGuests={listing.maxGuests}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
