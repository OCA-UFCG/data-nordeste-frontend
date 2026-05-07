import type { MetadataRoute } from "next";
import { getZenodoCommunityRecords } from "@/lib/zenodo";
import { absoluteUrl } from "@/config/seo";

const DATASET_SITEMAP_SIZE = 100;

const staticRoutes = [
  "/",
  "/about",
  "/connections",
  "/posts",
  "/explore",
  "/catalog",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries = staticRoutes.map((route) => ({
    url: absoluteUrl(route),
    lastModified: new Date(),
    changeFrequency: route === "/" ? "daily" : "weekly",
    priority: route === "/" ? 1 : 0.8,
  })) satisfies MetadataRoute.Sitemap;

  try {
    const { records } = await getZenodoCommunityRecords(
      1,
      DATASET_SITEMAP_SIZE,
    );
    const datasetEntries = records.map((record) => ({
      url: absoluteUrl(`/catalog/${record.id}`),
      lastModified: record.publication_date
        ? new Date(record.publication_date)
        : new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    })) satisfies MetadataRoute.Sitemap;

    return [...staticEntries, ...datasetEntries];
  } catch {
    return staticEntries;
  }
}
