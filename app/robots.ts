import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  // Test deployments on Vercel (anything that isn't production) must never be indexed
  const preview = process.env.VERCEL_ENV !== undefined && process.env.VERCEL_ENV !== "production";
  if (preview) return { rules: [{ userAgent: "*", disallow: "/" }] };

  return {
    rules: [{
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/rep/", "/api/", "/auth/", "/login", "/forgot-password", "/reset-password", "/set-password", "/register/complete"],
    }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}