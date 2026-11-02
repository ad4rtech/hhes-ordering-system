"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { notify } from "@/lib/notify";

export function useLiveRefresh(tables: string[]) {
  const router = useRouter();
  const key = tables.join(",");

  useEffect(() => {
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let wasDown = false;
    const refresh = () => { clearTimeout(timer); timer = setTimeout(() => router.refresh(), 800); };

    let channel = supabase.channel(`live-${key}`);
    for (const table of key.split(",")) {
      channel = channel.on("postgres_changes", { event: "*", schema: "public", table }, refresh);
    }
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        if (wasDown) { wasDown = false; notify("rt.reconnected"); router.refresh(); }
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        wasDown = true;
        notify("rt.disconnected");
      }
    });
    return () => { clearTimeout(timer); supabase.removeChannel(channel); };
  }, [key, router]);
}