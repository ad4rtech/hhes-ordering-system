import { z } from "zod";
import { containsPersonalInfo, evaluatePassword, PASSWORD_MAX } from "@/lib/auth/password";

// Standalone check: shows as soon as the password is typed
const passwordField = z.string().max(PASSWORD_MAX, `Use ${PASSWORD_MAX} characters or fewer`).superRefine((pw, ctx) => {
  const r = evaluatePassword(pw);
  if (!r.ok) ctx.addIssue({ code: "custom", message: r.issues[0] ?? "Choose a stronger password" });
});

const registerBase = z.object({
  org_name: z.string().trim().min(2, "Enter your organisation's name").max(150),
  org_type: z.enum(["church", "university", "school"], { message: "Select your organisation type" }),
  contact_name: z.string().trim().min(2, "Enter the contact person's name").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: passwordField,
});

// Also reject passwords containing the person's own details
export const registerFormSchema = registerBase.superRefine((v, ctx) => {
  if (containsPersonalInfo(v.password, [v.email, v.org_name, v.contact_name]))
    ctx.addIssue({ code: "custom", path: ["password"], message: "Don't include your name, email or organisation" });
});
export type RegisterFormValues = z.infer<typeof registerBase>;

export const completeFormSchema = registerBase.pick({ org_name: true, org_type: true, contact_name: true });
export type CompleteFormValues = z.infer<typeof completeFormSchema>;

export const loginFormSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
  remember: z.boolean(),
});
export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const forgotFormSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
});
export type ForgotFormValues = z.infer<typeof forgotFormSchema>;

export const makeNewPasswordSchema = (context: string[]) =>
  z.object({ password: passwordField, confirm: z.string().min(1, "Confirm your password") })
    .superRefine((v, ctx) => {
      if (v.password !== v.confirm) ctx.addIssue({ code: "custom", path: ["confirm"], message: "Passwords don't match" });
      if (containsPersonalInfo(v.password, context))
        ctx.addIssue({ code: "custom", path: ["password"], message: "Don't include your name or email" });
    });
export type NewPasswordValues = { password: string; confirm: string };