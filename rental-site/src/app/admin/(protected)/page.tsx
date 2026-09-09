import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { markAllNotificationsReadAction } from "@/actions/admin-checkins";

export default async function AdminDashboardPage() {
  const [listingCount, pendingCheckIns, upcomingBookings, notifications] = await Promise.all([
    prisma.listing.count(),
    prisma.checkIn.count({ where: { status: "PENDING" } }),
    prisma.booking.count({ where: { status: { in: ["PENDING", "CONFIRMED"] }, endDate: { gte: new Date() } } }),
    prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      include: { checkIn: { include: { booking: { include: { listing: true } } } } },
    }),
  ]);

  const stats = [
    { label: "Annonces publiées", value: listingCount, href: "/admin/listings" },
    { label: "Check-ins en attente", value: pendingCheckIns, href: "/admin/checkins" },
    { label: "Séjours à venir", value: upcomingBookings, href: "/admin/bookings" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Tableau de bord</h1>
        <p className="mt-1 text-sm text-neutral-600">Vue d&apos;ensemble de votre activité.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <p className="text-3xl font-bold text-neutral-900">{stat.value}</p>
            <p className="mt-1 text-sm text-neutral-500">{stat.label}</p>
          </Link>
        ))}
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-neutral-900">Notifications</h2>
          {notifications.some((n) => !n.read) && (
            <form action={markAllNotificationsReadAction}>
              <button type="submit" className="text-xs text-neutral-500 hover:underline">
                Tout marquer comme lu
              </button>
            </form>
          )}
        </div>
        {notifications.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">Aucune notification pour le moment.</p>
        ) : (
          <ul className="mt-3 flex flex-col divide-y divide-neutral-100">
            {notifications.map((notification) => (
              <li key={notification.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className={notification.read ? "text-neutral-500" : "font-medium text-neutral-900"}>
                    {notification.message}
                  </p>
                  <p className="text-xs text-neutral-400">{formatDate(notification.createdAt)}</p>
                </div>
                {!notification.read && (
                  <Link
                    href="/admin/checkins"
                    className="shrink-0 rounded-full bg-neutral-900 px-3 py-1 text-xs font-medium text-white"
                  >
                    Traiter
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
