import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/seo";

const IS_BETA = process.env.NEXT_PUBLIC_APP_ENV === "beta";

export default function robots(): MetadataRoute.Robots {
  if (IS_BETA) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
      sitemap: `${siteUrl}/sitemap.xml`,
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/health"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
