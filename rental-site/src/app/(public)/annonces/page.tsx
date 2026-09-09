import { searchListings } from "@/lib/listings";
import { ListingCard } from "@/components/ListingCard";
import { SearchFilters } from "@/components/SearchFilters";

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function toList(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export default async function AnnoncesPage({
  searchParams,
}: PageProps<"/annonces">) {
  const params = await searchParams;

  const city = first(params.city)?.trim() || undefined;
  const startDate = first(params.startDate) || undefined;
  const endDate = first(params.endDate) || undefined;
  const guestsRaw = first(params.guests);
  const bedroomsRaw = first(params.bedrooms);
  const minPriceRaw = first(params.minPrice);
  const maxPriceRaw = first(params.maxPrice);
  const amenities = toList(params.amenities);

  const listings = await searchListings({
    city,
    startDate,
    endDate,
    guests: guestsRaw ? Number(guestsRaw) : undefined,
    bedrooms: bedroomsRaw ? Number(bedroomsRaw) : undefined,
    minPrice: minPriceRaw ? Number(minPriceRaw) : undefined,
    maxPrice: maxPriceRaw ? Number(maxPriceRaw) : undefined,
    amenities,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Annonces disponibles</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Utilisez les filtres pour trouver l&apos;appartement qui correspond à vos besoins.
        </p>
      </div>

      <SearchFilters
        values={{
          city,
          startDate,
          endDate,
          guests: guestsRaw,
          bedrooms: bedroomsRaw,
          minPrice: minPriceRaw,
          maxPrice: maxPriceRaw,
          amenities,
        }}
      />

      {listings.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-300 p-8 text-center text-neutral-500">
          Aucune annonce ne correspond à votre recherche. Essayez d&apos;élargir vos critères.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
