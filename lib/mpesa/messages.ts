const REASONS: Record<number, string> = {
  1: "Your M-Pesa balance was too low to complete the payment.",
  1001: "Another M-Pesa transaction was in progress on your phone. Please try again.",
  1019: "The payment request expired before it was completed.",
  1025: "We couldn't send the payment prompt to your phone. Please try again.",
  1032: "The payment was cancelled on your phone.",
  1037: "The payment prompt timed out before it was completed.",
  2001: "The wrong M-Pesa PIN was entered.",
};

export const friendlyReason = (code: number | undefined, fallback: string | undefined) =>
  (code !== undefined && REASONS[code]) || fallback || "The payment was not completed.";