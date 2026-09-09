import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { LoginForm } from "@/components/LoginForm";

export default async function AdminLoginPage() {
  const admin = await getCurrentAdmin();
  if (admin) {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <LoginForm />
    </div>
  );
}
