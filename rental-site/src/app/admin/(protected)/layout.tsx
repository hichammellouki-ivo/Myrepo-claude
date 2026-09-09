import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { logoutAction } from "@/actions/auth";

const navItems = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/listings", label: "Annonces" },
  { href: "/admin/checkins", label: "Check-ins" },
  { href: "/admin/bookings", label: "Réservations" },
];

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect("/admin/login");
  }

  const pendingCount = await prisma.notification.count({ where: { read: false } });

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 p-4 sm:flex-row sm:p-6">
      <aside className="flex shrink-0 flex-col gap-1 sm:w-56">
        <div className="mb-4">
          <p className="text-sm text-neutral-500">Connecté en tant que</p>
          <p className="truncate font-medium text-neutral-900">{admin.name}</p>
        </div>
        <nav className="flex flex-row gap-1 overflow-x-auto sm:flex-col">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-white"
            >
              {item.label}
              {item.href === "/admin/checkins" && pendingCount > 0 && (
                <span className="ml-2 rounded-full bg-red-500 px-1.5 py-0.5 text-xs text-white">
                  {pendingCount}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <Link
          href="/"
          className="mt-4 rounded-lg px-3 py-2 text-sm text-neutral-500 hover:bg-white"
        >
          ← Retour au site
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-neutral-500 hover:bg-white"
          >
            Se déconnecter
          </button>
        </form>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
