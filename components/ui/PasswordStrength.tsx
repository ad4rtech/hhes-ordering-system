"use client";

import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/cn";
import { evaluatePassword, PASSWORD_MIN, SCORE_LABELS } from "@/lib/auth/password";

const BAR = ["bg-danger-solid", "bg-danger-solid", "bg-attention", "bg-primary", "bg-positive"];
const TEXT = ["text-danger", "text-danger", "text-warning", "text-primary", "text-success"];

export function PasswordStrength({ password, context }: { password: string; context?: string[] }) {
  const r = evaluatePassword(password, context);
  const filled = password ? Math.max(r.score, 1) : 0;
  const items: [string, boolean][] = [
    [`${PASSWORD_MIN}+ characters`, r.checks.length],
    ["Uppercase letter", r.checks.upper],
    ["Lowercase letter", r.checks.lower],
    ["A number", r.checks.number],
  ];
  const warning = r.issues.find((i) => /common|include your/i.test(i));

  return (
    <div className="mt-3" role="status" aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1.5" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={cn("h-1.5 flex-1 rounded-full bg-line transition-colors", i < filled && BAR[r.score])} />
          ))}
        </div>
        <span className={cn("w-16 text-right text-sm font-medium", password ? TEXT[r.score] : "text-muted")}>
          {password ? SCORE_LABELS[r.score] : ""}
        </span>
      </div>
      <ul className="mt-3 grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
        {items.map(([label, ok]) => (
          <li key={label} className={cn("flex items-center gap-2 text-sm", ok ? "text-success" : "text-muted")}>
            {ok ? <Check size={14} strokeWidth={3} aria-hidden /> : <Circle size={14} aria-hidden />} {label}
          </li>
        ))}
      </ul>
      {warning && <p className="mt-2 text-sm text-danger">{warning}</p>}
      {password && r.score >= 3 && r.score < 4 && !r.checks.symbol && (
        <p className="mt-2 text-sm text-muted">Tip: a symbol like ! or # makes it stronger.</p>
      )}
    </div>
  );
}