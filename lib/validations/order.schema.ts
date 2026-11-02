import { z } from "zod";

export const SLUGS = ["adults_lesson","adults_dq","kindergarten","primary","cornerstone","realtime"] as const;

const qty = z.number().int().min(0).max(100000).default(0);

export const orderBodySchema = z.object({
  quantities: z.object(
    Object.fromEntries(SLUGS.map((s) => [s, qty])) as Record<(typeof SLUGS)[number], typeof qty>
  ).strict(),
}).refine((v) => Object.values(v.quantities).some((n) => n > 0), {
  message: "Order at least one lesson book", path: ["quantities"],
});

export const statusActionSchema = z.union([
  z.object({ status: z.enum(["ready_for_pickup", "collected"]) }),
  z.object({ action: z.literal("refund_processed") }),
]);