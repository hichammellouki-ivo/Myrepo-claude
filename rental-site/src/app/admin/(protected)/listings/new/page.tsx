import { createListingAction } from "@/actions/admin-listings";
import { ListingForm } from "@/components/ListingForm";

export default function NewListingPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Ajouter une annonce</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Remplissez les informations principales de votre appartement. Vous pourrez
          ensuite ajouter la synchronisation des calendriers Airbnb / Booking.com.
        </p>
      </div>
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <ListingForm action={createListingAction} submitLabel="Créer l'annonce" />
      </div>
    </div>
  );
}
