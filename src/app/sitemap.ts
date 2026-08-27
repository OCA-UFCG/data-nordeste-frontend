import type { MetadataRoute } from "next";
import { getZenodoCommunityRecords } from "@/lib/zenodo";
import { absoluteUrl } from "@/config/seo";
import { getSearchIndex } from "@/features/search/contentful";
import type { SearchIndexItem } from "@/features/search/types";

const DATASET_SITEMAP_SIZE = 100;

const staticRoutes = [
  "/",
  "/about",
  "/connections",
  "/posts",
  "/explore",
  "/catalog",
];

// Routes covered directly by these sources; "post" items are only
// included when they resolve to one of these same routes (a newsletter,
// or an ArcGIS embed link) so we never sitemap an external URL.
const DIRECT_CONTENT_SOURCES = new Set<SearchIndexItem["source"]>([
  "panels",
  "dataStories",
  "theme",
]);

const isSitemapableItem = (item: SearchIndexItem) => {
  if (!item.href.startsWith("/")) return false;
  if (DIRECT_CONTENT_SOURCES.has(item.source)) return true;

  return (
    item.source === "post" &&
    (item.type === "newsletter" ||
      item.href.startsWith("/data-stories/") ||
      item.href.startsWith("/experience/"))
  );
};

const buildContentEntries = async (): Promise<MetadataRoute.Sitemap> => {
  const { items } = await getSearchIndex();
  const seen = new Set<string>();

  return items
    .filter(isSitemapableItem)
    .reduce<MetadataRoute.Sitemap>((entries, item) => {
      if (seen.has(item.href)) return entries;
      seen.add(item.href);

      entries.push({
        url: absoluteUrl(item.href),
        lastModified: item.date ? new Date(item.date) : new Date(),
        changeFrequency: "weekly",
        priority: 0.6,
      });

      return entries;
    }, []);
};

const buildDatasetEntries = async (): Promise<MetadataRoute.Sitemap> => {
  const { records } = await getZenodoCommunityRecords(1, DATASET_SITEMAP_SIZE);

  return records.map((record) => ({
    url: absoluteUrl(`/catalog/${record.id}`),
    lastModified: record.publication_date
      ? new Date(record.publication_date)
      : new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  })) satisfies MetadataRoute.Sitemap;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries = staticRoutes.map((route) => ({
    url: absoluteUrl(route),
    lastModified: new Date(),
    changeFrequency: route === "/" ? "daily" : "weekly",
    priority: route === "/" ? 1 : 0.8,
  })) satisfies MetadataRoute.Sitemap;

  // Each source fails independently so a Zenodo or Contentful outage
  // degrades the sitemap instead of breaking it entirely.
  const [datasetEntries, contentEntries] = await Promise.all([
    buildDatasetEntries().catch(() => [] as MetadataRoute.Sitemap),
    buildContentEntries().catch(() => [] as MetadataRoute.Sitemap),
  ]);

  return [...staticEntries, ...datasetEntries, ...contentEntries];
}
