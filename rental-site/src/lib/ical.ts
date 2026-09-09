import ical, { type VEvent, type CalendarComponent } from "node-ical";
import { prisma } from "@/lib/prisma";

function toIcsDate(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

function foldLine(line: string): string {
  // RFC 5545: replie les lignes de plus de 75 octets.
  if (line.length <= 75) return line;
  let result = line.slice(0, 75);
  let rest = line.slice(75);
  while (rest.length > 0) {
    result += "\r\n " + rest.slice(0, 74);
    rest = rest.slice(74);
  }
  return result;
}

/**
 * Génère le flux iCal (.ics) exportable d'une annonce : réservations internes
 * confirmées/en attente + blocages manuels. À coller dans Airbnb / Booking.com
 * pour synchroniser le calendrier ("Importer un calendrier").
 */
export async function generateListingIcs(listingId: string): Promise<string> {
  const [bookings, blocks] = await Promise.all([
    prisma.booking.findMany({
      where: { listingId, status: { in: ["PENDING", "CONFIRMED"] } },
    }),
    prisma.blockedPeriod.findMany({
      where: { listingId, source: "MANUAL" },
    }),
  ]);

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LocationCourteDuree//FR",
    "CALSCALE:GREGORIAN",
  ];

  const now = toIcsDate(new Date());

  for (const booking of bookings) {
    lines.push(
      foldLine("BEGIN:VEVENT"),
      foldLine(`UID:booking-${booking.id}@location-courte-duree`),
      foldLine(`DTSTAMP:${now}T000000Z`),
      foldLine(`DTSTART;VALUE=DATE:${toIcsDate(booking.startDate)}`),
      foldLine(`DTEND;VALUE=DATE:${toIcsDate(booking.endDate)}`),
      foldLine(`SUMMARY:Réservé (${booking.reference})`),
      foldLine("END:VEVENT")
    );
  }

  for (const block of blocks) {
    lines.push(
      foldLine("BEGIN:VEVENT"),
      foldLine(`UID:block-${block.id}@location-courte-duree`),
      foldLine(`DTSTAMP:${now}T000000Z`),
      foldLine(`DTSTART;VALUE=DATE:${toIcsDate(block.startDate)}`),
      foldLine(`DTEND;VALUE=DATE:${toIcsDate(block.endDate)}`),
      foldLine(`SUMMARY:Indisponible${block.note ? " - " + block.note : ""}`),
      foldLine("END:VEVENT")
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export type SyncResult = {
  imported: number;
  removed: number;
};

/**
 * Synchronise un flux iCal externe (Airbnb / Booking.com) : importe les
 * événements comme périodes bloquées, et retire celles qui ont disparu du
 * flux distant (annulations).
 */
export async function syncCalendarFeed(feedId: string): Promise<SyncResult> {
  const feed = await prisma.calendarFeed.findUniqueOrThrow({
    where: { id: feedId },
  });

  try {
    const data = await ical.async.fromURL(feed.icalUrl);
    const events = Object.values(data).filter(
      (entry: CalendarComponent | undefined): entry is VEvent => entry?.type === "VEVENT"
    );

    const seenUids: string[] = [];

    for (const event of events) {
      const start = event.start ? new Date(event.start) : null;
      const end = event.end ? new Date(event.end) : start;
      if (!start || !end) continue;

      const uid = event.uid || `${start.toISOString()}-${end.toISOString()}`;
      seenUids.push(uid);

      await prisma.blockedPeriod.upsert({
        where: { calendarFeedId_externalUid: { calendarFeedId: feed.id, externalUid: uid } },
        create: {
          listingId: feed.listingId,
          calendarFeedId: feed.id,
          externalUid: uid,
          source: feed.platform,
          startDate: start,
          endDate: end,
          note: event.summary ? String(event.summary) : null,
        },
        update: {
          startDate: start,
          endDate: end,
          note: event.summary ? String(event.summary) : null,
        },
      });
    }

    const removed = await prisma.blockedPeriod.deleteMany({
      where: {
        calendarFeedId: feed.id,
        externalUid: { notIn: seenUids.length > 0 ? seenUids : ["__none__"] },
      },
    });

    await prisma.calendarFeed.update({
      where: { id: feed.id },
      data: { lastSyncAt: new Date(), lastSyncStatus: "OK", lastSyncError: null },
    });

    return { imported: seenUids.length, removed: removed.count };
  } catch (error) {
    await prisma.calendarFeed.update({
      where: { id: feed.id },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: "ERROR",
        lastSyncError: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  }
}

export async function syncAllCalendarFeeds(): Promise<void> {
  const feeds = await prisma.calendarFeed.findMany({ select: { id: true } });
  for (const feed of feeds) {
    try {
      await syncCalendarFeed(feed.id);
    } catch (error) {
      console.error(`[ical] échec de synchronisation du flux ${feed.id}`, error);
    }
  }
}
