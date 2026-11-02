import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getRepContext } from "@/lib/rep/context";
import { loadPay } from "@/lib/rep/pay";
import { PayPanel } from "@/components/rep/pay/PayPanel";

export const metadata: Metadata = { title: "Pay for your order" };

export default async function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await getRepContext();
  if (!ctx) redirect("/login");
  const { id } = await params;
  const data = await loadPay(ctx, id);
  if (!data) notFound();

  return (
    <>
      <Link href="/rep/dashboard" className="mb-5 inline-flex items-center gap-2 text-[15px] font-medium text-muted hover:text-ink"><ArrowLeft size={16} aria-hidden /> Back to dashboard</Link>
      <h1 className="text-3xl font-bold text-ink sm:text-[32px]">Pay for Your Order</h1>
      <p className="mt-3 max-w-[720px] text-base leading-relaxed text-muted">Pay securely with M-Pesa. Your order is confirmed as soon as the payment goes through.</p>
      <div className="mt-8">
        <PayPanel order={data.order} tx={data.tx} savedPhone={data.savedPhone} state={data.state} deadline={data.deadline} />
      </div>
    </>
  );
}