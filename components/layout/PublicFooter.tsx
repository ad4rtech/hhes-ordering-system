import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { buttonStyles } from "@/components/ui/Button";
import { NAV } from "@/lib/nav";
import { cn } from "@/lib/cn";

type Variant = "org" | "admin" | "rep";
type Col = { title: string; links: readonly (readonly [string, string])[] };

const CONFIG: Record<Variant, { col1: Col; col2: Col }> = {
  org: {
    col1: { title: "Platform", links: [["Register Organisation", NAV.register], ["Organisation Sign In", NAV.login], ["Ordering Guide", NAV.orderingGuide]] },
    col2: { title: "Support", links: [["Contact Centre", NAV.contact], ["FAQs", NAV.faqs]] },
  },
  admin: {
    col1: { title: "Portals", links: [["Admin Dashboard", NAV.adminDashboard], ["Organisation Portal", NAV.login], ["System Status", NAV.systemStatus]] },
    col2: { title: "Support", links: [["IT Support Desk", NAV.itSupportDesk], ["Admin Documentation", NAV.adminDocs]] },
  },
  rep: {
    col1: { title: "Dashboard", links: [["Active Order", "/rep/dashboard"], ["Order History", "/rep/orders"], ["Organisation Profile", "/rep/profile"]] },
    col2: { title: "Support", links: [["Contact Centre", NAV.contact], ["FAQs", NAV.faqs]] },
  },
};

const linkClass = "text-[15px] text-muted hover:text-ink";
const heading = "mb-5 text-sm font-semibold uppercase tracking-[0.12em] text-ink";

export function PublicFooter({ variant = "org", wide = false, containerClass }: { variant?: Variant; wide?: boolean; containerClass?: string }) {
  const { col1, col2 } = CONFIG[variant];
  return (
    <footer className="border-t border-line bg-chrome">
      <div className={cn("py-14", containerClass ?? cn("mx-auto px-5 sm:px-6", wide ? "max-w-[1280px]" : "max-w-[1152px]"))}>
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <Logo size="sm" />
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-muted">
              Home Health Education Service sources and distributes Health, Religious, and Education books to affiliated organisations across Kenya.
            </p>
          </div>
          {[col1, col2].map((col) => (
            <div key={col.title}>
              <h3 className={heading}>{col.title}</h3>
              <ul className="space-y-4">
                {col.links.map(([label, href]) => (
                  <li key={label}><Link href={href} className={linkClass}>{label}</Link></li>
                ))}
              </ul>
              {col === col2 && (
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link href={NAV.returnPolicy} className={buttonStyles({ variant: "soft", size: "sm" })}>Return Policy</Link>
                  <Link href={NAV.help} className={buttonStyles({ variant: "soft", size: "sm" })}>Help and Support</Link>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-4 border-t border-line pt-8 text-[15px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Home Health Education Service (HHES) Kenya. SDA Church-affiliated.</p>
          <div className="flex gap-8">
            <Link href={NAV.privacy} className="hover:text-ink">Privacy Policy</Link>
            <Link href={NAV.terms} className="hover:text-ink">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}