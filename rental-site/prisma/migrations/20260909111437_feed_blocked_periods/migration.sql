-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BlockedPeriod" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listingId" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "source" TEXT NOT NULL,
    "calendarFeedId" TEXT,
    "externalUid" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BlockedPeriod_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BlockedPeriod_calendarFeedId_fkey" FOREIGN KEY ("calendarFeedId") REFERENCES "CalendarFeed" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_BlockedPeriod" ("createdAt", "endDate", "externalUid", "id", "listingId", "note", "source", "startDate") SELECT "createdAt", "endDate", "externalUid", "id", "listingId", "note", "source", "startDate" FROM "BlockedPeriod";
DROP TABLE "BlockedPeriod";
ALTER TABLE "new_BlockedPeriod" RENAME TO "BlockedPeriod";
CREATE INDEX "BlockedPeriod_listingId_startDate_endDate_idx" ON "BlockedPeriod"("listingId", "startDate", "endDate");
CREATE UNIQUE INDEX "BlockedPeriod_calendarFeedId_externalUid_key" ON "BlockedPeriod"("calendarFeedId", "externalUid");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
