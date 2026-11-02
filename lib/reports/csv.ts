import Papa from "papaparse";

export type Row = Record<string, string | number | boolean | null>;
export type Report = { columns: string[]; rows: Row[]; summary?: Record<string, number> };

// Org names are user-typed, so neutralise spreadsheet formula injection (=, +, -, @)
const risky = /^[=+\-@\t\r]/;
const safe = (v: Row[string]) => (typeof v === "string" && risky.test(v) ? `'${v}` : v);

export function csvResponse(report: Report, filename: string) {
  const data = report.rows.map((r) => report.columns.map((c) => safe(r[c] ?? null)));
  const csv = "\uFEFF" + Papa.unparse({ fields: report.columns, data }); // BOM so Excel reads UTF-8
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
      "X-Row-Count": String(report.rows.length),
    },
  });
}