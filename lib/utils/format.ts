export const kes = (n: number) => `KES ${Number(n).toLocaleString("en-KE")}`;

// "2026-10-31" -> "31 October 2026"
export const fmtDate = (d: string) =>
  new Date(`${d}T12:00:00+03:00`).toLocaleDateString("en-KE", {
    day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Nairobi",
  });

export const fmtDateTime = (d: string | Date) =>
  new Date(d).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Nairobi" });

const TZ = "Africa/Nairobi";
// For timestamps (ISO strings), shown in Nairobi time
export const fmtDay = (d: string | Date) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: TZ });
export const fmtTime = (d: string | Date) =>
  new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
export const fmtMonthYear = (d: string | Date) =>
  new Date(d).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: TZ });
export const maskPhone = (p: string) => (p.length > 7 ? `${p.slice(0, 4)}***${p.slice(-3)}` : p);

export const fmtDayMonth = (d: string) =>
  new Date(`${d}T12:00:00+03:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: TZ });
export const fmtStamp = (d: string | Date) =>
  `${fmtDay(d)}, ${new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: TZ })}`;

const nairobiDay = (t: number | string) => new Date((typeof t === "string" ? Date.parse(t) : t) + 3 * 3600_000).toISOString().slice(0, 10);

export function timeAgo(ts: string) {
  const min = Math.floor((Date.now() - Date.parse(ts)) / 60_000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min} minute${min === 1 ? "" : "s"} ago`;
  const days = Math.round((Date.parse(`${nairobiDay(Date.now())}T00:00:00Z`) - Date.parse(`${nairobiDay(ts)}T00:00:00Z`)) / 86_400_000);
  if (days === 0) { const h = Math.floor(min / 60); return `${h} hour${h === 1 ? "" : "s"} ago`; }
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return fmtDay(ts);
}

export function fmtNotifTime(ts: string) {
  const min = Math.floor((Date.now() - Date.parse(ts)) / 60_000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min} min${min === 1 ? "" : "s"} ago`;
  const day = (t: number) => new Date(t + 3 * 3600_000).toISOString().slice(0, 10);
  const days = Math.round((Date.parse(`${day(Date.now())}T00:00:00Z`) - Date.parse(`${day(Date.parse(ts))}T00:00:00Z`)) / 86_400_000);
  if (days === 0) { const h = Math.floor(min / 60); return `${h} hour${h === 1 ? "" : "s"} ago`; }
  if (days === 1) return `Yesterday, ${new Date(ts).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: TZ })}`;
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: TZ });
}

export const fmtDayTime = (d: string | Date) => `${fmtDay(d)}, ${fmtTime(d)}`;

// "Q3 2025" -> "Quarter 3, 2025"
export function quarterLabel(name: string) {
  const m = name.match(/^Q([1-4])\s*[-/ ]?\s*(\d{4})$/i);
  return m ? `Quarter ${m[1]}, ${m[2]}` : name;
}

// 254712345678 -> 0712345678
export const toLocalPhone = (p: string) => (p.startsWith("254") ? `0${p.slice(3)}` : p);
export const maskLocalPhone = (p: string) => { const l = toLocalPhone(p); return l.length > 7 ? `${l.slice(0, 4)}***${l.slice(-3)}` : "***"; };