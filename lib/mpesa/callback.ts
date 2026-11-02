import { z } from "zod";

const callbackSchema = z.object({
  Body: z.object({
    stkCallback: z.object({
      MerchantRequestID: z.string(),
      CheckoutRequestID: z.string(),
      ResultCode: z.coerce.number(),
      ResultDesc: z.string(),
      CallbackMetadata: z.object({
        Item: z.array(z.object({ Name: z.string(), Value: z.union([z.string(), z.number()]).optional() })),
      }).optional(),
    }),
  }),
});

export function parseCallback(payload: unknown) {
  const p = callbackSchema.safeParse(payload);
  if (!p.success) return null;
  const cb = p.data.Body.stkCallback;
  const meta = Object.fromEntries((cb.CallbackMetadata?.Item ?? []).map((i) => [i.Name, i.Value]));

  const d = meta.TransactionDate != null ? String(meta.TransactionDate) : "";
  const transactionDate = /^\d{14}$/.test(d)
    ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}T${d.slice(8, 10)}:${d.slice(10, 12)}:${d.slice(12, 14)}+03:00`
    : null;

  return {
    checkoutRequestId: cb.CheckoutRequestID,
    resultCode: cb.ResultCode,
    resultDesc: cb.ResultDesc,
    receipt: meta.MpesaReceiptNumber != null ? String(meta.MpesaReceiptNumber) : null,
    amount: meta.Amount != null ? Number(meta.Amount) : null,
    transactionDate,
  };
}