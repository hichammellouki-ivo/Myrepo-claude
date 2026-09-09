"use client";

import { useActionState } from "react";
import type { ListingFormState } from "@/actions/admin-listings";
import { KNOWN_AMENITIES } from "@/lib/amenities";

const initialState: ListingFormState = { error: null };

export type ListingFormDefaults = {
  id?: string;
  title: string;
  description: string;
  address: string;
  city: string;
  country: string;
  pricePerNight: number;
  cleaningFee: number;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  beds: number;
  accessDetails: string;
  amenities: string[];
  active: boolean;
};

const emptyDefaults: ListingFormDefaults = {
  title: "",
  description: "",
  address: "",
  city: "",
  country: "France",
  pricePerNight: 0,
  cleaningFee: 0,
  maxGuests: 2,
  bedrooms: 1,
  bathrooms: 1,
  beds: 1,
  accessDetails: "",
  amenities: [],
  active: true,
};

export function ListingForm({
  action,
  defaults = emptyDefaults,
  submitLabel = "Enregistrer",
  isEdit = false,
}: {
  action: (state: ListingFormState, formData: FormData) => Promise<ListingFormState>;
  defaults?: ListingFormDefaults;
  submitLabel?: string;
  isEdit?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {isEdit && defaults.id && <input type="hidden" name="listingId" value={defaults.id} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Titre de l'annonce" htmlFor="title">
          <input
            id="title"
            name="title"
            defaultValue={defaults.title}
            required
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm w-full"
          />
        </Field>
        <Field label="Ville" htmlFor="city">
          <input id="city" name="city" defaultValue={defaults.city} required className="rounded-lg border border-neutral-300 px-3 py-2 text-sm w-full" />
        </Field>
        <Field label="Adresse complète" htmlFor="address">
          <input
            id="address"
            name="address"
            defaultValue={defaults.address}
            required
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm w-full"
          />
        </Field>
        <Field label="Pays" htmlFor="country">
          <input
            id="country"
            name="country"
            defaultValue={defaults.country}
            required
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm w-full"
          />
        </Field>
      </div>

      <Field label="Description" htmlFor="description">
        <textarea
          id="description"
          name="description"
          defaultValue={defaults.description}
          required
          rows={4}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm w-full"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field label="Prix / nuit (€)" htmlFor="pricePerNight">
          <input
            id="pricePerNight"
            name="pricePerNight"
            type="number"
            step="0.01"
            min={0}
            defaultValue={defaults.pricePerNight}
            required
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm w-full"
          />
        </Field>
        <Field label="Frais de ménage (€)" htmlFor="cleaningFee">
          <input
            id="cleaningFee"
            name="cleaningFee"
            type="number"
            step="0.01"
            min={0}
            defaultValue={defaults.cleaningFee}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm w-full"
          />
        </Field>
        <Field label="Voyageurs max." htmlFor="maxGuests">
          <input
            id="maxGuests"
            name="maxGuests"
            type="number"
            min={1}
            defaultValue={defaults.maxGuests}
            required
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm w-full"
          />
        </Field>
        <Field label="Lits" htmlFor="beds">
          <input
            id="beds"
            name="beds"
            type="number"
            min={1}
            defaultValue={defaults.beds}
            required
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm w-full"
          />
        </Field>
        <Field label="Chambres" htmlFor="bedrooms">
          <input
            id="bedrooms"
            name="bedrooms"
            type="number"
            min={0}
            defaultValue={defaults.bedrooms}
            required
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm w-full"
          />
        </Field>
        <Field label="Salles de bain" htmlFor="bathrooms">
          <input
            id="bathrooms"
            name="bathrooms"
            type="number"
            min={0}
            defaultValue={defaults.bathrooms}
            required
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm w-full"
          />
        </Field>
      </div>

      <div>
        <span className="mb-1 block text-xs font-medium text-neutral-600">Équipements</span>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {KNOWN_AMENITIES.map((amenity) => (
            <label key={amenity} className="flex items-center gap-1.5 text-sm text-neutral-700">
              <input
                type="checkbox"
                name="amenities"
                value={amenity}
                defaultChecked={defaults.amenities.includes(amenity)}
                className="rounded border-neutral-300"
              />
              {amenity}
            </label>
          ))}
        </div>
      </div>

      <Field
        label="Détails d'accès (envoyés au voyageur après validation du check-in)"
        htmlFor="accessDetails"
      >
        <textarea
          id="accessDetails"
          name="accessDetails"
          defaultValue={defaults.accessDetails}
          rows={3}
          placeholder="Ex : Boîte à clés à l'entrée, digicode 1234..."
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm w-full"
        />
      </Field>

      <Field label="Ajouter des photos" htmlFor="photos">
        <input
          id="photos"
          name="photos"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="text-sm"
        />
      </Field>

      {isEdit && (
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            name="active"
            defaultChecked={defaults.active}
            className="rounded border-neutral-300"
          />
          Annonce publiée (visible sur le site)
        </label>
      )}

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Enregistrement..." : submitLabel}
      </button>

    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-xs font-medium text-neutral-600">
        {label}
      </label>
      {children}
    </div>
  );
}
