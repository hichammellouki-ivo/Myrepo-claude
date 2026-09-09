import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";

export type ListingCardData = {
  slug: string;
  title: string;
  city: string;
  country: string;
  pricePerNight: number;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  photos: { url: string }[];
};

export function ListingCard({ listing }: { listing: ListingCardData }) {
  const photo = listing.photos[0]?.url;

  return (
    <Link
      href={`/annonces/${listing.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="relative h-48 w-full bg-neutral-100">
        {photo ? (
          <Image
            src={photo}
            alt={listing.title}
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-neutral-400">
            Pas de photo
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="text-sm text-neutral-500">
          {listing.city}, {listing.country}
        </p>
        <h3 className="font-semibold text-neutral-900">{listing.title}</h3>
        <p className="text-sm text-neutral-500">
          {listing.maxGuests} voyageur{listing.maxGuests > 1 ? "s" : ""} ·{" "}
          {listing.bedrooms} chambre{listing.bedrooms > 1 ? "s" : ""} ·{" "}
          {listing.bathrooms} sdb
        </p>
        <p className="mt-2 font-semibold text-neutral-900">
          {formatPrice(listing.pricePerNight)}{" "}
          <span className="text-sm font-normal text-neutral-500">/ nuit</span>
        </p>
      </div>
    </Link>
  );
}
