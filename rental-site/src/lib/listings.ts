import { prisma } from "@/lib/prisma";
import { isRangeAvailable } from "@/lib/availability";

export type ListingFilters = {
  city?: string;
  guests?: number;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  amenities?: string[];
  startDate?: string;
  endDate?: string;
};

export async function searchListings(filters: ListingFilters) {
  const listings = await prisma.listing.findMany({
    where: {
      active: true,
      ...(filters.city ? { city: { contains: filters.city } } : {}),
      ...(filters.guests ? { maxGuests: { gte: filters.guests } } : {}),
      ...(filters.bedrooms ? { bedrooms: { gte: filters.bedrooms } } : {}),
      ...(filters.minPrice ? { pricePerNight: { gte: filters.minPrice } } : {}),
      ...(filters.maxPrice ? { pricePerNight: { lte: filters.maxPrice } } : {}),
    },
    include: { photos: { orderBy: { position: "asc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });

  let results = listings;

  if (filters.amenities && filters.amenities.length > 0) {
    results = results.filter((listing) => {
      const listingAmenities: string[] = JSON.parse(listing.amenities || "[]");
      return filters.amenities!.every((a) => listingAmenities.includes(a));
    });
  }

  if (filters.startDate && filters.endDate) {
    const start = new Date(filters.startDate + "T00:00:00.000Z");
    const end = new Date(filters.endDate + "T00:00:00.000Z");
    if (end > start) {
      const availability = await Promise.all(
        results.map((listing) => isRangeAvailable(listing.id, start, end))
      );
      results = results.filter((_, index) => availability[index]);
    }
  }

  return results;
}
