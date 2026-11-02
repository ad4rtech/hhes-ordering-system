export function normalizeKenyanPhone(input: string): string | null {
  const d = input.replace(/[\s\-()]/g, "").replace(/^\+/, "");
  let n: string;
  if (/^0[17]\d{8}$/.test(d)) n = "254" + d.slice(1);
  else if (/^254[17]\d{8}$/.test(d)) n = d;
  else if (/^[17]\d{8}$/.test(d)) n = "254" + d;
  else return null;
  return n;
}