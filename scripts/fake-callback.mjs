// usage: node --env-file=.env.local scripts/fake-callback.mjs <CheckoutRequestID> <resultCode> <amount>
const [checkoutId, code = "0", amount = "0"] = process.argv.slice(2);
const ok = Number(code) === 0;
const eat = new Date(Date.now() + 3 * 3600_000).toISOString().replace(/\D/g, "").slice(0, 14);

const body = { Body: { stkCallback: {
  MerchantRequestID: "29115-34620561-1",
  CheckoutRequestID: checkoutId,
  ResultCode: Number(code),
  ResultDesc: ok ? "The service request is processed successfully." : "Request cancelled by user",
  ...(ok ? { CallbackMetadata: { Item: [
    { Name: "Amount", Value: Number(amount) },
    { Name: "MpesaReceiptNumber", Value: "TEST" + Math.random().toString(36).slice(2, 8).toUpperCase() },
    { Name: "TransactionDate", Value: Number(eat) },
    { Name: "PhoneNumber", Value: 254712345678 },
  ] } } : {}),
} } };

const res = await fetch(`http://localhost:3000/api/payments/callback?secret=${encodeURIComponent(process.env.MPESA_CALLBACK_SECRET)}`, {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
});
console.log(res.status, await res.text());