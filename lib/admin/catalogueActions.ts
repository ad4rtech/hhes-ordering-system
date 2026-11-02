import { api, toastFailure } from "@/lib/api";
import { notify } from "@/lib/notify";

type Row = { category_slug: string; price_kes?: number; stock_quantity?: number };

export async function saveCatalogue(quarterId: string, items: Row[], mode: "draft" | "published"): Promise<boolean> {
  const res = await api(`/api/catalogue/${quarterId}`, { method: "PATCH", json: { items }, silent: true });
  if (res.ok) {
    notify(mode === "draft" ? "admin.catalogue.saved" : "admin.catalogue.stock_saved");
    return true;
  }
  if (/Prices are locked|BR-07/i.test(res.error)) notify("admin.catalogue.prices_locked");
  else if (/Quarter is closed/i.test(res.error)) notify("admin.catalogue.closed");
  else toastFailure(res);
  return false;
}