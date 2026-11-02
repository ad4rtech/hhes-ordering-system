import "server-only";

export function getMpesaConfig() {
  const need = (k: string) => {
    const v = process.env[k];
    if (!v) throw new Error(`Missing env var ${k}`);
    return v;
  };
  const env = process.env.MPESA_ENV === "production" ? "production" : "sandbox";
  return {
    env,
    baseUrl: env === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke",
    consumerKey: need("MPESA_CONSUMER_KEY"),
    consumerSecret: need("MPESA_CONSUMER_SECRET"),
    shortcode: need("MPESA_SHORTCODE"),
    passkey: need("MPESA_PASSKEY"),
    transactionType: process.env.MPESA_TRANSACTION_TYPE ?? "CustomerPayBillOnline",
    callbackUrl: `${need("MPESA_CALLBACK_URL")}?secret=${encodeURIComponent(need("MPESA_CALLBACK_SECRET"))}`,
  };
}