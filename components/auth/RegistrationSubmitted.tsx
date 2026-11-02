"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button, buttonStyles } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { notifyNext } from "@/lib/notify";
import { NAV } from "@/lib/nav";

export function RegistrationSubmitted({ org, email, signedIn = false }: { org: string; email: string; signedIn?: boolean }) {
  const router = useRouter();

  async function signOut() {
    await createClient().auth.signOut();
    notifyNext("auth.logout.success");
    router.push(NAV.login);
    router.refresh();
  }

  return (
    <section className="flex flex-col justify-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-success-soft text-success"><CheckCircle2 size={26} aria-hidden /></span>
      <h1 className="mt-6 text-3xl font-bold text-ink">Registration submitted</h1>
      <p className="mt-3 text-base leading-relaxed text-muted">
        We've received the request for <strong className="font-medium text-ink">{org}</strong>. An HHES admin will review it,
        and we'll email <strong className="font-medium text-ink">{email}</strong> as soon as your account is approved.
      </p>
      <Alert tone="warning" className="mt-6">You won't be able to use the system until your registration is approved.</Alert>
      <div className="mt-8">
        {signedIn
          ? <Button variant="outline" onClick={signOut}>Sign out</Button>
          : <Link href={NAV.login} className={buttonStyles({ variant: "outline" })}>Go to Sign In</Link>}
      </div>
    </section>
  );
}