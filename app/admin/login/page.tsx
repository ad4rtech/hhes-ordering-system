import type { Metadata } from "next";
import { Suspense } from "react";
import { ShieldCheck } from "lucide-react";
import { AdminLoginForm } from "@/components/auth/AdminLoginForm";
import { LoginNotices } from "@/components/auth/LoginNotices";

export const metadata: Metadata = { title: "Administrator Login" };

export default function AdminLoginPage() {
  return (
    <>
      <Suspense><LoginNotices /></Suspense>
      <div className="mx-auto w-full max-w-[480px] overflow-hidden rounded-card border border-line border-t-4 border-t-primary bg-surface p-6 shadow-sm sm:p-10">
        <div className="flex flex-col items-center text-center">
          <span className="flex size-14 items-center justify-center rounded-xl border border-line bg-surface text-primary">
            <ShieldCheck size={26} aria-hidden />
          </span>
          <h1 className="mt-6 text-3xl font-bold text-ink">Administrator Login</h1>
          <p className="mt-3 text-base leading-relaxed text-muted">
            Sign in to manage orders, publishing quarters, and organisation accounts.
          </p>
        </div>
        <AdminLoginForm />
      </div>
    </>
  );
}