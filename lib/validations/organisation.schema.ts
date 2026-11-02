import { z } from "zod";
import { normalizeKenyanPhone } from "@/lib/utils/phone";
import { containsPersonalInfo, evaluatePassword, PASSWORD_MAX } from "@/lib/auth/password";

export const mpesaPhoneSchema = z.string().transform((v, ctx) => {
  const n = normalizeKenyanPhone(v);
  if (!n) ctx.addIssue({ code: "custom", message: "Enter a valid Safaricom number, e.g. 0712345678" });
  return n ?? "";
});

export const registerSchema = z.object({
  org_name: z.string().trim().min(2).max(150),
  org_type: z.enum(["church", "university", "school"]),
  contact_name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().max(PASSWORD_MAX).superRefine((pw, ctx) => {
    const r = evaluatePassword(pw);
    if (!r.ok) ctx.addIssue({ code: "custom", message: r.issues[0] ?? "Choose a stronger password" });
  }),
  mpesa_phone: mpesaPhoneSchema.optional(),
  phone: z.string().trim().max(20).optional(),
}).superRefine((v, ctx) => {
  if (containsPersonalInfo(v.password, [v.email, v.org_name, v.contact_name]))
    ctx.addIssue({ code: "custom", path: ["password"], message: "Don't include your name, email or organisation" });
});

export const orgActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve") }),
  z.object({ action: z.literal("reject"), reason: z.string().trim().min(3).max(500) }),
  z.object({ action: z.literal("deactivate") }),
  z.object({ action: z.literal("reactivate") }),
]);

export const profileUpdateSchema = z.object({
  contact_name: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().max(20).optional(),
  mpesa_phone: mpesaPhoneSchema.optional(),
});