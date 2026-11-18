const BLOCKED = /mpesa|m-pesa|safaricom/i;
const DEFAULT_PATH = "/api/payments/callback";

export function buildCallbackUrl(): string {
  const base = (process.env.MPESA_CALLBACK_URL ?? "").trim().replace(/^["']|["']$/g, "");
  const secret = (process.env.MPESA_CALLBACK_SECRET ?? "").trim().replace(/^["']|["']$/g, "");
  if (!base) throw new Error("MPESA_CALLBACK_URL is not set");
  if (!secret) throw new Error("MPESA_CALLBACK_SECRET is not set");

  let u: URL;
  try { u = new URL(base); } catch { throw new Error("MPESA_CALLBACK_URL is not a valid web address"); }
  if (u.protocol !== "https:") throw new Error("MPESA_CALLBACK_URL must start with https://");
  if (/^(localhost|127\.|10\.|192\.168\.)|\.local$/i.test(u.hostname)) throw new Error("MPESA_CALLBACK_URL must be a public address");

  u.search = "";
  u.hash = "";
  u.pathname = u.pathname.replace(/\/+$/, "") || DEFAULT_PATH;
  if (BLOCKED.test(u.host + u.pathname)) throw new Error('The callback address contains "mpesa" or "safaricom", which Safaricom rejects. Use a domain without those words.');

  if (!/^[A-Za-z0-9_-]{16,}$/.test(secret)) throw new Error("MPESA_CALLBACK_SECRET must be at least 16 letters and numbers only (no symbols)");
  if (BLOCKED.test(secret)) throw new Error('MPESA_CALLBACK_SECRET contains "mpesa" or "safaricom"');

  u.searchParams.set("secret", secret);
  return u.toString();
}