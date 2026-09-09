import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { resolveUploadPath, mimeTypeForPath, UploadError } from "@/lib/uploads";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { path: segments } = await params;
  const relativePath = segments.join("/");

  try {
    const filePath = resolveUploadPath(relativePath);
    const buffer = await readFile(filePath);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": mimeTypeForPath(relativePath),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Fichier introuvable." }, { status: 404 });
  }
}
