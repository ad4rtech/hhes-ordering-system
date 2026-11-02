import { ClipboardList } from "lucide-react";

const DEFAULT_STEPS = [
  { title: "Enter the official organisation name", body: "Use the recognised church, university, or school name so HHES can match your account correctly." },
  { title: "Choose the organisation type", body: "Select church, university, or school to route your registration to the right ordering profile." },
  { title: "Add contact details", body: "Provide the representative name and email address that should receive order updates and approval messages." },
  { title: "Create your password and submit", body: "Use the visibility option to confirm what you entered, then submit your registration request digitally." },
];

export function RegistrationGuide({
  badge = "Registration guide",
  title = "How to register your organisation",
  intro = "Complete the form once to request access for your church, university, or school. HHES will use these details to identify your organisation for quarterly lesson book ordering.",
  steps = DEFAULT_STEPS,
}: { badge?: string; title?: string; intro?: string; steps?: { title: string; body: string }[] }) {
  return (
    <aside className="rounded-card bg-panel p-6 sm:p-8 lg:p-10">
      <span className="inline-flex items-center gap-2 rounded-xl bg-surface px-3.5 py-2 text-sm font-medium text-ink">
        <ClipboardList size={16} aria-hidden /> {badge}
      </span>
      <h2 className="mt-7 text-3xl font-bold leading-tight text-ink sm:text-[34px]">{title}</h2>
      <p className="mt-4 text-[15px] leading-relaxed text-muted">{intro}</p>
      <ol className="mt-9 space-y-7">
        {steps.map((s, i) => (
          <li key={s.title} className="flex gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface text-[15px] font-medium text-ink">{i + 1}</span>
            <div>
              <h3 className="font-sans text-lg font-medium leading-snug text-ink">{s.title}</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </aside>
  );
}