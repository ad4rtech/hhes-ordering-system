import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { NewPasswordForm } from "@/components/auth/NewPasswordForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Activate your account" };

export default async function SetPasswordPage() {
  const { data: { user } } = await (await createClient()).auth.getUser();
  if (!user) redirect("/admin/login?error=invite");

  return (
    <AuthCard accent icon={ShieldCheck} title="Welcome to HHES" subtitle="Set a password to activate your administrator account.">
      <NewPasswordForm mode="invite" email={user.email ?? ""} />
    </AuthCard>
  );
}