"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { CalendarPlus } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { buttonStyles } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { AccessSwitch } from "./AccessSwitch";
import { OrderStatusBadge, OrgStatusBadge, PaymentStatusBadge, TypeBadge } from "./StatusBadges";
import { api } from "@/lib/api";
import { notify } from "@/lib/notify";
import { fmtDate, fmtDay, kes, maskPhone } from "@/lib/utils/format";
import type { OrgDetail } from "@/lib/admin/organisations";

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="border-b border-line py-6 first:pt-0 last:border-0">
    <h3 className="mb-4 font-sans text-[13px] font-semibold uppercase tracking-[0.1em] text-muted">{title}</h3>
    {children}
  </section>
);

const Item = ({ label, children }: { label: string; children: ReactNode }) => (
  <div>
    <dt className="text-sm text-muted">{label}</dt>
    <dd className="mt-0.5 break-words text-[15px] text-ink">{children}</dd>
  </div>
);

const Empty = ({ children }: { children: ReactNode }) => <p className="text-sm text-muted">{children}</p>;

export function OrganisationPanel({ orgId, onClose, onChanged }: { orgId: string | null; onClose: () => void; onChanged: () => void }) {
  const [detail, setDetail] = useState<OrgDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    const res = await api<{ data: OrgDetail }>(`/api/organisations/${id}`, { silent: true });
    setLoading(false);
    if (res.ok) setDetail(res.data.data);
    else { notify("admin.org.load_failed"); onClose(); }
  }, [onClose]);

  useEffect(() => {
    if (!orgId) { setDetail(null); return; }
    setDetail(null);
    load(orgId);
  }, [orgId]); // eslint-disable-line react-hooks/exhaustive-deps

  const payments = (detail?.orders ?? [])
    .flatMap((o) => o.mpesa_transactions.map((t) => ({ ...t, reference: o.reference })))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <Dialog side open={!!orgId} onClose={onClose}
      title={detail ? detail.name : "Organisation"}
      description={detail && <span className="mt-2 flex flex-wrap items-center gap-2"><TypeBadge type={detail.type} /><OrgStatusBadge status={detail.status} /></span>}>
      {loading || !detail ? (
        <div className="space-y-4" aria-busy="true">
          {[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-field bg-canvas" />)}
        </div>
      ) : (
        <>
          <Section title="Contact">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Item label="Contact person">{detail.contact_name}</Item>
              <Item label="Email"><a className="text-primary hover:underline" href={`mailto:${detail.contact_email}`}>{detail.contact_email}</a></Item>
              <Item label="Phone">{detail.phone || "-"}</Item>
              <Item label="M-Pesa number">{detail.mpesa_phone ? maskPhone(detail.mpesa_phone) : <span className="text-muted">Not set yet</span>}</Item>
              <Item label="Registered">{fmtDay(detail.created_at)}</Item>
              {detail.approved_at && <Item label="Approved">{fmtDay(detail.approved_at)}</Item>}
            </dl>
            {detail.status === "rejected" && detail.rejection_reason && (
              <p className="mt-4 rounded-field bg-danger-soft px-4 py-3 text-sm leading-relaxed text-danger">
                <strong className="font-semibold">Rejected:</strong> {detail.rejection_reason}
              </p>
            )}
          </Section>

          <Section title="System access">
            {detail.has_login && (detail.status === "approved" || detail.status === "inactive") ? (
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm leading-relaxed text-muted">
                  {detail.status === "approved" ? "Can sign in and place orders." : "Signed out and blocked from ordering."}
                </p>
                <AccessSwitch org={detail} onChanged={() => { load(detail.id); onChanged(); }} />
              </div>
            ) : (
              <Empty>{detail.status === "rejected" ? "This registration was rejected, so there is no access." : "No login yet. They'll appear here for approval once they register."}</Empty>
            )}
          </Section>

          <Section title="Orders">
            {detail.orders.length === 0 ? <Empty>No orders yet.</Empty> : (
              <ul className="space-y-3">
                {detail.orders.map((o) => (
                  <li key={o.id} className="rounded-field border border-line p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-ink">{o.quarters?.name ?? "-"}</p>
                        <p className="mt-0.5 font-mono text-sm text-muted">{o.reference}</p>
                      </div>
                      <div className="flex flex-wrap justify-end gap-2">
                        <OrderStatusBadge status={o.status} />
                        {o.is_historical ? <Badge tone="neutral">Imported</Badge> : <PaymentStatusBadge status={o.payment_status} />}
                        {o.refund_due && <Badge tone="dangerSoft">Refund due {kes(o.refund_amount_kes)}</Badge>}
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-muted">
                      Total <span className="font-mono text-ink">{kes(o.total_amount_kes)}</span> · Paid <span className="font-mono text-ink">{kes(o.amount_paid_kes)}</span>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="M-Pesa payments">
            {payments.length === 0 ? <Empty>No payments yet.</Empty> : (
              <ul className="divide-y divide-line rounded-field border border-line">
                {payments.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <p className="font-mono text-[15px] text-ink">{t.mpesa_receipt_number ?? "No receipt"}</p>
                      <p className="text-sm text-muted">{t.reference} · {fmtDay(t.transaction_date ?? t.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[15px] text-ink">{kes(t.amount_kes)}</span>
                      <PaymentStatusBadge status={t.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Deadline extensions">
            {detail.overrides.length === 0 ? <Empty>No extensions granted.</Empty> : (
              <ul className="mb-4 space-y-3">
                {detail.overrides.map((x) => (
                  <li key={x.id} className="rounded-field border border-line p-4">
                    <p className="font-medium text-ink">{x.quarters?.name ?? "-"}: {fmtDate(x.original_deadline)} → {fmtDate(x.new_deadline)}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{x.reason}</p>
                    <p className="mt-1 text-xs text-muted">{x.granted_by_profile?.full_name ?? "An admin"} · {fmtDay(x.granted_at)}</p>
                  </li>
                ))}
              </ul>
            )}
            {detail.status === "approved" && (
              <Link href={`/admin/quarters?extend=${detail.id}`} className={buttonStyles({ variant: "outline", size: "sm" })}>
                <CalendarPlus size={16} aria-hidden /> Grant extension
              </Link>
            )}
          </Section>
        </>
      )}
    </Dialog>
  );
}