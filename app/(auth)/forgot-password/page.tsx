import type { Metadata } from "next";
import { Suspense } from "react";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { LoginNotices } from "@/components/auth/LoginNotices";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <Suspense><LoginNotices /></Suspense>
      <ForgotPasswordForm />
    </>
  );
}