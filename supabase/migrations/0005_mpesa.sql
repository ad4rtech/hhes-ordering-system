-- Applies one Safaricom result atomically. Safe to call twice for the same CheckoutRequestID (BR-11).
create or replace function apply_mpesa_result(
  p_checkout_id text, p_result_code int, p_result_desc text,
  p_receipt text, p_amount numeric, p_tx_date timestamptz, p_payload jsonb
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare t mpesa_transactions; o orders; paid numeric; v_amount numeric; v_date timestamptz;
begin
  select * into t from mpesa_transactions where checkout_request_id = p_checkout_id for update;
  if not found then return jsonb_build_object('outcome', 'unknown'); end if;
  if t.status <> 'pending' then
    return jsonb_build_object('outcome', 'duplicate', 'order_id', t.order_id);
  end if;

  select * into o from orders where id = t.order_id for update;

  if p_result_code = 0 then
    v_amount := coalesce(p_amount, t.amount_kes);
    v_date := coalesce(p_tx_date, now());

    update mpesa_transactions
       set status = 'success', result_code = 0, result_desc = p_result_desc,
           mpesa_receipt_number = p_receipt, transaction_date = v_date,
           raw_callback_payload = p_payload
     where id = t.id;

    paid := o.amount_paid_kes + v_amount;

    -- Money arrived for an order that was cancelled while the prompt was open: flag a refund
    if o.status = 'cancelled' then
      update orders set amount_paid_kes = paid, refund_due = true, refund_amount_kes = paid where id = o.id;
      return jsonb_build_object('outcome', 'paid_after_cancel', 'order_id', o.id,
                                'amount', v_amount, 'receipt', p_receipt);
    end if;

    if paid >= o.total_amount_kes then
      update orders
         set amount_paid_kes = paid,
             payment_status = 'paid',
             status = case when status = 'awaiting_payment' then 'paid' else status end,
             refund_due = (paid > o.total_amount_kes),
             refund_amount_kes = greatest(paid - o.total_amount_kes, 0)
       where id = o.id;
      return jsonb_build_object('outcome', 'paid', 'order_id', o.id, 'amount', v_amount,
                                'receipt', p_receipt, 'transaction_date', v_date, 'amount_due', 0);
    end if;

    -- Paid less than the current total (e.g. the order was amended up meanwhile)
    update orders set amount_paid_kes = paid, payment_status = 'awaiting_payment' where id = o.id;
    return jsonb_build_object('outcome', 'partial', 'order_id', o.id, 'amount', v_amount,
                              'receipt', p_receipt, 'transaction_date', v_date,
                              'amount_due', o.total_amount_kes - paid);
  end if;

  -- Failure, cancellation by the customer, or timeout (1037)
  update mpesa_transactions
     set status = case when p_result_code = 1037 then 'timeout' else 'failed' end,
         result_code = p_result_code, result_desc = p_result_desc, raw_callback_payload = p_payload
   where id = t.id;
  if o.status = 'awaiting_payment' then
    update orders set payment_status = 'failed' where id = o.id;
  end if;
  return jsonb_build_object('outcome', 'failed', 'order_id', o.id,
                            'result_code', p_result_code, 'result_desc', p_result_desc);
end $$;

revoke all on function apply_mpesa_result(text,int,text,text,numeric,timestamptz,jsonb) from public, anon, authenticated;
grant execute on function apply_mpesa_result(text,int,text,text,numeric,timestamptz,jsonb) to service_role;

-- Live payment status in the UI (used by the frontend later)
do $$ begin alter publication supabase_realtime add table orders;
exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table mpesa_transactions;
exception when duplicate_object then null; end $$;