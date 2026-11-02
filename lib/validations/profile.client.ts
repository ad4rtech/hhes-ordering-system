import { z } from "zod";
import { containsPersonalInfo, evaluatePassword, PASSWORD_MAX } from "@/lib/auth/password";
import { normalizeKenyanPhone } from "@/lib/utils/phone";

export const nameSchema = z.object({
  first_name: z.string().trim().min(1, "Enter your first name").max(50),
  last_name: z.string().trim().min(1, "Enter your last name").max(50),
});
export type NameValues = z.infer<typeof nameSchema>;

export const makePasswordSchema = (context: string[]) =>
  z.object({
    current: z.string().min(1, "Enter your current password"),
    password: z.string().max(PASSWORD_MAX, `Use ${PASSWORD_MAX} characters or fewer`),
    confirm: z.string().min(1, "Confirm your new password"),
  }).superRefine((v, ctx) => {
    const r = evaluatePassword(v.password);
    if (!r.ok) ctx.addIssue({ code: "custom", path: ["password"], message: r.issues[0] ?? "Choose a stronger password" });
    else if (containsPersonalInfo(v.password, context)) ctx.addIssue({ code: "custom", path: ["password"], message: "Don't include your name or email" });
    else if (v.password === v.current) ctx.addIssue({ code: "custom", path: ["password"], message: "Choose a password you haven't used" });
    if (v.confirm && v.password !== v.confirm) ctx.addIssue({ code: "custom", path: ["confirm"], message: "Passwords don't match" });
  });
export type PasswordValues = { current: string; password: string; confirm: string };

export const makeRepProfileSchema = (context: string[], needCurrent: boolean) =>
  z.object({
    contact_name: z.string().trim().min(2, "Enter the contact person's name").max(100),
    phone: z.string().trim().refine((v) => v === "" || /^\+?[\d\s-]{7,20}$/.test(v), "Enter a valid phone number"),
    location: z.string().trim().max(150, "Use 150 characters or fewer"),
    mpesa_phone: z.string().trim().refine((v) => v === "" || normalizeKenyanPhone(v) !== null, "Use a Safaricom number like 0712 345 678"),
    current: z.string(),
    password: z.string().max(PASSWORD_MAX, `Use ${PASSWORD_MAX} characters or fewer`),
    confirm: z.string(),
  }).superRefine((v, ctx) => {
    // Only when they actually type a new password (a browser-filled "current" alone doesn't count)
    if (!v.password && !v.confirm) return;
    if (needCurrent && !v.current) ctx.addIssue({ code: "custom", path: ["current"], message: "Enter your current password" });
    const r = evaluatePassword(v.password);
    if (!r.ok) ctx.addIssue({ code: "custom", path: ["password"], message: r.issues[0] ?? "Choose a stronger password" });
    else if (containsPersonalInfo(v.password, context)) ctx.addIssue({ code: "custom", path: ["password"], message: "Don't include your name, email or organisation" });
    else if (needCurrent && v.current && v.password === v.current) ctx.addIssue({ code: "custom", path: ["password"], message: "Choose a password you haven't used" });
    if (v.password !== v.confirm) ctx.addIssue({ code: "custom", path: ["confirm"], message: "Passwords don't match" });
  });

export type RepProfileValues = { contact_name: string; phone: string; location: string; mpesa_phone: string; current: string; password: string; confirm: string };