"use client";

import { useLiveRefresh } from "@/lib/useLiveRefresh";

const LIVE = ["orders", "mpesa_transactions"];

export function LiveRefresh() {
  useLiveRefresh(LIVE);
  return null;
}