export type TableRow = {
  id: string; quarterId: string; quarter: string; reference: string; date: string;
  categories: number; quantity: number; total: number; paid: number; status: string; payment: string; imported: boolean;
};
export type GrowthPoint = { label: string; value: number; current: boolean };
export type Share = { slug: string; name: string; qty: number; pct: number };
export type Issue = { id: string; quarter: string; label: string; at: string; tone: "danger" | "warning" };
export type TimelineKind = "submitted" | "amended" | "paid" | "payment_failed" | "ready" | "collected" | "cancelled" | "imported";
export type TimelineEvent = { id: string; kind: TimelineKind; title: string; body: string; at: string };

export type ReportsData = {
  rows: TableRow[];
  growth: GrowthPoint[];
  breakdown: { quarter: string; total: number; shares: Share[] } | null;
  amendments: { average: number | null; quarters: number };
  compliance: { percent: number | null; eligible: number; issues: Issue[] };
  timeline: { quarter: string; reference: string; events: TimelineEvent[] } | null;
};