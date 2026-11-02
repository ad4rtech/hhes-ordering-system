import type { Metadata } from "next";

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}
export const absoluteUrl = (path = "/") => `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;

// One place for a page's title, description and canonical address
export function pageMeta(o: { title: string; description: string; path: string; absoluteTitle?: boolean; index?: boolean }): Metadata {
  return {
    title: o.absoluteTitle ? { absolute: o.title } : o.title,
    description: o.description,
    alternates: { canonical: o.path },
    ...(o.index === undefined ? {} : { robots: { index: o.index, follow: o.index } }),
  };
}