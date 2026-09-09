import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

// Stocké hors de /public : les pièces d'identité ne doivent jamais être servies
// directement en statique, seulement via une route protégée par l'authentification admin.
const UPLOADS_ROOT = path.join(process.cwd(), "uploads");

// Photos d'annonces : non sensibles, servies directement en statique par Next.js.
const PUBLIC_UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024; // 10 Mo

export class UploadError extends Error {}

export async function saveCheckInDocument(
  bookingId: string,
  file: File
): Promise<string> {
  if (!(file instanceof File) || file.size === 0) {
    throw new UploadError("Fichier manquant.");
  }
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new UploadError("Le fichier dépasse la taille maximale autorisée (10 Mo).");
  }
  const extension = ALLOWED_TYPES[file.type];
  if (!extension) {
    throw new UploadError(
      "Format de fichier non supporté. Utilisez une image (JPEG, PNG, WebP) ou un PDF."
    );
  }

  const dir = path.join(UPLOADS_ROOT, "checkins", bookingId);
  await mkdir(dir, { recursive: true });

  const filename = `${randomUUID()}.${extension}`;
  const filePath = path.join(dir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  // Chemin relatif stocké en base, servi via /api/uploads/[...path]
  return path.join("checkins", bookingId, filename);
}

export async function saveListingPhoto(listingId: string, file: File): Promise<string> {
  if (!(file instanceof File) || file.size === 0) {
    throw new UploadError("Fichier manquant.");
  }
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new UploadError("Le fichier dépasse la taille maximale autorisée (10 Mo).");
  }
  const extension = ALLOWED_IMAGE_TYPES[file.type];
  if (!extension) {
    throw new UploadError("Format d'image non supporté. Utilisez JPEG, PNG ou WebP.");
  }

  const dir = path.join(PUBLIC_UPLOADS_ROOT, "listings", listingId);
  await mkdir(dir, { recursive: true });

  const filename = `${randomUUID()}.${extension}`;
  await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));

  return `/uploads/listings/${listingId}/${filename}`;
}

export function resolveUploadPath(relativePath: string): string {
  const resolved = path.normalize(path.join(UPLOADS_ROOT, relativePath));
  if (!resolved.startsWith(UPLOADS_ROOT)) {
    throw new UploadError("Chemin de fichier invalide.");
  }
  return resolved;
}

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  pdf: "application/pdf",
};

export function mimeTypeForPath(relativePath: string): string {
  const ext = relativePath.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXTENSION[ext] || "application/octet-stream";
}
