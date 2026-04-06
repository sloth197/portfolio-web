import type { MetadataRoute } from "next";

const DEFAULT_SITE_URL = "https://www.xhbt.dev";

function resolveSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    try {
      return new URL(configured).toString().replace(/\/+$/, "");
    } catch {
      // Fall back to default site URL.
    }
  }
  return DEFAULT_SITE_URL;
}

export default function robots(): MetadataRoute.Robots {
  const siteUrl = resolveSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/crm", "/projects/admin/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
