import { prisma } from "@/lib/prisma";

/** Une nuitée du [start, end) est occupée si elle chevauche une période existante. */
export function rangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export type UnavailablePeriod = {
  startDate: Date;
  endDate: Date;
};

/** Récupère toutes les périodes indisponibles (réservations confirmées/en attente + blocages) pour une annonce. */
export async function getUnavailablePeriods(
  listingId: string
): Promise<UnavailablePeriod[]> {
  const [bookings, blocks] = await Promise.all([
    prisma.booking.findMany({
      where: {
        listingId,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      select: { startDate: true, endDate: true },
    }),
    prisma.blockedPeriod.findMany({
      where: { listingId },
      select: { startDate: true, endDate: true },
    }),
  ]);

  return [...bookings, ...blocks];
}

export async function isRangeAvailable(
  listingId: string,
  startDate: Date,
  endDate: Date
): Promise<boolean> {
  const periods = await getUnavailablePeriods(listingId);
  return !periods.some((p) =>
    rangesOverlap(startDate, endDate, p.startDate, p.endDate)
  );
}

export function nightsBetween(startDate: Date, endDate: Date): number {
  const ms = endDate.getTime() - startDate.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}
