"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { clearRememberCookies } from "@/lib/auth/remember";
import { STATUS_MESSAGE } from "@/lib/auth/login";
import { notify } from "@/lib/notify";

export function LoginNotices() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const reason = params.get("reason");
    const error = params.get("error");
    if (!reason && !error) return;

    if (reason && STATUS_MESSAGE[reason]) {
      notify(STATUS_MESSAGE[reason], undefined, { id: reason });
      // A pending/rejected/inactive user must not keep a session
      if (reason !== "no-org") { createClient().auth.signOut(); clearRememberCookies(); }
    } else if (error === "oauth") {
      notify("auth.google.callback_failed", undefined, { id: "oauth" });
    }
    router.replace(pathname); // tidy the URL so a refresh doesn't repeat the toast
  }, [params, router, pathname]);

  return null;
}