import { fmtDay } from "@/lib/utils/format";
import type { OrderWindow } from "./context";

export function startBlockedReason(w: OrderWindow): string | null {
  if (w.state === "none") return "No quarter is open for ordering";
  if (w.state === "upcoming") return `Ordering opens on ${fmtDay(w.quarter!.open_date)}`;
  if (w.state === "passed") return "The ordering deadline has passed";
  return null;
}

export const canAmend = (status: string, w: OrderWindow) => w.state === "open" && (status === "awaiting_payment" || status === "paid");