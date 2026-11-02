const BARS = [30, 45, 38, 60, 52, 75, 64, 82];

export function HeroFallback() {
  return (
    <div aria-hidden className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-panel to-primary-softer p-4 sm:p-10">
      <div className="w-full max-w-[620px] overflow-hidden rounded-xl border-[5px] border-ink/85 bg-surface shadow-2xl">
        <div className="bg-primary-softer px-4 py-2.5 text-center text-xs font-bold uppercase tracking-[0.14em] text-primary sm:text-sm">Book Order Tracker</div>
        <div className="grid grid-cols-3 gap-2 bg-chrome p-3 sm:gap-3 sm:p-4">
          <div className="rounded-lg border border-line bg-surface p-3 text-center">
            <p className="text-[10px] uppercase tracking-wide text-muted">Orders</p>
            <p className="mt-1 font-display text-2xl font-bold text-ink sm:text-3xl">248</p>
            <p className="mt-1 text-[10px] text-success">+12% this quarter</p>
          </div>
          <div className="flex flex-col items-center justify-center rounded-lg bg-primary-softer p-3">
            <svg viewBox="0 0 80 80" className="size-16 -rotate-90 sm:size-20">
              <circle cx="40" cy="40" r="32" fill="none" strokeWidth="8" className="stroke-white/80" />
              <circle cx="40" cy="40" r="32" fill="none" strokeWidth="8" strokeLinecap="round" strokeDasharray="171 201" className="stroke-primary" />
            </svg>
            <p className="-mt-12 font-display text-sm font-bold text-primary sm:-mt-14 sm:text-base">85%</p>
            <p className="mt-9 text-[10px] text-muted sm:mt-10">Orders complete</p>
          </div>
          <div className="rounded-lg border border-line bg-surface p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted">Recent activity</p>
            <ul className="mt-2 space-y-1.5 text-[10px] text-muted">
              <li className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-positive" />Order paid</li>
              <li className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-attention" />Ready for pickup</li>
              <li className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-primary" />Order placed</li>
            </ul>
          </div>
          <div className="col-span-3 rounded-lg border border-line bg-surface p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted">Monthly progress</p>
            <div className="mt-2 flex h-14 items-end gap-2 sm:h-16">
              {BARS.map((h, i) => <span key={i} className="flex-1 rounded-t bg-primary/70" style={{ height: `${h}%` }} />)}
            </div>
          </div>
        </div>
      </div>
      <p className="absolute bottom-3 text-xs text-muted">Sample preview</p>
    </div>
  );
}

export function BooksFallback() {
  const books = [
    { w: "w-52 sm:w-64", color: "bg-primary", title: "Spiritual Wisdom" },
    { w: "w-60 sm:w-72", color: "bg-ink", title: "Modern Pedagogy" },
    { w: "w-48 sm:w-60", color: "bg-attention", title: "Foundations" },
  ];
  return (
    <div aria-hidden className="absolute inset-0 flex flex-col items-center justify-end bg-gradient-to-b from-chrome to-panel pb-16">
      <div className="space-y-1.5">
        {books.map((b) => (
          <div key={b.title} className={`${b.w} ${b.color} flex h-11 items-center rounded-sm border-b-4 border-white/30 px-4 text-xs font-semibold text-white shadow-md sm:h-12`}>{b.title}</div>
        ))}
      </div>
      <div className="mt-0 h-3 w-4/5 rounded-full bg-ink/10 blur-md" />
      <p className="absolute bottom-3 text-xs text-muted">Sample preview</p>
    </div>
  );
}