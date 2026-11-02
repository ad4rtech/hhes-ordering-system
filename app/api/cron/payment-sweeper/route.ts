import { NextResponse } from "next/server";
import { safeEqual } from "@/lib/utils/api";
import { sweepTransactions } from "@/lib/mpesa/sweep";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !safeEqual(req.headers.get("authorization") ?? "", `Bearer ${secret}`))
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  return NextResponse.json(await sweepTransactions({ minAgeMs: 180_000, limit: 50 }));
}