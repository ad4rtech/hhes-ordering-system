import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type RepQuarter = { id: string; name: string; open_date: string; deadline_date: string };
export type OrderWindow = {
  quarter: RepQuarter | null;
  extendedTo: string | null;   // this organisation's personal extension, if any
  deadline: string | null;     // the date that applies to them
  state: "none" | "upcoming" | "open" | "passed";
  daysLeft: number | null;
  canOrder: boolean;
};

const nairobiToday = () => new Date(Date.now() + 3 * 3600_000).toISOString().slice(0, 10);
const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);

// cache(): the layout and the page share one lookup per request
export const getRepContext = cache(async () => {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;

  const { data: org } = await sb.from("organisations")
    .select("id,name,type,contact_name,contact_email,phone,mpesa_phone,status,created_at,approved_at,location")
    .eq("user_id", user.id).maybeSingle();
  if (!org || org.status !== "approved") return null;

  const [profile, q, unread] = await Promise.all([
    sb.from("profiles").select("avatar_url").eq("id", user.id).maybeSingle(),
    sb.from("quarters").select("id,name,open_date,deadline_date").eq("status", "published").maybeSingle(),
    sb.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).is("read_at", null),
  ]);

  const quarter = (q.data ?? null) as RepQuarter | null;
  let extendedTo: string | null = null;
  if (quarter) {
    const { data: ov } = await sb.from("deadline_overrides").select("new_deadline")
      .eq("organisation_id", org.id).eq("quarter_id", quarter.id).order("new_deadline", { ascending: false }).limit(1).maybeSingle();
    if (ov && ov.new_deadline > quarter.deadline_date) extendedTo = ov.new_deadline;
  }

  const today = nairobiToday();
  const deadline = quarter ? extendedTo ?? quarter.deadline_date : null;
  const state: OrderWindow["state"] = !quarter ? "none" : today < quarter.open_date ? "upcoming" : today > deadline! ? "passed" : "open";
  const window: OrderWindow = {
    quarter, extendedTo, deadline, state,
    daysLeft: deadline ? daysBetween(today, deadline) : null,
    canOrder: state === "open",
  };

  return { sb, user, org, avatarUrl: (profile.data?.avatar_url as string | null) ?? null, unread: unread.count ?? 0, window };
});