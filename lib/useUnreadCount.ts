"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { notifyText } from "@/lib/notify";

export function useUnreadCount(initial: number, userId: string, hint = "Open Notifications for the details.") {
  const [count, setCount] = useState(initial);
  useEffect(() => setCount(initial), [initial]);

  useEffect(() => {
    const sb = createClient();
    const refetch = async () => {
      const { count: c } = await sb.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null);
      setCount(c ?? 0);
    };
    const channel = sb.channel(`notifications-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, (p) => {
        refetch();
        if (p.eventType === "INSERT") notifyText("info", (p.new as { title: string }).title, hint);
      })
      .subscribe();
    return () => { sb.removeChannel(channel); };
  }, [userId, hint]);

  return count;
}