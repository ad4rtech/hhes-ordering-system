import { SiteHeader } from "@/components/site/SiteHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1 bg-chrome">{children}</main>
      <PublicFooter variant="org" containerClass="mx-auto max-w-[1200px] px-5 sm:px-8" />
    </div>
  );
}