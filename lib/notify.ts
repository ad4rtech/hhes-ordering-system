import { toast } from "sonner";
import { MESSAGES, type MessageKey, type MessageType } from "./messages";

type Vars = Record<string, string | number>;
const DURATION: Record<MessageType, number> = { success: 4000, info: 5000, warning: 6000, error: 7000 };
const fill = (s: string, v?: Vars) => s.replace(/\{(\w+)\}/g, (_, k: string) => String(v?.[k] ?? ""));

// notify("rep.order.placed", { reference, total })
export function notify(key: MessageKey, vars?: Vars, opts?: { id?: string | number }) {
  const m: { type: MessageType; title: string; description?: string; id?: string } | undefined = MESSAGES[key];
  if (!m) {
    console.error(`notify: unknown message key "${key}"`);
    return;
  }
  return toast[m.type](fill(m.title, vars), {
    description: m.description ? fill(m.description, vars) : undefined,
    duration: DURATION[m.type],
    id: opts?.id ?? m.id,
  });
}

// For text that comes from the server and isn't in the catalogue
export function notifyText(type: MessageType, title: string, description?: string) {
  return toast[type](title, { description, duration: DURATION[type] });
}

// Server error text -> catalogue key. Extend as modules are added (see section 7 of TOAST_MESSAGES.md).
const RULES: [RegExp, MessageKey][] = [
  [/account with this email already exists|already registered with this email/i, "auth.register.email_taken"],
  [/already been registered/i, "auth.complete.already_registered"],
  [/^Registration failed/i, "auth.register.failed"],
];

export function notifyHttp(status: number, message: string, hasFields: boolean) {
  if (status === 401) {
    notify("common.session_expired");
    setTimeout(() => window.location.assign("/login"), 1500);
    return;
  }
  if (status === 403) return notify("common.forbidden");
  if (status === 404) return notify("common.not_found");
  if (hasFields) return notify("common.validation");
  const rule = RULES.find(([re]) => re.test(message));
  if (rule) return notify(rule[1]);
  if (status === 429) return notifyText("warning", MESSAGES["common.rate_limited"].title, message);
  if (status >= 500) return notify("common.server_error");
  return notify("common.action_failed", { reason: message });
}

// Queue a toast for the next page (use right before a redirect or sign-out)
const NEXT_KEY = "hhes:toast-next";
export function notifyNext(key: MessageKey, vars?: Vars) {
  try { sessionStorage.setItem(NEXT_KEY, JSON.stringify({ key, vars })); } catch { /* storage unavailable */ }
}
export function flushNextToast() {
  try {
    const raw = sessionStorage.getItem(NEXT_KEY);
    if (!raw) return;
    sessionStorage.removeItem(NEXT_KEY);
    const { key, vars } = JSON.parse(raw) as { key: MessageKey; vars?: Vars };
    if (key in MESSAGES) notify(key, vars);
  } catch { /* ignore */ }
}