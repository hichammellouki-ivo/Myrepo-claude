"use client";

import { useActionState } from "react";
import { createBookingAction, type BookingState } from "@/actions/bookings";
import { formatPrice } from "@/lib/format";

const initialState: BookingState = { error: null, success: null };

export function BookingForm({
  listingId,
  pricePerNight,
  maxGuests,
}: {
  listingId: string;
  pricePerNight: number;
  maxGuests: number;
}) {
  const [state, formAction, pending] = useActionState(createBookingAction, initialState);

  if (state.success) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-green-900">
        <h3 className="text-lg font-semibold">Réservation confirmée 🎉</h3>
        <p className="mt-2 text-sm">
          Votre réservation de {state.success.nights} nuit
          {state.success.nights > 1 ? "s" : ""} est confirmée pour un total de{" "}
          <strong>{formatPrice(state.success.total)}</strong>.
        </p>
        <p className="mt-3 rounded-lg bg-white/70 p-3 text-sm">
          Référence de réservation : <strong>{state.success.reference}</strong>
          <br />
          Conservez-la précieusement : elle vous sera demandée lors de votre check-in
          en ligne (onglet &laquo; Check-in &raquo;).
        </p>
        <a
          href="/checkin"
          className="mt-4 inline-block rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-neutral-700"
        >
          Faire mon check-in maintenant →
        </a>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
    >
      <input type="hidden" name="listingId" value={listingId} />
      <h3 className="text-lg font-semibold text-neutral-900">
        Réserver — {formatPrice(pricePerNight)} / nuit
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="startDate" className="text-xs font-medium text-neutral-600">
            Arrivée
          </label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            required
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
            required
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="guests" className="text-xs font-medium text-neutral-600">
          Nombre de voyageurs (max {maxGuests})
        </label>
        <input
          id="guests"
          name="guests"
          type="number"
          min={1}
          max={maxGuests}
          defaultValue={1}
          required
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="guestName" className="text-xs font-medium text-neutral-600">
          Nom complet
        </label>
        <input
          id="guestName"
          name="guestName"
          type="text"
          required
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="guestEmail" className="text-xs font-medium text-neutral-600">
            E-mail
          </label>
          <input
            id="guestEmail"
            name="guestEmail"
            type="email"
            required
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="guestPhone" className="text-xs font-medium text-neutral-600">
            Téléphone
          </label>
          <input
            id="guestPhone"
            name="guestPhone"
            type="tel"
            required
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Réservation en cours..." : "Réserver"}
      </button>
    </form>
  );
}
