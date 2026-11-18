import "server-only";

const BLOCKED = /mpesa|m-pesa|safaricom/i;
const DEFAULT_PATH = "/api/payments/callback";
const PRIVATE_HOST = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)|\.local$/i;

const clean = (v: string | undefined) => (v ?? "").trim().replace(/^["']|["']$/g, "");

export function buildCallbackUrl(): string {
  const base = clean(process.env.MPESA_CALLBACK_URL);
  const secret = clean(process.env.MPESA_CALLBACK_SECRET);
  if (!base) throw new Error("MPESA_CALLBACK_URL is not set");
  if (!secret) throw new Error("MPESA_CALLBACK_SECRET is not set");

  let u: URL;
  try {
    u = new URL(base);
  } catch {
    throw new Error("MPESA_CALLBACK_URL is not a valid web address");
  }
  if (u.protocol !== "https:") throw new Error("MPESA_CALLBACK_URL must start with https://");
  if (PRIVATE_HOST.test(u.hostname)) throw new Error("MPESA_CALLBACK_URL must be a public address");
  if (u.port) throw new Error("MPESA_CALLBACK_URL must not include a port");

  u.search = "";
  u.hash = "";
  const path = u.pathname.replace(/\/+$/, "") || DEFAULT_PATH;
  if (BLOCKED.test(u.host + path)) {
    throw new Error('The callback address contains "mpesa" or "safaricom", which Safaricom rejects. Use a domain without those words.');
  }

  if (!/^[A-Za-z0-9_-]{16,}$/.test(secret)) {
    throw new Error("MPESA_CALLBACK_SECRET must be at least 16 letters and numbers only (no symbols)");
  }
  if (BLOCKED.test(secret)) throw new Error('MPESA_CALLBACK_SECRET contains "mpesa" or "safaricom"');

  // Secret goes in the path, not the query string: Daraja can reject "?" in CallBackURL
  u.pathname = `${path}/${secret}`;
  const finalUrl = u.toString();

  console.log("[mpesa] CallBackURL:", finalUrl.replace(secret, "***"));
  return finalUrl;
}