import type { Metadata } from "next";
import { Suspense } from "react";
import { CircleCheck, History, LogIn, PencilLine, ShoppingCart } from "lucide-react";
import { PortalGuide } from "@/components/auth/PortalGuide";
import { LoginPanel } from "@/components/auth/LoginPanel";
import { LoginNotices } from "@/components/auth/LoginNotices";

export const metadata: Metadata = { title: "Sign In" };

export default function LoginPage() {
  return (
    <>
      <Suspense><LoginNotices /></Suspense>
      <div className="mx-auto max-w-[1152px] rounded-card border border-line bg-surface p-4 sm:p-6 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[5fr_6fr] lg:gap-14">
          <PortalGuide
            badgeIcon={LogIn}
            badge="Organisation Portal"
            title="Welcome back to HHES Kenya"
            intro="Sign in to your organisation's account to manage quarterly lesson book orders and view your digital history."
            items={[
              { icon: ShoppingCart, title: "Place quarterly orders online", body: "Order Adults, Kindergarten, Primary, and other lesson books without visiting HHES." },
              { icon: History, title: "View digital order history", body: "Access previous orders and easily resolve disputes with full digital records." },
              { icon: PencilLine, title: "Amend or cancel orders", body: "Modify your submissions easily before the pickup confirmation stage." },
              { icon: CircleCheck, title: "Confirm pickups digitally", body: "Create a complete digital audit trail from submission through to final fulfillment." },
            ]}
          />
          <LoginPanel />
        </div>
      </div>
    </>
  );
}