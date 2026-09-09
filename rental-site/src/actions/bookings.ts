"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isRangeAvailable, nightsBetween } from "@/lib/availability";
import { generateBookingReference } from "@/lib/codes";
import { revalidatePath } from "next/cache";

export type BookingState = {
  error: string | null;
  success: { reference: string; total: number; nights: number } | null;
};

const bookingSchema = z
  .object({
    listingId: z.string().min(1),
    guestName: z.string().trim().min(2, "Merci d'indiquer votre nom complet."),
    guestEmail: z.string().trim().email("Adresse e-mail invalide."),
    guestPhone: z.string().trim().min(6, "Merci d'indiquer un numéro de téléphone valide."),
    startDate: z.string().min(1, "Merci de choisir une date d'arrivée."),
    endDate: z.string().min(1, "Merci de choisir une date de départ."),
    guests: z.coerce.number().int().min(1, "Au moins 1 voyageur est requis."),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: "La date de départ doit être postérieure à la date d'arrivée.",
    path: ["endDate"],
  });

export async function createBookingAction(
  _prevState: BookingState,
  formData: FormData
): Promise<BookingState> {
  const parsed = bookingSchema.safeParse({
    listingId: formData.get("listingId"),
    guestName: formData.get("guestName"),
    guestEmail: formData.get("guestEmail"),
    guestPhone: formData.get("guestPhone"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    guests: formData.get("guests"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide.", success: null };
  }

  const { listingId, guestName, guestEmail, guestPhone, guests } = parsed.data;
  const startDate = new Date(parsed.data.startDate + "T00:00:00.000Z");
  const endDate = new Date(parsed.data.endDate + "T00:00:00.000Z");

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing || !listing.active) {
    return { error: "Cette annonce n'est plus disponible.", success: null };
  }

  if (guests > listing.maxGuests) {
    return {
      error: `Cette annonce accueille au maximum ${listing.maxGuests} voyageur(s).`,
      success: null,
    };
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (startDate < today) {
    return { error: "La date d'arrivée ne peut pas être dans le passé.", success: null };
  }

  const available = await isRangeAvailable(listingId, startDate, endDate);
  if (!available) {
    return {
      error: "Ces dates ne sont plus disponibles pour cette annonce. Merci d'en choisir d'autres.",
      success: null,
    };
  }

  const nights = nightsBetween(startDate, endDate);
  const total = Math.round((nights * listing.pricePerNight + listing.cleaningFee) * 100) / 100;

  let reference = generateBookingReference();
  for (let attempt = 0; attempt < 5; attempt++) {
    const exists = await prisma.booking.findUnique({ where: { reference } });
    if (!exists) break;
    reference = generateBookingReference();
  }

  await prisma.booking.create({
    data: {
      reference,
      listingId,
      guestName,
      guestEmail,
      guestPhone,
      startDate,
      endDate,
      guests,
      totalPrice: total,
      status: "CONFIRMED",
    },
  });

  revalidatePath(`/annonces/${listing.slug}`);

  return { error: null, success: { reference, total, nights } };
}
