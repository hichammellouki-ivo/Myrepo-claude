"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { saveCheckInDocument, UploadError } from "@/lib/uploads";
import { revalidatePath } from "next/cache";

export type CheckInBookingSummary = {
  bookingId: string;
  reference: string;
  listingTitle: string;
  startDate: string;
  endDate: string;
  checkInStatus: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  accessCode: string | null;
  accessDetails: string | null;
  rejectionReason: string | null;
};

export type LookupState = {
  error: string | null;
  booking: CheckInBookingSummary | null;
};

const lookupSchema = z.object({
  reference: z.string().trim().min(1, "Merci d'indiquer votre référence de réservation."),
  email: z.string().trim().email("Adresse e-mail invalide."),
});

export async function lookupCheckInBookingAction(
  _prevState: LookupState,
  formData: FormData
): Promise<LookupState> {
  const parsed = lookupSchema.safeParse({
    reference: formData.get("reference"),
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide.", booking: null };
  }

  const reference = parsed.data.reference.toUpperCase();
  const booking = await prisma.booking.findUnique({
    where: { reference },
    include: { listing: true, checkIn: true },
  });

  if (
    !booking ||
    booking.guestEmail.toLowerCase() !== parsed.data.email.toLowerCase()
  ) {
    return {
      error:
        "Aucune réservation trouvée avec cette référence et cet e-mail. Vérifiez votre confirmation de réservation.",
      booking: null,
    };
  }

  if (booking.status === "CANCELLED") {
    return { error: "Cette réservation a été annulée.", booking: null };
  }

  return {
    error: null,
    booking: {
      bookingId: booking.id,
      reference: booking.reference,
      listingTitle: booking.listing.title,
      startDate: booking.startDate.toISOString(),
      endDate: booking.endDate.toISOString(),
      checkInStatus: booking.checkIn?.status ?? "NONE",
      accessCode: booking.checkIn?.status === "APPROVED" ? booking.checkIn.accessCode : null,
      accessDetails:
        booking.checkIn?.status === "APPROVED" ? booking.listing.accessDetails : null,
      rejectionReason:
        booking.checkIn?.status === "REJECTED" ? booking.checkIn.rejectionReason : null,
    },
  };
}

export type SubmitCheckInState = { error: string | null; success: boolean };

const submitSchema = z.object({
  bookingId: z.string().min(1),
  guestFullName: z.string().trim().min(2, "Merci d'indiquer le nom complet du voyageur."),
  documentType: z.enum(["ID_CARD", "PASSPORT", "DRIVER_LICENSE"]),
});

export async function submitCheckInAction(
  _prevState: SubmitCheckInState,
  formData: FormData
): Promise<SubmitCheckInState> {
  const parsed = submitSchema.safeParse({
    bookingId: formData.get("bookingId"),
    guestFullName: formData.get("guestFullName"),
    documentType: formData.get("documentType"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide.", success: false };
  }

  const { bookingId, guestFullName, documentType } = parsed.data;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { checkIn: true },
  });
  if (!booking) {
    return { error: "Réservation introuvable.", success: false };
  }
  if (booking.checkIn && booking.checkIn.status !== "REJECTED") {
    return { error: "Un check-in a déjà été soumis pour cette réservation.", success: false };
  }

  const frontFile = formData.get("documentFront");
  const backFile = formData.get("documentBack");

  if (!(frontFile instanceof File) || frontFile.size === 0) {
    return { error: "Merci de joindre une photo ou un scan de votre pièce d'identité.", success: false };
  }

  try {
    const frontPath = await saveCheckInDocument(booking.id, frontFile);
    const backPath =
      backFile instanceof File && backFile.size > 0
        ? await saveCheckInDocument(booking.id, backFile)
        : null;

    const checkInData = {
      guestFullName,
      documentType,
      documentFrontPath: frontPath,
      documentBackPath: backPath,
      status: "PENDING" as const,
      rejectionReason: null,
      accessCode: null,
      submittedAt: new Date(),
      reviewedAt: null,
      reviewedByAdminId: null,
    };

    const checkIn = await prisma.checkIn.upsert({
      where: { bookingId: booking.id },
      create: { bookingId: booking.id, ...checkInData },
      update: checkInData,
    });

    await prisma.notification.create({
      data: {
        type: "CHECKIN_SUBMITTED",
        message: `Nouveau check-in à valider pour la réservation ${booking.reference} (${guestFullName}).`,
        checkInId: checkIn.id,
      },
    });

    revalidatePath("/admin/checkins");
    revalidatePath("/admin");

    return { error: null, success: true };
  } catch (error) {
    if (error instanceof UploadError) {
      return { error: error.message, success: false };
    }
    console.error("[checkin] échec de la soumission", error);
    return { error: "Une erreur est survenue lors de l'envoi. Merci de réessayer.", success: false };
  }
}
