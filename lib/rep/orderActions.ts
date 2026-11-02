import { toastFailure } from "@/lib/api";
import { notify } from "@/lib/notify";
import { fmtDate } from "@/lib/utils/format";

type Fail = { status: number; error: string; fields?: Record<string, string[]> };

export function orderFailure(res: Fail) {
  const m = res.error;
  let x: RegExpMatchArray | null;
  if ((x = m.match(/^(.+) is out of stock$/i))) return notify("rep.order.out_of_stock", { item: x[1] });
  if ((x = m.match(/^Only (\d+) units? of (.+) left/i))) return notify("rep.order.stock_short", { item: x[2], left: x[1], units: x[1] === "1" ? "unit" : "units" });
  if (/no active quarter/i.test(m)) return notify("rep.order.no_quarter");
  if ((x = m.match(/^Ordering for (.+) opens on (\d{4}-\d{2}-\d{2})/i))) return notify("rep.order.not_open_yet", { quarter: x[1], date: fmtDate(x[2]) });
  if ((x = m.match(/ordering deadline \((\d{4}-\d{2}-\d{2})\)/i))) return notify("rep.order.deadline_passed", { date: fmtDate(x[1]) });
  if (/already has an order/i.test(m)) return notify("rep.order.already_exists");
  if (/not approved/i.test(m)) return notify("rep.order.not_approved");
  if (/Order at least one lesson book, or cancel/i.test(m)) return notify("rep.order.empty_amend");
  if (/Order at least one/i.test(m)) return notify("rep.order.empty");
  if (/No changes to save/i.test(m)) return notify("rep.order.no_changes");
  if (/ready for pickup and can no longer be amended/i.test(m)) return notify("rep.order.locked_ready");
  if (/is collected and can no longer/i.test(m)) return notify("rep.order.locked_collected");
  if (/is cancelled and can no longer/i.test(m)) return notify("rep.order.locked_cancelled");
  return toastFailure(res);
}