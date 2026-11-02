"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { notifyNext } from "@/lib/notify";

export function useSessionGuard(expected: "admin" | "org_rep", loginPath: string) {
  useEffect(() => {
    const supabase = createClient();
    let done = false;
    const check = async () => {
      if (done || document.visibilityState !== "visible") return;
      const { data: { session } } = await supabase.auth.getSession();
      if ((session?.user.app_metadata?.role ?? null) !== expected) {
        done = true;
        notifyNext("auth.session.changed");
        window.location.assign(loginPath);
      }
    };
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    return () => { document.removeEventListener("visibilitychange", check); window.removeEventListener("focus", check); };
  }, [expected, loginPath]);
}