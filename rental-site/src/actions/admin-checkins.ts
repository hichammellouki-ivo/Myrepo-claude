"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { generateAccessCode } from "@/lib/codes";
import { sendMail } from "@/lib/mailer";

async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Non autorisé.");
  return admin;
}

export async function approveCheckInAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const checkInId = String(formData.get("checkInId") || "");
  const manualCode = String(formData.get("accessCode") || "").trim();

  const checkIn = await prisma.checkIn.findUniqueOrThrow({
    where: { id: checkInId },
    include: { booking: { include: { listing: true } } },
  });

  const accessCode = manualCode || generateAccessCode();

  await prisma.checkIn.update({
    where: { id: checkInId },
    data: {
      status: "APPROVED",
      accessCode,
      reviewedAt: new Date(),
      reviewedByAdminId: admin.id,
      rejectionReason: null,
    },
  });

  await prisma.notification.updateMany({
    where: { checkInId },
    data: { read: true },
  });

  const { booking } = checkIn;
  const subject = `Votre check-in est validé — code d'accès pour ${booking.listing.title}`;
  const body = [
    `Bonjour ${booking.guestName},`,
    "",
    `Votre check-in pour le séjour "${booking.listing.title}" a été validé.`,
    "",
    `Code d'accès : ${accessCode}`,
    "",
    "Détails d'accès au logement :",
    booking.listing.accessDetails || "Aucune instruction particulière.",
    "",
    `Adresse : ${booking.listing.address}, ${booking.listing.city}`,
    `Référence de réservation : ${booking.reference}`,
    "",
    "Nous vous souhaitons un excellent séjour !",
  ].join("\n");

  await sendMail({ bookingId: booking.id, to: booking.guestEmail, subject, body });

  revalidatePath("/admin/checkins");
  revalidatePath("/admin");
}

export async function rejectCheckInAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const checkInId = String(formData.get("checkInId") || "");
  const reason = String(formData.get("reason") || "").trim() || "Document illisible ou incomplet.";

  const checkIn = await prisma.checkIn.findUniqueOrThrow({
    where: { id: checkInId },
    include: { booking: { include: { listing: true } } },
  });

  await prisma.checkIn.update({
    where: { id: checkInId },
    data: {
      status: "REJECTED",
      rejectionReason: reason,
      reviewedAt: new Date(),
      reviewedByAdminId: admin.id,
      accessCode: null,
    },
  });

  await prisma.notification.updateMany({
    where: { checkInId },
    data: { read: true },
  });

  const { booking } = checkIn;
  const subject = `Action requise — check-in pour ${booking.listing.title}`;
  const body = [
    `Bonjour ${booking.guestName},`,
    "",
    "Votre check-in n'a pas pu être validé pour la raison suivante :",
    reason,
    "",
    `Merci de soumettre à nouveau votre pièce d'identité via l'onglet "Check-in" du site,`,
    `en indiquant votre référence de réservation ${booking.reference}.`,
  ].join("\n");

  await sendMail({ bookingId: booking.id, to: booking.guestEmail, subject, body });

  revalidatePath("/admin/checkins");
  revalidatePath("/admin");
}

export async function markNotificationReadAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("notificationId") || "");
  await prisma.notification.update({ where: { id }, data: { read: true } });
  revalidatePath("/admin");
}

export async function markAllNotificationsReadAction(): Promise<void> {
  await requireAdmin();
  await prisma.notification.updateMany({ where: { read: false }, data: { read: true } });
  revalidatePath("/admin");
}
