import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";
import type { Admin } from "@/generated/prisma/client";

export async function getCurrentAdmin(): Promise<Admin | null> {
  const session = await getAdminSession();
  if (!session) return null;
  return prisma.admin.findUnique({ where: { id: session.adminId } });
}
