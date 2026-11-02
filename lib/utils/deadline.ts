export const endOfDayEAT = (d: string) => new Date(`${d}T23:59:59+03:00`);

export function effectiveDeadline(quarterDeadline: string, overrideDeadline?: string | null) {
  const d = overrideDeadline && overrideDeadline > quarterDeadline ? overrideDeadline : quarterDeadline;
  return endOfDayEAT(d);
}

export const isPastDeadline = (quarterDeadline: string, overrideDeadline?: string | null) =>
  new Date() > effectiveDeadline(quarterDeadline, overrideDeadline);

export const addDays = (d: string, n: number) =>
  new Date(Date.parse(`${d}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);