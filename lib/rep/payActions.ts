import { toastFailure } from "@/lib/api";
import { notify } from "@/lib/notify";
import type { MessageKey } from "@/lib/messages";

type Fail = { status: number; error: string; fields?: Record<string, string[]> };

export function payFailure(res: Fail) {
  const m = res.error;
  if (res.fields?.phone) return notify("rep.pay.phone_invalid");
  if (/Enter the M-Pesa number/i.test(m)) return notify("rep.pay.phone_required");
  if (/payment prompt was just sent/i.test(m)) return notify("rep.pay.retry_wait");
  if (/Could not reach M-Pesa/i.test(m)) return notify("rep.pay.unreachable");
  if (/Nothing is due/i.test(m)) return notify("rep.pay.nothing_due");
  const s = m.match(/This order is (.+?); no payment is due/i);
  if (s) return notify("rep.pay.not_payable", { status: s[1] });
  if (/ordering deadline/i.test(m)) return notify("rep.pay.deadline_passed");
  return toastFailure(res);
}

const BY_CODE: Record<number, MessageKey> = {
  1: "rep.pay.failed.insufficient", 1001: "rep.pay.failed.busy", 1019: "rep.pay.failed.expired",
  1032: "rep.pay.failed.cancelled", 1037: "rep.pay.failed.timeout", 2001: "rep.pay.failed.wrong_pin",
};
export const failKey = (code: number | null): MessageKey => (code !== null && BY_CODE[code]) || "rep.pay.failed.generic";