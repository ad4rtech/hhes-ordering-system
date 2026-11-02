import { sendBatch } from "./send";
import { createAdminClient } from "@/lib/supabase/server";
import { fmtDate } from "@/lib/utils/format";
import { notifyUsers } from "@/lib/notifications/rep"; // adjust to where notifyUsers lives
import QuarterOpened from "@/emails/QuarterOpened";

export async function notifyQuarterOpened(quarterId: string) {
  const sb = createAdminClient();
  const [{ data: q }, { data: orgs }] = await Promise.all([
    sb.from("quarters").select("name,opens_date,deadline_date").eq("id", quarterId).single(),
    sb.from("organisations").select("contact_name,contact_email").eq("status", "approved"),
  ]);
  if (!q || !orgs?.length) return;
  const orderUrl = `${process.env.NEXT_PUBLIC_APP_URL}/rep/order/place`;
  await sendBatch(orgs.map((o) => ({
    to: o.contact_email,
    subject: `${q.name} lesson ordering is open`,
    react: <QuarterOpened contactName={o.contact_name} quarterName={q.name} opensOn={fmtDate(q.opens_date)} deadline={fmtDate(q.deadline_date)} orderUrl={orderUrl} />,
  })));

  const { data: users } = await sb.from("organisations").select("user_id").eq("status", "approved").not("user_id", "is", null);
  await notifyUsers((users ?? []).map((u) => u.user_id as string), {
    type: "quarter_opened", dedupeKey: `quarter_opened:${quarterId}`,
    title: `${q.name} ordering is open`, body: `Place and pay for your order by **${fmtDate(q.deadline_date)}**.`,
    link: "/rep/order/place", actionLabel: "Place order",
  });
}