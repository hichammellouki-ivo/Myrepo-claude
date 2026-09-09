import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Locations courte durée",
  description:
    "Plateforme de gestion et de réservation d'appartements en location courte durée.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased">
        {children}
      </body>
    </html>
  );
}
