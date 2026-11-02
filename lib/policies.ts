import { SITE } from "@/lib/site";

// HHES's decisions about collected books. While a value is `null` the public page says
// problems are reviewed case by case. Set the values and the page updates itself.
export const RETURNS = {
  acceptsReturnsAfterCollection: null as boolean | null, // true = accepted, false = not accepted
  windowDays: null as number | null,                     // e.g. 7 (days after collection)
  condition: null as string | null,                      // e.g. "unopened and in their original condition"
  returnCostBy: null as "hhes" | "organisation" | null,
  lastUpdated: "2026-10-21",                             // change this whenever the policy changes
};

// Shared by the legal pages. Empty values fall back to safe wording.
export const LEGAL = {
  legalName: null as string | null,         // HHES's full registered name
  registeredAddress: null as string | null, // falls back to the pickup address
  privacyEmail: null as string | null,      // falls back to HHES_EMAIL
};

export const PRIVACY = {
  odpcRegistration: null as string | null,  // registration number with Kenya's Data Protection Commissioner
  databaseRegion: null as string | null,    // e.g. "Frankfurt, Germany" (shown in your Supabase project settings)
  retentionYears: null as number | null,    // minimum years order and payment records are kept, e.g. 7
  lastUpdated: "2026-10-21",                // change this whenever the policy changes
};

export const TERMS = {
  lastUpdated: "2026-10-22",              // change this whenever the terms change
  disputeCity: null as string | null,     // e.g. "Nairobi": courts of that city. null = the courts of Kenya
  uncollectedHoldDays: null as number | null, // e.g. 30: how long HHES holds a paid, packed order. null = no promise made
  limitLiability: true,                   // false removes the liability cap (the legal exceptions are kept either way)
};

export const legalName = () => LEGAL.legalName ?? SITE.name;
export const legalAddress = () => LEGAL.registeredAddress ?? SITE.address;
export const privacyEmail = () => LEGAL.privacyEmail ?? SITE.email;