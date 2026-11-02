export const SITE = {
  name: "Home Health Education Service Kenya",
  short: "HHES Kenya",
  address: process.env.HHES_ADDRESS ?? "HHES Centre, Nairobi, Kenya",
  phone: process.env.HHES_PHONE ?? "",
  hours: process.env.HHES_OFFICE_HOURS ?? "",
  email: process.env.HHES_EMAIL ?? "",
  whatsapp: process.env.HHES_WHATSAPP ?? "",
};

export const telHref = (p: string) => `tel:${p.replace(/[^\d+]/g, "")}`;
export const waHref = (p: string) => `https://wa.me/${p.replace(/\D/g, "")}`;
export const mapsHref = (a: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a)}`;