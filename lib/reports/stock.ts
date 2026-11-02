export type StockStatus = "healthy" | "low" | "critical" | "none";

// The thresholds behind Healthy / Low / Critical (change them here)
export function stockStatus(stock: number, ordered: number): StockStatus {
  if (stock <= 0) return ordered > 0 ? "critical" : "none";
  const remaining = stock - ordered;
  if (remaining <= 0 || remaining / stock <= 0.01) return "critical";
  if (remaining / stock <= 0.2) return "low";
  return "healthy";
}