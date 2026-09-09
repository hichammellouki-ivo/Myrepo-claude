import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateListingIcs } from "@/lib/ical";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const listing = await prisma.listing.findUnique({ where: { slug } });
  if (!listing) {
    return NextResponse.json({ error: "Annonce introuvable." }, { status: 404 });
  }

  const ics = await generateListingIcs(listing.id);

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${listing.slug}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
