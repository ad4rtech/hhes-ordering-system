import type { AuthError } from "@supabase/supabase-js";
import type { MessageKey } from "@/lib/messages";

export function loginErrorKey(e: AuthError): MessageKey {
  if (e.status === 0) return "common.network";
  if (e.status === 429 || e.code === "over_request_rate_limit") return "auth.login.too_many";
  if (e.code === "invalid_credentials" || e.status === 400) return "auth.login.invalid";
  return "auth.login.failed";
}

export const STATUS_MESSAGE: Record<string, MessageKey> = {
  pending: "auth.login.pending",
  rejected: "auth.login.rejected",
  inactive: "auth.login.inactive",
  "no-org": "auth.login.no_org",
  expired: "auth.login.expired",
};

export function passwordErrorKey(e: AuthError): MessageKey {
  if (e.status === 0) return "common.network";
  if (e.code === "same_password") return "auth.reset.same";
  if (e.code === "weak_password") return "auth.reset.weak";
  if (e.status === 401 || e.status === 403 || e.code === "session_not_found" || /session/i.test(e.message)) return "auth.reset.link_expired";
  return "auth.reset.failed";
}