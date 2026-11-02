import { Badge, type BadgeTone } from "@/components/ui/Badge";

export const TypeBadge = ({ type }: { type: string }) => <Badge tone="soft">{type.charAt(0).toUpperCase() + type.slice(1)}</Badge>;

export function OrgStatusBadge({ status }: { status: string }) {
  if (status === "approved") return <Badge tone="success">Active</Badge>;
  if (status === "inactive") return <Badge tone="plain">Inactive</Badge>;
  if (status === "rejected") return <Badge tone="danger">Rejected</Badge>;
  return <Badge tone="warning">Pending</Badge>;
}

const ORDER: Record<string, [BadgeTone, string]> = {
  awaiting_payment: ["warning", "Awaiting payment"], paid: ["info", "Paid"],
  ready_for_pickup: ["attention", "Ready for Pickup"], collected: ["positive", "Collected"], cancelled: ["danger", "Cancelled"],
};
export function OrderStatusBadge({ status }: { status: string }) {
  const [tone, label] = ORDER[status] ?? ["neutral", status];
  return <Badge tone={tone}>{label}</Badge>;
}

const PAYMENT: Record<string, [BadgeTone, string]> = {
  awaiting_payment: ["warning", "Awaiting"], paid: ["successSoft", "Paid"], failed: ["dangerSoft", "Failed"],
  pending: ["warning", "Pending"], success: ["successSoft", "Paid"], timeout: ["dangerSoft", "Timed out"],
};
export function PaymentStatusBadge({ status }: { status: string }) {
  const [tone, label] = PAYMENT[status] ?? ["neutral", status];
  return <Badge tone={tone}>{label}</Badge>;
}