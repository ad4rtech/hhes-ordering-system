import { NextResponse } from "next/server";
import { safeEqual } from "@/lib/utils/api";
import { runDeadlineReminders } from "@/lib/email/reminders";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  if (!secret || !safeEqual(auth, `Bearer ${secret}`))
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const dry = new URL(req.url).searchParams.get("dry") === "1";
  return NextResponse.json(await runDeadlineReminders(dry));
}