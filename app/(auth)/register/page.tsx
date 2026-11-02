import { RegistrationGuide } from "@/components/auth/RegistrationGuide";
import { RegisterPanel } from "@/components/auth/RegisterPanel";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Register Organisation", path: "/register", index: true,
  description: "Register your church, school or university to order quarterly lesson books online from HHES Kenya. HHES reviews and approves each registration.",
});

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-[1152px] rounded-card border border-line bg-surface p-4 sm:p-6 lg:p-10">
      <div className="grid gap-8 lg:grid-cols-[5fr_6fr] lg:gap-14">
        <RegistrationGuide />
        <RegisterPanel />
      </div>
    </div>
  );
}