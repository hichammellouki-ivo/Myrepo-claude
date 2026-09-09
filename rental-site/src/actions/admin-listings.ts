"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { saveListingPhoto, UploadError } from "@/lib/uploads";
import { syncCalendarFeed } from "@/lib/ical";

async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Non autorisé.");
  return admin;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function uniqueSlug(title: string, excludeId?: string): Promise<string> {
  const base = slugify(title) || "annonce";
  let slug = base;
  let attempt = 1;
  for (;;) {
    const existing = await prisma.listing.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    attempt += 1;
    slug = `${base}-${attempt}`;
  }
}

const listingSchema = z.object({
  title: z.string().trim().min(3, "Le titre doit contenir au moins 3 caractères."),
  description: z.string().trim().min(10, "Merci de rédiger une description."),
  address: z.string().trim().min(3, "Merci d'indiquer l'adresse."),
  city: z.string().trim().min(2, "Merci d'indiquer la ville."),
  country: z.string().trim().min(2, "Merci d'indiquer le pays."),
  pricePerNight: z.coerce.number().positive("Le prix par nuit doit être positif."),
  cleaningFee: z.coerce.number().min(0).default(0),
  maxGuests: z.coerce.number().int().min(1),
  bedrooms: z.coerce.number().int().min(0),
  bathrooms: z.coerce.number().int().min(0),
  beds: z.coerce.number().int().min(1),
  accessDetails: z.string().trim().optional().default(""),
});

export type ListingFormState = { error: string | null };

function readListingFields(formData: FormData) {
  return listingSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    address: formData.get("address"),
    city: formData.get("city"),
    country: formData.get("country"),
    pricePerNight: formData.get("pricePerNight"),
    cleaningFee: formData.get("cleaningFee") || 0,
    maxGuests: formData.get("maxGuests"),
    bedrooms: formData.get("bedrooms"),
    bathrooms: formData.get("bathrooms"),
    beds: formData.get("beds"),
    accessDetails: formData.get("accessDetails") || "",
  });
}

export async function createListingAction(
  _prevState: ListingFormState,
  formData: FormData
): Promise<ListingFormState> {
  await requireAdmin();
  const parsed = readListingFields(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const amenities = formData.getAll("amenities").map((v) => String(v));
  const slug = await uniqueSlug(parsed.data.title);

  const listing = await prisma.listing.create({
    data: {
      ...parsed.data,
      slug,
      amenities: JSON.stringify(amenities),
    },
  });

  const photos = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  let position = 0;
  for (const photo of photos) {
    try {
      const url = await saveListingPhoto(listing.id, photo);
      await prisma.photo.create({ data: { listingId: listing.id, url, position: position++ } });
    } catch (error) {
      if (!(error instanceof UploadError)) throw error;
    }
  }

  revalidatePath("/annonces");
  revalidatePath("/admin/listings");
  redirect(`/admin/listings/${listing.id}`);
}

export async function updateListingAction(
  _prevState: ListingFormState,
  formData: FormData
): Promise<ListingFormState> {
  await requireAdmin();
  const listingId = String(formData.get("listingId") || "");
  const parsed = readListingFields(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const existing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!existing) {
    return { error: "Annonce introuvable." };
  }

  const amenities = formData.getAll("amenities").map((v) => String(v));
  const active = formData.get("active") === "on";

  const slug =
    existing.title === parsed.data.title
      ? existing.slug
      : await uniqueSlug(parsed.data.title, listingId);

  await prisma.listing.update({
    where: { id: listingId },
    data: {
      ...parsed.data,
      slug,
      active,
      amenities: JSON.stringify(amenities),
    },
  });

  const photos = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (photos.length > 0) {
    const maxPosition = await prisma.photo.count({ where: { listingId } });
    let position = maxPosition;
    for (const photo of photos) {
      try {
        const url = await saveListingPhoto(listingId, photo);
        await prisma.photo.create({ data: { listingId, url, position: position++ } });
      } catch (error) {
        if (!(error instanceof UploadError)) throw error;
      }
    }
  }

  revalidatePath("/annonces");
  revalidatePath(`/annonces/${slug}`);
  revalidatePath("/admin/listings");
  revalidatePath(`/admin/listings/${listingId}`);

  return { error: null };
}

export async function deletePhotoAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const photoId = String(formData.get("photoId") || "");
  const listingId = String(formData.get("listingId") || "");
  await prisma.photo.delete({ where: { id: photoId } });
  revalidatePath(`/admin/listings/${listingId}`);
  revalidatePath("/annonces");
}

export async function addCalendarFeedAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const listingId = String(formData.get("listingId") || "");
  const platform = String(formData.get("platform") || "OTHER") as "AIRBNB" | "BOOKING" | "OTHER";
  const icalUrl = String(formData.get("icalUrl") || "").trim();

  if (!icalUrl) return;

  const feed = await prisma.calendarFeed.create({
    data: { listingId, platform, icalUrl },
  });

  try {
    await syncCalendarFeed(feed.id);
  } catch (error) {
    console.error("[admin-listings] échec de la première synchronisation du calendrier", error);
  }

  revalidatePath(`/admin/listings/${listingId}`);
}

export async function deleteCalendarFeedAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const feedId = String(formData.get("feedId") || "");
  const listingId = String(formData.get("listingId") || "");
  await prisma.calendarFeed.delete({ where: { id: feedId } });
  revalidatePath(`/admin/listings/${listingId}`);
}

export async function syncCalendarFeedAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const feedId = String(formData.get("feedId") || "");
  const listingId = String(formData.get("listingId") || "");
  try {
    await syncCalendarFeed(feedId);
  } catch (error) {
    console.error("[admin-listings] échec de synchronisation", error);
  }
  revalidatePath(`/admin/listings/${listingId}`);
}

export async function addManualBlockAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const listingId = String(formData.get("listingId") || "");
  const startDate = String(formData.get("startDate") || "");
  const endDate = String(formData.get("endDate") || "");
  const note = String(formData.get("note") || "").trim() || null;

  if (!startDate || !endDate) return;

  await prisma.blockedPeriod.create({
    data: {
      listingId,
      startDate: new Date(startDate + "T00:00:00.000Z"),
      endDate: new Date(endDate + "T00:00:00.000Z"),
      source: "MANUAL",
      note,
    },
  });

  revalidatePath(`/admin/listings/${listingId}`);
}

export async function deleteBlockedPeriodAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const blockId = String(formData.get("blockId") || "");
  const listingId = String(formData.get("listingId") || "");
  await prisma.blockedPeriod.delete({ where: { id: blockId } });
  revalidatePath(`/admin/listings/${listingId}`);
}
