"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, Download, FileUp, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Field";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SettingsCard } from "./SettingsCard";
import { api, toastFailure } from "@/lib/api";
import { downloadCsv } from "@/lib/download";
import { notify } from "@/lib/notify";
import { kes } from "@/lib/utils/format";
import { cn } from "@/lib/cn";

type Counts = { rows: number; importable: number; skipped: number; errors: number; new_organisations: number; new_quarters: number };
type ByQuarter = { quarter: string; new_quarter: boolean; orders: number; books: number; value_kes: number }[];
type Issue = { row: number; status: "ok" | "skipped" | "error"; errors: string[]; warnings: string[] };
type Preview = { counts: Counts; by_quarter: ByQuarter; issues: Issue[] };
type Committed = { batch_id?: string; counts: Counts; result: { imported: number; skipped?: number; quarters_created?: number; organisations_created?: number }; note?: string };

const MAX_BYTES = 2_000_000;
const Tile = ({ label, value, tone }: { label: string; value: number; tone?: string }) => (
  <div className="rounded-field border border-line bg-surface p-4">
    <dt className="text-sm text-muted">{label}</dt>
    <dd className={cn("mt-1 text-2xl font-bold tabular-nums text-ink", tone)}>{value.toLocaleString("en-KE")}</dd>
  </div>
);

export function ImportCard() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [createMissing, setCreateMissing] = useState(false);
  const [checking, setChecking] = useState(false);
  const [importing, setImporting] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [done, setDone] = useState<Committed | null>(null);
  const [drag, setDrag] = useState(false);

  const reset = () => { setPreview(null); setDone(null); };

  function pick(f: File | undefined) {
    if (!f) return;
    if (!/\.(csv|json)$/i.test(f.name)) { notify("common.file_type", { types: "CSV or JSON" }); return; }
    if (f.size > MAX_BYTES) { notify("common.file_too_large", { max: "2 MB" }); return; }
    setFile(f); reset();
  }

  function fail(res: { status: number; error: string; fields?: Record<string, string[]> }) {
    const m = res.error;
    if (/too many rows/i.test(m)) notify("admin.migration.too_many_rows", { max: 5000 });
    else if (/larger than/i.test(m)) notify("common.file_too_large", { max: "2 MB" });
    else if (/not valid JSON|no data rows|no rows|Attach a CSV|JSON must be/i.test(m)) notify("admin.migration.file_invalid");
    else if (/rolled back/i.test(m)) notify("admin.migration.failed", { reason: m.replace(/^Import failed and was rolled back:\s*/i, "") });
    else toastFailure(res);
  }

  const buildForm = () => { const f = new FormData(); f.set("file", file!); f.set("create_missing", String(createMissing)); return f; };

  async function check() {
    if (!file) return;
    setChecking(true); setDone(null);
    const res = await api<Preview>("/api/migration?mode=dry", { form: buildForm(), silent: true });
    setChecking(false);
    if (!res.ok) { fail(res); return; }
    setPreview(res.data);
    const c = res.data.counts;
    if (c.errors > 0) notify("admin.migration.has_errors", { errors: c.errors });
    else notify("admin.migration.dry_run_ok", { importable: c.importable, skipped: c.skipped, errors: c.errors });
  }

  async function commit() {
    if (!file) return;
    setImporting(true);
    const res = await api<Committed>("/api/migration?mode=commit", { form: buildForm(), silent: true });
    setImporting(false); setConfirm(false);
    if (!res.ok) { fail(res); return; }
    if (res.data.result.imported === 0) { notify("admin.migration.nothing"); return; }
    notify("admin.migration.committed", { imported: res.data.result.imported, skipped: res.data.result.skipped ?? 0 });
    setDone(res.data); setPreview(null); setFile(null);
    router.refresh();
  }

  const c = preview?.counts;
  return (
    <SettingsCard id="import" title="Data Import" subtitle="Bring past orders from HHES's earlier records into the system, as read-only history.">
      <ol className="space-y-1 text-[15px] leading-relaxed text-muted">
        <li>1. Download the template and fill in one row per organisation per quarter.</li>
        <li>2. Choose the file and press <strong className="font-medium text-ink">Check file</strong>. Nothing is saved yet.</li>
        <li>3. Review the summary, then import the good rows.</li>
      </ol>
      <Button variant="outline" size="sm" className="mt-4" onClick={() => downloadCsv("/api/migration/template")}><Download size={16} aria-hidden /> Download template</Button>

      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}
        className={cn("mt-6 flex flex-col items-center gap-3 rounded-card border-2 border-dashed px-6 py-8 text-center transition-colors", drag ? "border-primary bg-primary-soft" : "border-line-strong")}>
        <input ref={input} type="file" accept=".csv,.json" className="sr-only" aria-label="Choose a CSV or JSON file" onChange={(e) => pick(e.target.files?.[0])} />
        {file ? (
          <div className="flex items-center gap-3 text-[15px]">
            <FileUp size={20} className="text-primary" aria-hidden />
            <span className="font-medium text-ink">{file.name}</span>
            <span className="text-muted">{(file.size / 1024).toFixed(0)} KB</span>
            <button type="button" aria-label="Remove file" onClick={() => { setFile(null); reset(); if (input.current) input.current.value = ""; }} className="text-muted hover:text-danger-solid"><X size={18} /></button>
          </div>
        ) : (
          <>
            <FileUp size={26} className="text-muted" aria-hidden />
            <p className="text-[15px] text-muted">Drag a CSV or JSON file here, or</p>
            <Button variant="outline" size="sm" onClick={() => input.current?.click()}>Choose file</Button>
            <p className="text-sm text-muted">Up to 2 MB and 5,000 rows.</p>
          </>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <Checkbox checked={createMissing} onChange={(e) => { setCreateMissing(e.target.checked); reset(); }}
          label={<span>Create organisations that don't exist yet <span className="text-muted">(they get access when they register)</span></span>} />
        <Button loading={checking} disabled={!file || importing} onClick={check}>Check file</Button>
      </div>

      {preview && c && (
        <div className="mt-8 border-t border-line pt-8">
          <h3 className="font-sans text-lg font-semibold text-ink">Preview</h3>
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Tile label="Rows in file" value={c.rows} />
            <Tile label="Will import" value={c.importable} tone={c.importable ? "text-success" : undefined} />
            <Tile label="Already there (skipped)" value={c.skipped} />
            <Tile label="With errors" value={c.errors} tone={c.errors ? "text-danger-solid" : undefined} />
            <Tile label="New organisations" value={c.new_organisations} />
            <Tile label="New quarters" value={c.new_quarters} />
          </dl>

          {preview.by_quarter.length > 0 && (
            <div className="mt-6 overflow-x-auto rounded-field border border-line">
              <table className="w-full min-w-[440px] text-left text-[15px]">
                <thead className="bg-panel"><tr>{["Quarter", "Orders", "Books", "Value"].map((h) => <th key={h} className="px-4 py-3 text-sm font-medium text-muted">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-line">
                  {preview.by_quarter.map((q) => (
                    <tr key={q.quarter}>
                      <td className="px-4 py-3 font-medium text-ink">{q.quarter} {q.new_quarter && <Badge tone="info" className="ml-2">New</Badge>}</td>
                      <td className="px-4 py-3 tabular-nums">{q.orders}</td><td className="px-4 py-3 tabular-nums">{q.books.toLocaleString("en-KE")}</td>
                      <td className="px-4 py-3 font-mono">{kes(q.value_kes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {preview.issues.length > 0 && (
            <div className="mt-6">
              <h4 className="mb-2 text-[15px] font-medium text-ink">Rows to look at</h4>
              <ul className="max-h-72 divide-y divide-line overflow-y-auto rounded-field border border-line">
                {preview.issues.map((i) => (
                  <li key={i.row} className="flex gap-3 px-4 py-3 text-sm">
                    <span className="w-14 shrink-0 font-mono text-muted">Row {i.row}</span>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      {i.errors.map((m, k) => <p key={k} className="text-danger">{m}</p>)}
                      {i.warnings.map((m, k) => <p key={k} className="text-warning">{m}</p>)}
                      {i.status === "skipped" && <p className="text-muted">Skipped: already imported</p>}
                    </div>
                    <Badge tone={i.status === "error" ? "dangerSoft" : i.status === "skipped" ? "neutral" : "warning"}>{i.status === "ok" ? "Note" : i.status === "error" ? "Error" : "Skipped"}</Badge>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-sm text-muted">Rows with errors are left out. Fix them and import again; rows already imported are skipped automatically.</p>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <Button disabled={c.importable === 0} onClick={() => setConfirm(true)}>Import {c.importable.toLocaleString("en-KE")} {c.importable === 1 ? "order" : "orders"}</Button>
          </div>
        </div>
      )}

      {done && (
        <div className="mt-8 flex gap-4 rounded-card border border-success/30 bg-success-soft p-5">
          <CircleCheck size={24} className="mt-0.5 shrink-0 text-success" aria-hidden />
          <div className="text-[15px] leading-relaxed text-ink">
            <p className="font-semibold">Import complete</p>
            <p className="text-muted">
              {done.result.imported} orders imported{done.result.quarters_created ? `, ${done.result.quarters_created} new quarter(s)` : ""}{done.result.organisations_created ? `, ${done.result.organisations_created} new organisation(s)` : ""}.
              {done.counts.errors > 0 && ` ${done.counts.errors} rows with errors were left out.`}
            </p>
            {done.batch_id && <p className="mt-1 text-sm text-muted">Batch reference <span className="font-mono">{done.batch_id}</span></p>}
          </div>
        </div>
      )}

      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} loading={importing} confirmLabel="Import orders" onConfirm={commit}
        title={`Import ${c?.importable ?? 0} historical orders?`}
        description="They're added as collected, cash-paid orders and can't be edited afterwards. They won't appear in M-Pesa reconciliation." />
    </SettingsCard>
  );
}