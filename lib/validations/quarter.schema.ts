import { z } from "zod";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

export const createQuarterSchema = z.object({
  name: z.string().trim().min(2).max(60),
  open_date: date,
  deadline_date: date,
}).refine((v) => v.deadline_date >= v.open_date, {
  message: "Deadline must be on or after the open date", path: ["deadline_date"],
});

export const patchQuarterSchema = z.union([
  z.object({ action: z.enum(["publish", "close"]) }),
  z.object({
    name: z.string().trim().min(2).max(60).optional(),
    open_date: date.optional(),
    deadline_date: date.optional(),
  }),
]);

export const catalogueUpdateSchema = z.object({
  items: z.array(z.object({
    category_slug: z.enum(["adults_lesson","adults_dq","kindergarten","primary","cornerstone","realtime"]),
    price_kes: z.number().int().min(0).max(100000).optional(),
    stock_quantity: z.number().int().min(0).max(1000000).optional(),
  })).min(1).max(6),
});

export const overrideSchema = z.object({
  organisation_id: z.string().uuid(),
  quarter_id: z.string().uuid(),
  new_deadline: date,
  reason: z.string().trim().min(5).max(500),
});