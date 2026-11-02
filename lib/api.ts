import { notify, notifyHttp } from "./notify";

export type ApiResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: string; fields?: Record<string, string[]> };

type Options = { method?: string; json?: unknown; form?: FormData; silent?: boolean };

// Accepts both shapes our routes return: { field: [msgs] } and zod's { fieldErrors: {...} }
function toFields(err: unknown): Record<string, string[]> | undefined {
  if (!err || typeof err !== "object") return undefined;
  const o = err as { fieldErrors?: Record<string, string[]> };
  return o.fieldErrors ?? (err as Record<string, string[]>);
}

export async function api<T = unknown>(url: string, opts: Options = {}): Promise<ApiResult<T>> {
  const hasJson = opts.json !== undefined;
  let res: Response;
  try {
    res = await fetch(url, {
      method: opts.method ?? (hasJson || opts.form ? "POST" : "GET"),
      headers: hasJson ? { "Content-Type": "application/json" } : undefined, // a form sets its own header
      body: opts.form ?? (hasJson ? JSON.stringify(opts.json) : undefined),
    });
  } catch {
    if (!opts.silent) notify("common.network");
    return { ok: false, status: 0, error: "network" };
  }

  const body = await res.json().catch(() => ({}));
  if (res.ok) return { ok: true, status: res.status, data: body as T };

  const fields = toFields(body?.error);
  const error = typeof body?.error === "string" ? body.error : fields ? "validation" : "Something went wrong";
  if (!opts.silent) notifyHttp(res.status, error, !!fields);
  return { ok: false, status: res.status, error, fields };
}

export function toastFailure(res: { status: number; error: string; fields?: Record<string, string[]> }) {
  if (res.status === 0) notify("common.network");
  else notifyHttp(res.status, res.error, !!res.fields);
}