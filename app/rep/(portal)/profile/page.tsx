import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getRepContext } from "@/lib/rep/context";
import { RepProfileForm } from "@/components/rep/profile/RepProfileForm";
import { ProfileNotices } from "@/components/admin/profile/ProfileNotices";

export const metadata: Metadata = { title: "Organisation Profile" };

export default async function RepProfilePage() {
  const ctx = await getRepContext();
  if (!ctx) redirect("/login");
  const { org, user, avatarUrl } = ctx;
  const providers = (user.app_metadata?.providers as string[] | undefined) ?? [];

  return (
    <>
      <Suspense><ProfileNotices /></Suspense>
      <div className="mx-auto max-w-[960px]">
        <h1 className="text-3xl font-bold text-ink sm:text-[32px]">Organisation Profile</h1>
        <p className="mt-3 text-base leading-relaxed text-muted">Manage your organisation details, contact information, and security settings.</p>
        <div className="mt-8">
          <RepProfileForm
            userId={user.id} email={user.email ?? org.contact_email} pendingEmail={user.new_email ?? null}
            hasPassword={providers.includes("email")} avatarUrl={avatarUrl}
            org={{ name: org.name, type: org.type, location: org.location ?? null, contactName: org.contact_name, phone: org.phone ?? null, mpesaPhone: org.mpesa_phone ?? null }}
          />
        </div>
      </div>
    </>
  );
}