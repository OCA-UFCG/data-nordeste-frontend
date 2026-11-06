import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/seo";
import { buildRobotsRules } from "@/features/seo/robotsRules";

export default function robots(): MetadataRoute.Robots {
  return buildRobotsRules(process.env.NEXT_PUBLIC_APP_ENV, siteUrl);
}
