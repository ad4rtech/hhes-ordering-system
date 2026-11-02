export const PREF_KEYS = [
  "org_registration",
  "critical_stock",
  "order_cancelled",
  "deadline_overrides",
  "payment_review",
  "refund_due",
] as const;

export type PrefKey = (typeof PREF_KEYS)[number];

export type NotificationType =
  | "org_registration"
  | "critical_stock"
  | "order_cancelled"
  | "override_granted"
  | "override_used"
  | "reminders_sent"
  | "payment_review"
  | "refund_due";

export type Prefs = Record<PrefKey, boolean>;

// Every email alert is on until the admin turns it off on their profile
export const DEFAULT_PREFS: Prefs = {
  org_registration: true,
  critical_stock: true,
  order_cancelled: true,
  deadline_overrides: true,
  payment_review: true,
  refund_due: true,
};

export const PREF_META: { key: PrefKey; title: string; description: string }[] = [
  { key: "org_registration", title: "New Organisation Registrations", description: "Receive an email when a new organisation requests an account." },
  { key: "critical_stock", title: "Critical Stock Alerts", description: "Get notified when order demand exceeds available inventory for any category." },
  { key: "order_cancelled", title: "Order Cancellations", description: "Receive an email when an organisation cancels a submitted order." },
  { key: "deadline_overrides", title: "Deadline Overrides", description: "Get notified when another admin grants a deadline extension." },
  { key: "payment_review", title: "Payments Needing Review", description: "Get notified when an M-Pesa payment can't be confirmed automatically." },
  { key: "refund_due", title: "Refunds Due", description: "Get notified when a paid order is cancelled or reduced and needs a refund." },
];

export const FILTERS: Record<string, { label: string; types?: NotificationType[]; unread?: boolean }> = {
  all: { label: "All Notifications" },
  unread: { label: "Unread", unread: true },
  registrations: { label: "Registrations", types: ["org_registration"] },
  stock: { label: "Stock Alerts", types: ["critical_stock"] },
  orders: { label: "Orders", types: ["order_cancelled"] },
  payments: { label: "Payments", types: ["payment_review", "refund_due"] },
  deadlines: { label: "Deadlines", types: ["override_granted", "override_used", "reminders_sent"] },
};