import "server-only";
import { getMpesaConfig } from "./config";

export class DarajaError extends Error {}

let cached: { token: string; expires: number } | null = null;

async function getToken(): Promise<string> {
  if (cached && Date.now() < cached.expires) return cached.token;
  const c = getMpesaConfig();
  const res = await fetch(`${c.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: "Basic " + Buffer.from(`${c.consumerKey}:${c.consumerSecret}`).toString("base64") },
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new DarajaError(`Daraja auth failed (${res.status})`);
  const j = (await res.json()) as { access_token: string; expires_in: string };
  cached = { token: j.access_token, expires: Date.now() + (Number(j.expires_in) - 60) * 1000 };
  return cached.token;
}

// Daraja timestamp: YYYYMMDDHHmmss in Nairobi time
const timestamp = () => new Date(Date.now() + 3 * 3600_000).toISOString().replace(/\D/g, "").slice(0, 14);

export async function stkPush(args: {
  phone: string; amount: number; accountReference: string; description: string;
}) {
  const c = getMpesaConfig();
  const ts = timestamp();
  const password = Buffer.from(`${c.shortcode}${c.passkey}${ts}`).toString("base64");

  const res = await fetch(`${c.baseUrl}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: { Authorization: `Bearer ${await getToken()}`, "Content-Type": "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
    body: JSON.stringify({
      BusinessShortCode: c.shortcode,
      Password: password,
      Timestamp: ts,
      TransactionType: c.transactionType,
      Amount: args.amount,
      PartyA: args.phone,
      PartyB: c.shortcode,
      PhoneNumber: args.phone,
      CallBackURL: c.callbackUrl,
      AccountReference: args.accountReference, // max 12 chars
      TransactionDesc: args.description,
    }),
  });

  const j = (await res.json().catch(() => ({}))) as Record<string, string>;
  if (!res.ok || j.ResponseCode !== "0") {
    throw new DarajaError(j.errorMessage ?? j.ResponseDescription ?? `STK Push failed (${res.status})`);
  }
  return {
    checkoutRequestId: j.CheckoutRequestID,
    merchantRequestId: j.MerchantRequestID,
    customerMessage: j.CustomerMessage,
  };
}

export async function stkQuery(checkoutRequestId: string): Promise<
  { done: false } | { done: true; resultCode: number; resultDesc: string }
> {
  const c = getMpesaConfig();
  const ts = timestamp();
  const password = Buffer.from(`${c.shortcode}${c.passkey}${ts}`).toString("base64");

  const res = await fetch(`${c.baseUrl}/mpesa/stkpushquery/v1/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${await getToken()}`, "Content-Type": "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
    body: JSON.stringify({
      BusinessShortCode: c.shortcode, Password: password, Timestamp: ts, CheckoutRequestID: checkoutRequestId,
    }),
  });
  const j = (await res.json().catch(() => ({}))) as Record<string, string>;

  // Safaricom answers an in-flight payment with an error, not a result
  if (j.errorCode === "500.001.1001" || /being processed/i.test(j.errorMessage ?? "")) return { done: false };
  if (!res.ok || j.ResultCode === undefined)
    throw new DarajaError(j.errorMessage ?? j.ResponseDescription ?? `STK query failed (${res.status})`);

  return { done: true, resultCode: Number(j.ResultCode), resultDesc: j.ResultDesc ?? "" };
}