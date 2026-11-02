import Papa from "papaparse";
import { requireAdmin } from "@/lib/auth/guards";
import { TEMPLATE_COLUMNS } from "@/lib/migration/historical";

export async function GET() {
  const g = await requireAdmin();
  if (g.error) return g.error;

  const examples = [
    { quarter: "Q1 2024", organisation: "Grace SDA Church", org_type: "church", contact_name: "Jane Doe",
      contact_email: "grace@example.org", phone: "0712345678", order_date: "2024-01-15", total_kes: 3500,
      adults_lesson: 10, primary: 5, price_adults_lesson: 250, price_primary: 200 },
    { quarter: "Q1 2024", organisation: "Example University", org_type: "university", contact_email: "procurement@example.ac.ke",
      adults_lesson: 200, primary: 100 }, // prices for Q1 2024 come from the first row
  ];
  const csv = "\uFEFF" + Papa.unparse({
    fields: TEMPLATE_COLUMNS,
    data: examples.map((e) => TEMPLATE_COLUMNS.map((c) => (e as Record<string, unknown>)[c] ?? "")),
  });
  return new Response(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="historical-orders-template.csv"' },
  });
}