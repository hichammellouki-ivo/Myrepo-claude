"use client";

import { useActionState } from "react";
import {
  lookupCheckInBookingAction,
  submitCheckInAction,
  type LookupState,
  type SubmitCheckInState,
} from "@/actions/checkin";
import { formatDate } from "@/lib/format";

const initialLookupState: LookupState = { error: null, booking: null };
const initialSubmitState: SubmitCheckInState = { error: null, success: false };

export function CheckInFlow() {
  const [lookupState, lookupAction, lookupPending] = useActionState(
    lookupCheckInBookingAction,
    initialLookupState
  );
  const [submitState, submitAction, submitPending] = useActionState(
    submitCheckInAction,
    initialSubmitState
  );
  if (!lookupState.booking) {
    return (
      <form
        action={lookupAction}
        className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
      >
        <p className="text-sm text-neutral-600">
          Retrouvez votre réservation à l&apos;aide de la référence reçue lors de votre
          réservation et de l&apos;adresse e-mail utilisée.
        </p>
        <div className="flex flex-col gap-1">
          <label htmlFor="reference" className="text-xs font-medium text-neutral-600">
            Référence de réservation
          </label>
          <input
            id="reference"
            name="reference"
            type="text"
            placeholder="RES-XXXXXX"
            required
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm uppercase"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-xs font-medium text-neutral-600">
            E-mail utilisé pour la réservation
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        {lookupState.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {lookupState.error}
          </p>
        )}
        <button
          type="submit"
          disabled={lookupPending}
          className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
        >
          {lookupPending ? "Recherche..." : "Retrouver ma réservation"}
        </button>
      </form>
    );
  }

  const booking = lookupState.booking;
  const status = submitState.success ? "PENDING" : booking.checkInStatus;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div>
        <p className="text-sm text-neutral-500">Réservation {booking.reference}</p>
        <h3 className="text-lg font-semibold text-neutral-900">{booking.listingTitle}</h3>
        <p className="text-sm text-neutral-500">
          Du {formatDate(booking.startDate)} au {formatDate(booking.endDate)}
        </p>
      </div>

      {status === "APPROVED" && (
        <div className="rounded-xl bg-green-50 p-4 text-green-900">
          <p className="font-medium">Check-in validé ✅</p>
          <p className="mt-2 text-sm">
            Code d&apos;accès : <strong>{booking.accessCode}</strong>
          </p>
          {booking.accessDetails && (
            <p className="mt-2 whitespace-pre-line text-sm">{booking.accessDetails}</p>
          )}
        </div>
      )}

      {status === "PENDING" && (
        <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          Votre check-in a bien été soumis et est en attente de validation par
          l&apos;administrateur. Vous recevrez votre code d&apos;accès par e-mail dès qu&apos;il
          sera validé.
        </div>
      )}

      {(status === "NONE" || status === "REJECTED") && (
        <>
          {status === "REJECTED" && booking.rejectionReason && (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-800">
              Votre précédent envoi n&apos;a pas pu être validé : {booking.rejectionReason}
              <br />
              Merci de soumettre à nouveau votre pièce d&apos;identité ci-dessous.
            </div>
          )}

          <form action={submitAction} className="flex flex-col gap-4">
            <input type="hidden" name="bookingId" value={booking.bookingId} />

            <div className="flex flex-col gap-1">
              <label htmlFor="guestFullName" className="text-xs font-medium text-neutral-600">
                Nom complet du voyageur (tel qu&apos;indiqué sur la pièce d&apos;identité)
              </label>
              <input
                id="guestFullName"
                name="guestFullName"
                type="text"
                required
                className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="documentType" className="text-xs font-medium text-neutral-600">
                Type de pièce d&apos;identité
              </label>
              <select
                id="documentType"
                name="documentType"
                required
                className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              >
                <option value="ID_CARD">Carte d&apos;identité</option>
                <option value="PASSPORT">Passeport</option>
                <option value="DRIVER_LICENSE">Permis de conduire</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="documentFront" className="text-xs font-medium text-neutral-600">
                Photo / scan (recto)
              </label>
              <input
                id="documentFront"
                name="documentFront"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                required
                className="text-sm"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="documentBack" className="text-xs font-medium text-neutral-600">
                Photo / scan (verso, si applicable)
              </label>
              <input
                id="documentBack"
                name="documentBack"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="text-sm"
              />
            </div>

            {submitState.error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {submitState.error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitPending}
              className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
            >
              {submitPending ? "Envoi en cours..." : "Envoyer ma pièce d'identité"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
