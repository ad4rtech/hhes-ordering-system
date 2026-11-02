import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
import { PRIVACY, RETURNS, TERMS } from "@/lib/policies";

type Freq = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
const day = (s: string) => new Date(`${s}T00:00:00+03:00`);

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: [string, number, Freq, Date?][] = [
    ["/", 1, "monthly"],
    ["/register", 0.9, "yearly"],
    ["/ordering-guide", 0.8, "monthly"],
    ["/faqs", 0.8, "monthly"],
    ["/help", 0.6, "monthly"],
    ["/contact", 0.6, "yearly"],
    ["/return-policy", 0.4, "yearly", day(RETURNS.lastUpdated)],
    ["/privacy", 0.4, "yearly", day(PRIVACY.lastUpdated)],
    ["/terms", 0.4, "yearly", day(TERMS.lastUpdated)],
  ];
  return pages.map(([path, priority, changeFrequency, lastModified]) => ({
    url: absoluteUrl(path), priority, changeFrequency, ...(lastModified ? { lastModified } : {}),
  }));
}