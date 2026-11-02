import { notify } from "@/lib/notify";
import type { MessageKey } from "@/lib/messages";

export async function downloadCsv(url: string, emptyKey: MessageKey = "admin.report.empty") {
  let res: Response;
  try { res = await fetch(url); } catch { notify("common.network"); return false; }

  if (res.status === 401) { notify("common.session_expired"); return false; }
  if (!res.ok) { notify("common.download_failed"); return false; }
  if (res.headers.get("X-Row-Count") === "0") { notify(emptyKey); return false; }

  const name = res.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] ?? "export.csv";
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  notify("common.download_started", { file: name });
  return true;
}

export function saveBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  notify("common.download_started", { file: name });
}