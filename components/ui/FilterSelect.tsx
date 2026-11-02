import { ChevronDown } from "lucide-react";

export function FilterSelect({ label, value, onChange, options, ariaLabel }: {
  label?: string; value: string; onChange: (v: string) => void; options: readonly (readonly [string, string])[]; ariaLabel?: string;
}) {
  return (
    <label className="relative flex h-11 items-center gap-2 rounded-field border border-line bg-surface pl-3.5 pr-9 text-[15px] focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/15">
      {label && <span className="text-muted">{label}:</span>}
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={ariaLabel ?? label}
        className="cursor-pointer appearance-none bg-transparent font-medium text-ink focus:outline-none">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-3 text-muted" aria-hidden />
    </label>
  );
}