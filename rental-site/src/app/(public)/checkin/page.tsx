import { CheckInFlow } from "@/components/CheckInFlow";

export default function CheckInPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Check-in en ligne</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Transmettez une pièce d&apos;identité pour valider votre arrivée. Une fois votre
          check-in validé par l&apos;administrateur, vous recevrez automatiquement votre
          code d&apos;accès et les détails pour entrer dans le logement.
        </p>
      </div>
      <CheckInFlow />
    </div>
  );
}
