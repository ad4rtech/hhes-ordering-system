"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { notify } from "@/lib/notify";

export function ProfileNotices() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const e = params.get("email");
    if (!e) return;
    if (e === "updated") notify("admin.profile.email_updated", undefined, { id: "email" });
    else if (e === "pending") notify("admin.profile.email_pending", undefined, { id: "email" });
    else if (e === "failed") notify("admin.profile.email_failed", undefined, { id: "email" });
    router.replace(pathname);
    if (e === "updated") router.refresh();
  }, [params, router, pathname]);

  return null;
}