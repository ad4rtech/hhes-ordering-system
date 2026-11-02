import { AdminHeader } from "@/components/layout/AdminHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import type { Metadata } from "next";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <AdminHeader />
      <main className="flex-1 px-4 py-12 sm:px-6 lg:py-20">{children}</main>
      <PublicFooter variant="admin" />
    </div>
  );
}