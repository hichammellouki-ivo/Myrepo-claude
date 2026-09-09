import Link from "next/link";
import { KNOWN_AMENITIES } from "@/lib/amenities";

export type SearchFiltersValues = {
  city?: string;
  startDate?: string;
  endDate?: string;
  guests?: string;
  minPrice?: string;
  maxPrice?: string;
  bedrooms?: string;
  amenities?: string[];
};

export function SearchFilters({ values }: { values: SearchFiltersValues }) {
  const selectedAmenities = values.amenities ?? [];

  return (
    <form
      method="get"
      className="grid grid-cols-2 gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:grid-cols-3 lg:grid-cols-6"
    >
      <div className="col-span-2 flex flex-col gap-1 sm:col-span-1">
        <label htmlFor="city" className="text-xs font-medium text-neutral-600">
          Ville
        </label>
        <input
          id="city"
          name="city"
          type="text"
          placeholder="Paris, Lyon..."
          defaultValue={values.city}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="startDate" className="text-xs font-medium text-neutral-600">
          Arrivée
        </label>
        <input
          id="startDate"
          name="startDate"
          type="date"
          defaultValue={values.startDate}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="endDate" className="text-xs font-medium text-neutral-600">
          Départ
        </label>
        <input
          id="endDate"
          name="endDate"
          type="date"
          defaultValue={values.endDate}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="guests" className="text-xs font-medium text-neutral-600">
          Voyageurs
        </label>
        <input
          id="guests"
          name="guests"
          type="number"
          min={1}
          defaultValue={values.guests}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="bedrooms" className="text-xs font-medium text-neutral-600">
          Chambres min.
        </label>
        <input
          id="bedrooms"
          name="bedrooms"
          type="number"
          min={0}
          defaultValue={values.bedrooms}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-neutral-600">Budget / nuit</label>
        <div className="flex gap-2">
          <input
            name="minPrice"
            type="number"
            min={0}
            placeholder="Min"
            defaultValue={values.minPrice}
            className="w-1/2 rounded-lg border border-neutral-300 px-2 py-2 text-sm"
          />
          <input
            name="maxPrice"
            type="number"
            min={0}
            placeholder="Max"
            defaultValue={values.maxPrice}
            className="w-1/2 rounded-lg border border-neutral-300 px-2 py-2 text-sm"
          />
        </div>
      </div>

      <div className="col-span-2 flex flex-col gap-2 sm:col-span-3 lg:col-span-6">
        <span className="text-xs font-medium text-neutral-600">Équipements</span>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {KNOWN_AMENITIES.map((amenity) => (
            <label key={amenity} className="flex items-center gap-1.5 text-sm text-neutral-700">
              <input
                type="checkbox"
                name="amenities"
                value={amenity}
                defaultChecked={selectedAmenities.includes(amenity)}
                className="rounded border-neutral-300"
              />
              {amenity}
            </label>
          ))}
        </div>
      </div>

      <div className="col-span-2 flex items-end gap-2 sm:col-span-3 lg:col-span-6">
        <button
          type="submit"
          className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-neutral-700"
        >
          Rechercher
        </button>
        <Link
          href="/annonces"
          className="rounded-full border border-neutral-300 px-5 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100"
        >
          Réinitialiser
        </Link>
      </div>
    </form>
  );
}
