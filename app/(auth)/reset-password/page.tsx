import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { NewPasswordForm } from "@/components/auth/NewPasswordForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Reset password" };

export default async function ResetPasswordPage() {
  const { data: { user } } = await (await createClient()).auth.getUser();
  if (!user) redirect("/forgot-password?error=link");

  return (
    <AuthCard icon={LockKeyhole} title="Choose a new password" subtitle="Pick a strong password you haven't used before.">
      <NewPasswordForm mode="reset" email={user.email ?? ""} />
    </AuthCard>
  );
}