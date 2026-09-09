import { PublicNav } from "@/components/PublicNav";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
      <footer className="border-t border-neutral-200 bg-white py-6 text-center text-sm text-neutral-500">
        Locations courte durée — synchronisation Airbnb & Booking.com incluse.
      </footer>
    </div>
  );
}
