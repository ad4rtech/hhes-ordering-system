export type MessageType = "success" | "error" | "warning" | "info";
export type Message = { type: MessageType; title: string; description?: string; duration?: number; id?: string };

export const MESSAGES = {
  // ── common ──
  "common.network": { type: "error", id: "network", title: "You're offline", description: "We couldn't reach the server. Check your connection and try again." },
  "common.session_expired": { type: "warning", id: "session", title: "Session expired", description: "Please sign in again to continue." },
  "common.forbidden": { type: "error", title: "Not allowed", description: "You don't have permission to do that." },
  "common.not_found": { type: "error", title: "Not found", description: "We couldn't find that. It may have been removed." },
  "common.validation": { type: "error", title: "Check the highlighted fields", description: "Some details need fixing before you can continue." },
  "common.server_error": { type: "error", title: "Something went wrong on our side", description: "Please try again in a moment. If it keeps happening, contact HHES." },
  "common.rate_limited": { type: "warning", title: "Please slow down", description: "Too many attempts. Wait a minute and try again." },
  "common.action_failed": { type: "error", title: "Couldn't complete that", description: "{reason}" },
  "common.saved": { type: "success", title: "Changes saved" },
  "common.copied": { type: "success", title: "Copied to clipboard", description: "{what}" },
  "common.copy_failed": { type: "error", title: "Couldn't copy", description: "Select the text and copy it manually." },
  "common.download_started": { type: "success", title: "Download started", description: "{file}" },
  "common.download_failed": { type: "error", title: "Couldn't create the file", description: "Please try again." },
  "common.file_too_large": { type: "error", title: "File is too large", description: "Choose a file under {max}." },
  "common.file_type": { type: "error", title: "Unsupported file", description: "Use a {types} file." },

  // ── auth: registration ──
  "auth.register.success": { type: "success", title: "Registration submitted", description: "We'll email {email} once {org} is approved." },
  "auth.register.email_taken": { type: "error", title: "Email already registered", description: "Sign in instead, or use a different email address." },
  "auth.register.failed": { type: "error", title: "Registration didn't go through", description: "Please try again." },

  // ── auth: Google ──
  "auth.google.start_failed": { type: "error", title: "Couldn't start Google sign-in", description: "Please try again, or register with your email." },
  "auth.google.cancelled": { type: "info", title: "Google sign-in cancelled", description: "No changes were made." },
  "auth.google.callback_failed": { type: "error", title: "Google sign-in failed", description: "We couldn't complete the sign-in. Please try again." },
  "auth.complete.success": { type: "success", title: "Registration submitted", description: "We'll email {email} once {org} is approved." },
  "auth.complete.already_registered": { type: "info", title: "Organisation already registered", description: "Taking you to your account." },
  "auth.complete.failed": { type: "error", title: "Couldn't submit your registration", description: "Please try again." },

  // ── auth: sign in/out ──
  "auth.login.invalid": { type: "error", title: "Wrong email or password", description: "Check your details and try again." },
  "auth.login.pending": { type: "info", title: "Awaiting approval", description: "HHES hasn't approved your registration yet. We'll email you when it's ready." },
  "auth.login.rejected": { type: "error", title: "Registration not approved", description: "Check your email for the reason, or contact HHES." },
  "auth.login.inactive": { type: "error", title: "Account deactivated", description: "Contact HHES to reactivate your account." },
  "auth.login.no_org": { type: "warning", title: "Finish registering", description: "Add your organisation details to continue." },
  "auth.login.too_many": { type: "warning", title: "Too many attempts", description: "Wait a few minutes before trying again." },
  "auth.login.failed": { type: "error", title: "Couldn't sign you in", description: "Please try again." },
  "auth.login.expired": { type: "info", title: "Signed out for inactivity", description: "Sign in again to continue." },
  "auth.session.changed": { type: "warning", title: "Session changed", description: "You signed out or signed in as someone else in another tab. Please sign in again." },
  "auth.logout.success": { type: "success", title: "Signed out", description: "See you next time." },

  // ── auth: passwords and invitations ──
  "auth.forgot.sent": { type: "success", title: "Check your email", description: "If an account exists for {email}, we've sent a reset link." },
  "auth.forgot.failed": { type: "error", title: "Couldn't send the reset email", description: "Please try again in a moment." },
  "auth.forgot.rate_limited": { type: "warning", title: "Please wait before trying again", description: "We've already sent a reset email recently. Check your inbox, or try again in a few minutes." },
  "auth.reset.success": { type: "success", title: "Password updated", description: "You can now sign in with your new password." },
  "auth.reset.link_expired": { type: "error", title: "Link expired", description: "Request a new reset link." },
  "auth.reset.weak": { type: "error", title: "Password is too weak", description: "Use at least 10 characters with upper and lower case letters and a number." },
  "auth.reset.failed": { type: "error", title: "Couldn't update your password", description: "Please try again." },
  "auth.reset.same": { type: "warning", title: "Choose a different password", description: "Your new password must be different from the old one." },
  "auth.invite.accepted": { type: "success", title: "Welcome to HHES", description: "Your admin account is ready." },
  "auth.invite.link_invalid": { type: "error", title: "Invitation link invalid", description: "Ask an admin to send a new invitation." },
  "auth.admin.not_admin": { type: "error", title: "Administrators only", description: "Use the Organisation Portal to sign in to your organisation's account." },

  // ── admin: organisations ──
  "admin.org.approved": { type: "success", title: "{org} approved", description: "We've emailed {email}." },
  "admin.org.rejected": { type: "success", title: "{org} rejected", description: "We've emailed the reason." },
  "admin.org.reason_required": { type: "error", title: "Add a reason", description: "Tell the organisation why it wasn't approved." },
  "admin.org.deactivated": { type: "success", title: "{org} deactivated", description: "They can no longer sign in." },
  "admin.org.reactivated": { type: "success", title: "{org} reactivated" },
  "admin.org.no_login": { type: "error", title: "No login yet", description: "This organisation will appear for approval when it registers." },
  "admin.org.invalid_state": { type: "error", title: "Action not available", description: "{org} is {status}." },
  "admin.org.load_failed": { type: "error", title: "Couldn't load organisations", description: "Please try again." },

  // ── admin: quarters ──
  "admin.quarter.created": { type: "success", title: "{quarter} created", description: "Set prices, then publish." },
  "admin.quarter.updated": { type: "success", title: "Quarter updated" },
  "admin.quarter.dates_invalid": { type: "error", title: "Check the dates", description: "The deadline must be on or after the opening date." },
  "admin.quarter.name_taken": { type: "error", title: "Name already in use", description: "A quarter named {quarter} already exists." },
  "admin.quarter.published": { type: "success", title: "{quarter} is open", description: "Organisations are being emailed." },
  "admin.quarter.publish_blocked_prices": { type: "error", title: "Set all six prices first", description: "Every category needs a price above zero before publishing." },
  "admin.quarter.publish_blocked_active": { type: "error", title: "Another quarter is open", description: "Close {quarter} before publishing a new one." },
  "admin.quarter.closed": { type: "success", title: "{quarter} closed", description: "Ordering is now closed." },
  "admin.quarter.not_editable": { type: "error", title: "Only drafts can be edited", description: "Published and closed quarters are locked." },
  "admin.quarter.not_published": { type: "error", title: "Quarter isn't open", description: "Only an open quarter can be closed." },

  // ── admin: catalogue ──
  "admin.catalogue.saved": { type: "success", title: "Prices and stock saved" },
  "admin.catalogue.stock_saved": { type: "success", title: "Stock updated" },
  "admin.catalogue.prices_locked": { type: "error", title: "Prices are locked", description: "Prices can't change once a quarter is published. Stock can." },
  "admin.catalogue.closed": { type: "error", title: "Quarter is closed", description: "Its catalogue can't be changed." },

  // ── admin: deadline extensions ──
  "admin.override.granted": { type: "success", title: "Deadline extended", description: "{org} can order until {date}." },
  "admin.override.reason_required": { type: "error", title: "Add a reason", description: "Extensions are recorded in the audit log." },
  "admin.override.date_invalid": { type: "error", title: "Pick a later date", description: "The new deadline must be after {date}." },
  "admin.override.not_open": { type: "error", title: "No open quarter", description: "Extensions apply to the open quarter only." },
  "admin.override.org_not_approved": { type: "error", title: "Organisation isn't approved" },

  // ── admin: orders ──
  "admin.order.ready": { type: "success", title: "Marked ready for pickup", description: "{org} has been emailed." },
  "admin.order.collected": { type: "success", title: "Marked as collected", description: "The order is now locked." },
  "admin.order.unpaid": { type: "error", title: "Order isn't paid yet", description: "Only fully paid orders can be prepared for pickup." },
  "admin.order.bad_transition": { type: "error", title: "Can't change status", description: "An order can't move from {from} to {to}." },
  "admin.order.refund_processed": { type: "success", title: "Refund recorded" },
  "admin.order.no_refund": { type: "info", title: "No refund pending" },
  "admin.order.load_failed": { type: "error", title: "Couldn't load the order", description: "Please try again." },

  // ── admin: payments ──
  "admin.payment.confirmed": { type: "success", title: "Payment confirmed", description: "Receipt {receipt} recorded for {org}." },
  "admin.payment.marked_failed": { type: "success", title: "Payment marked as failed", description: "{org} has been emailed to retry." },
  "admin.payment.receipt_invalid": { type: "error", title: "Check the receipt number", description: "M-Pesa receipts are 10 letters or numbers." },
  "admin.payment.receipt_duplicate": { type: "error", title: "Receipt already used", description: "That receipt is recorded on another payment." },
  "admin.payment.already_settled": { type: "info", title: "Already settled", description: "This payment is {status}." },
  "admin.payment.export_empty": { type: "info", title: "No transactions to export" },

  // ── admin: reports ──
  "admin.report.empty": { type: "info", title: "Nothing to export", description: "There's no data for this quarter yet." },
  "admin.report.load_failed": { type: "error", title: "Couldn't load the report", description: "Please try again." },
  "admin.report.reminder_sent": { type: "success", title: "Reminder sent", description: "{org} has been emailed." },
  "admin.report.reminder_today": { type: "info", title: "Already reminded today", description: "{org} was already sent a reminder today." },
  "admin.report.bulk_sent": { type: "success", title: "Reminders sent", description: "{sent} organisations emailed. {skipped} skipped (already reminded today, or past their deadline)." },
  "admin.report.bulk_none": { type: "info", title: "Nobody to remind", description: "Everyone eligible was already reminded today." },

  // ── admin: notifications ──
  "admin.notifications.all_read": { type: "success", title: "All caught up", description: "{count} notifications marked as read." },
  "admin.notifications.deleted": { type: "success", title: "Notification deleted" },
  "admin.notifications.failed": { type: "error", title: "Couldn't update notifications", description: "Please try again." },

  // ── admin: profile ──
  "admin.profile.saved": { type: "success", title: "Profile updated" },
  "admin.profile.failed": { type: "error", title: "Couldn't save your profile", description: "Please try again." },
  "admin.profile.password_changed": { type: "success", title: "Password changed", description: "You've been signed out on your other devices." },
  "admin.profile.password_wrong": { type: "error", title: "Current password is wrong", description: "Check it and try again." },
  "admin.profile.photo_saved": { type: "success", title: "Photo updated" },
  "admin.profile.photo_removed": { type: "success", title: "Photo removed" },
  "admin.profile.photo_invalid": { type: "error", title: "Can't use that image", description: "Choose a JPG, PNG or WebP image under 5 MB." },
  "admin.profile.photo_failed": { type: "error", title: "Couldn't update the photo", description: "Please try again." },
  "admin.profile.prefs_saved": { type: "success", id: "prefs", title: "Preference saved" },

  // ── admin: email change ──
  "admin.profile.email_requested": { type: "success", title: "Check both inboxes", description: "We sent confirmation links to {old} and {new}. Open both to finish." },
  "admin.profile.email_pending": { type: "info", title: "One more link to confirm", description: "Open the confirmation link sent to your other address too." },
  "admin.profile.email_updated": { type: "success", title: "Email updated", description: "Use your new email to sign in from now on." },
  "admin.profile.email_taken": { type: "error", title: "Email already in use", description: "Another account already uses that address." },
  "admin.profile.email_same": { type: "warning", title: "That's already your email" },
  "admin.profile.email_failed": { type: "error", title: "Couldn't change your email", description: "The link may have expired. Request the change again." },

  // ── admin: team ──
  "admin.invite.sent": { type: "success", title: "Invitation sent", description: "{email} will get an email to set a password." },
  "admin.invite.exists": { type: "error", title: "Already registered", description: "{email} already has an account." },
  "admin.invite.failed": { type: "error", title: "Couldn't send the invitation", description: "Please try again." },
  "admin.invite.resent": { type: "success", title: "Invitation resent", description: "{email} has a fresh link. The old one no longer works." },
  "admin.invite.revoked": { type: "success", title: "Invitation revoked", description: "{email} can no longer use that link." },
  "admin.invite.signed_in": { type: "error", title: "Already signed in", description: "This admin has already used their invitation." },

  // ── admin: import ──
  "admin.migration.file_invalid": { type: "error", title: "Can't read that file", description: "Use the CSV or JSON template." },
  "admin.migration.too_many_rows": { type: "error", title: "Too many rows", description: "Split the file into batches of {max} rows or fewer." },
  "admin.migration.dry_run_ok": { type: "info", title: "Preview ready", description: "{importable} importable, {skipped} skipped, {errors} with errors." },
  "admin.migration.has_errors": { type: "warning", title: "{errors} rows need attention", description: "Fix them and re-upload. Valid rows can still be imported." },
  "admin.migration.committed": { type: "success", title: "Import complete", description: "{imported} orders imported, {skipped} skipped." },
  "admin.migration.nothing": { type: "info", title: "Nothing to import" },
  "admin.migration.failed": { type: "error", title: "Import failed", description: "Nothing was imported. {reason}" },

  // ── rep: ordering ──
  "rep.order.placed": { type: "success", title: "Order placed", description: "Order {reference}, total {total}. Pay with M-Pesa to secure it." },
  "rep.order.no_quarter": { type: "error", title: "Ordering is closed", description: "There's no quarter open for ordering right now." },
  "rep.order.not_open_yet": { type: "info", title: "Ordering hasn't opened", description: "Ordering for {quarter} opens on {date}." },
  "rep.order.deadline_passed": { type: "error", title: "Deadline has passed", description: "Ordering closed on {date}. Contact HHES if you need an exception." },
  "rep.order.already_exists": { type: "warning", title: "You already have an order", description: "Amend your existing order instead." },
  "rep.order.empty": { type: "error", title: "Add at least one book", description: "Enter a quantity for at least one lesson category." },
  "rep.order.not_approved": { type: "error", title: "Account not approved", description: "HHES needs to approve your organisation before you can order." },
  "rep.order.failed": { type: "error", title: "Couldn't place your order", description: "Please try again." },
  "rep.order.amended": { type: "success", title: "Order updated", description: "New total {total}." },
  "rep.order.amended_topup": { type: "warning", title: "Extra payment needed", description: "Your new total is higher. Pay {amount} to complete the change." },
  "rep.order.amended_refund": { type: "info", title: "Refund pending", description: "Your new total is lower. HHES finance will refund {amount}." },
  "rep.order.no_changes": { type: "info", title: "No changes to save" },
  "rep.order.empty_amend": { type: "error", title: "An order needs at least one book", description: "To remove everything, cancel the order instead." },
  "rep.order.locked_ready": { type: "error", title: "Order is ready for pickup", description: "It can no longer be amended. Contact HHES or cancel it." },
  "rep.order.locked_collected": { type: "error", title: "Order already collected", description: "Collected orders can't be changed." },
  "rep.order.locked_cancelled": { type: "error", title: "Order was cancelled", description: "Cancelled orders can't be changed." },
  "rep.order.out_of_stock": { type: "error", title: "{item} is out of stock", description: "Set it to 0 to continue with the rest of your order." },
  "rep.order.stock_short": { type: "warning", title: "Not enough {item} left", description: "Only {left} {units} available. Reduce the quantity and try again." },
  "rep.order.cancelled": { type: "success", title: "Order cancelled" },
  "rep.order.cancelled_refund": { type: "info", title: "Order cancelled, refund pending", description: "HHES finance will refund {amount} to your M-Pesa." },
  "rep.order.cancel_failed": { type: "error", title: "Can't cancel this order", description: "{reason}" },
  "rep.order.load_failed": { type: "error", title: "Couldn't load this order", description: "Please try again." },
  "rep.history.load_failed": { type: "error", title: "Couldn't load your orders", description: "Please try again." },

  // ── rep: reports ──
  "rep.reports.empty": { type: "info", title: "Nothing to export yet", description: "Place an order first." },

  // ── rep: profile ──
  "rep.profile.saved": { type: "success", title: "Profile updated" },
  "rep.profile.phone_saved": { type: "success", title: "M-Pesa number saved", description: "We'll use {phone} for future payments." },
  "rep.profile.phone_invalid": { type: "error", title: "Invalid M-Pesa number", description: "Use a Safaricom number like 0712 345 678." },
  "rep.profile.password_changed": { type: "success", title: "Password changed", description: "You've been signed out on your other devices." },
  "rep.profile.password_wrong": { type: "error", title: "Current password is wrong", description: "Check it and try again." },
  "rep.profile.failed": { type: "error", title: "Couldn't save your profile", description: "Please try again." },
  "rep.profile.photo_saved": { type: "success", title: "Photo updated" },
  "rep.profile.photo_removed": { type: "success", title: "Photo removed" },
  "rep.profile.photo_invalid": { type: "error", title: "Can't use that image", description: "Choose a JPG, PNG or WebP image under 5 MB." },
  "rep.profile.photo_failed": { type: "error", title: "Couldn't update the photo", description: "Please try again." },

  // ── rep: M-Pesa payment ──
  "rep.pay.prompt_sent": { type: "info", title: "Check your phone", description: "Enter your M-Pesa PIN to pay {amount}." },
  "rep.pay.success": { type: "success", title: "Payment received", description: "{amount} paid. M-Pesa receipt {receipt}." },
  "rep.pay.partial": { type: "warning", title: "Payment received, balance due", description: "{amount} received. {due} is still due." },
  "rep.pay.failed.cancelled": { type: "error", title: "Payment cancelled", description: "You cancelled it on your phone. Retry when you're ready." },
  "rep.pay.failed.insufficient": { type: "error", title: "Not enough M-Pesa balance", description: "Top up your M-Pesa and retry." },
  "rep.pay.failed.wrong_pin": { type: "error", title: "Wrong M-Pesa PIN", description: "Retry and enter your PIN carefully." },
  "rep.pay.failed.timeout": { type: "error", title: "Payment timed out", description: "The prompt expired before it was completed. Retry." },
  "rep.pay.failed.expired": { type: "error", title: "Payment request expired", description: "Retry to get a new prompt." },
  "rep.pay.failed.busy": { type: "error", title: "Another M-Pesa transaction is in progress", description: "Wait a moment and retry." },
  "rep.pay.failed.generic": { type: "error", title: "Payment wasn't completed", description: "{reason}" },
  "rep.pay.retry_wait": { type: "warning", title: "Prompt already sent", description: "Check your phone, or wait a minute before retrying." },
  "rep.pay.phone_required": { type: "error", title: "Enter your M-Pesa number", description: "We need it to send the payment prompt." },
  "rep.pay.phone_invalid": { type: "error", title: "Invalid M-Pesa number", description: "Use a Safaricom number like 0712 345 678." },
  "rep.pay.unreachable": { type: "error", title: "M-Pesa isn't responding", description: "Nothing was charged. Try again in a moment." },
  "rep.pay.nothing_due": { type: "info", title: "Nothing to pay", description: "This order is fully paid." },
  "rep.pay.not_payable": { type: "error", title: "No payment is due", description: "This order is {status}." },
  "rep.pay.deadline_passed": { type: "error", title: "Payment window closed", description: "The ordering deadline has passed. Contact HHES." },

  // ── live updates ──
  "rt.disconnected": { type: "warning", id: "rt", title: "Live updates paused", description: "Reconnecting..." },
  "rt.reconnected": { type: "success", id: "rt", title: "Live updates restored" },

    // ── public site ──
  "site.contact.sent": { type: "success", title: "Message sent", description: "We've emailed a copy to {email}. We'll reply by email." },
  "site.contact.rate_limited": { type: "warning", title: "You've sent a few messages already", description: "Please wait a while before sending another, or call us." },
  "site.contact.failed": { type: "error", title: "Couldn't send your message", description: "Please try again, or contact us by phone." },
} as const satisfies Record<string, Message>;

export type MessageKey = keyof typeof MESSAGES;