import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { RegistrationGuide } from "@/components/auth/RegistrationGuide";
import { CompleteRegistrationPanel } from "@/components/auth/CompleteRegistrationPanel";

export const metadata: Metadata = { title: "Finish registering" };

export default async function CompleteRegistrationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const [{ data: profile }, { data: org }] = await Promise.all([
    admin.from("profiles").select("role").eq("id", user.id).maybeSingle(),
    admin.from("organisations").select("status").eq("user_id", user.id).maybeSingle(),
  ]);
  if (profile?.role === "admin") redirect("/admin/dashboard");
  if (org) redirect(org.status === "approved" ? "/rep/dashboard" : `/login?reason=${org.status}`);

  const meta = (user.user_metadata ?? {}) as { full_name?: string; name?: string };

  return (
    <div className="mx-auto max-w-[1152px] rounded-card border border-line bg-surface p-4 sm:p-6 lg:p-10">
      <div className="grid gap-8 lg:grid-cols-[5fr_6fr] lg:gap-14">
        <RegistrationGuide
          badge="Almost there"
          title="Finish setting up your organisation"
          intro="Your Google account is connected. Add your organisation's details and HHES will review your request."
          steps={[
            { title: "Enter the official organisation name", body: "Use the recognised church, university, or school name so HHES can match your account correctly." },
            { title: "Choose the organisation type", body: "Select church, university, or school to route your registration to the right ordering profile." },
            { title: "Confirm the contact name", body: "This is the representative who will place orders and receive updates at your Google email." },
            { title: "Submit for approval", body: "You'll get an email as soon as HHES approves your account." },
          ]}
        />
        <CompleteRegistrationPanel email={user.email ?? ""} defaultName={meta.full_name ?? meta.name ?? ""} />
      </div>
    </div>
  );
}