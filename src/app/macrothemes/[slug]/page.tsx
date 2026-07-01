import HubTemplate from "@/templates/HubTemplate";
import { MacroThemeBanner } from "@/components/MacroThemeBanner/MacroThemeBanner";
import {
  IPageHeader,
  IPreviewCards,
  IPublication,
  MacroTheme,
  SectionHeader,
} from "@/utils/interfaces";
import { notFound } from "next/navigation";
import { getContent } from "@/utils/contentful";
import { MACROTHEME_PAGE_QUERY } from "@/utils/queries";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import PreviewContent from "@/components/PreviewSection/PreviewContent";
import type { Metadata } from "next";
import { buildMetadata } from "@/config/seo";
import { documentToPlainTextString } from "@contentful/rich-text-plain-text-renderer";
import { MacroThemeTabs } from "@/components/MacroThemeTabs/MacroThemeTabs";

interface IMacroThemePageContent {
  themeCollection: { items: MacroTheme[] };
  postCollection: { items: IPublication[] };
  sectionHeadCollection: { items: SectionHeader[] };
  pageHeadersCollection: { items: IPageHeader[] };
  previewCardsCollection: { items: IPreviewCards[] };
}

const SECTION_HEADER_IDS = {
  dashboards: "dataPanels",
  datastories: "dataNarrative",
  publications: "publications",
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const normalizedSlug = slug.replace(/-/g, "_");
  const { themeCollection }: Pick<IMacroThemePageContent, "themeCollection"> =
    await getContent(MACROTHEME_PAGE_QUERY, {
      slug: normalizedSlug,
    });
  const theme = themeCollection.items?.[0];

  if (!theme) {
    return buildMetadata({
      title: "Macrotema",
      path: `/macrothemes/${slug}`,
    });
  }

  return buildMetadata({
    title: theme.name,
    description:
      theme.description?.json &&
      documentToPlainTextString(theme.description.json),
    path: `/macrothemes/${slug}`,
    images: theme.banner?.url ? [theme.banner.url] : ["/banner.png"],
  });
}

export default async function MacroThemePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // LEGACY: public macrotheme URLs use hyphens, while Contentful stores the IDs
  // with underscores. Keep this normalization or shared links will stop loading.
  const normalizedSlug = slug.replace(/-/g, "_");

  const {
    themeCollection,
    previewCardsCollection,
    sectionHeadCollection,
    pageHeadersCollection,
    postCollection,
  }: IMacroThemePageContent = await getContent(MACROTHEME_PAGE_QUERY, {
    slug: normalizedSlug,
  });

  const theme = themeCollection.items?.[0];
  if (!theme) notFound();

  const postsByThemeHref = `/posts?category=${encodeURIComponent(theme.sys.id)}&type_in=newsletter,additional-content&page=1`;
  const dashboardsHref = `/explore?category=${encodeURIComponent(theme.sys.id)}&page=1`;
  const datastoriesHref = `/posts?category=${encodeURIComponent(theme.sys.id)}&type_in=data-story&page=1`;

  const publicacoes = postCollection.items.filter(
    (post) => post.type === "newsletter" || post.type === "additional-content",
  );

  const dashboards = postCollection.items.filter(
    (post) => post.type === "data-panel",
  );

  const datastories = postCollection.items.filter(
    (post) => post.type === "data-story",
  );

  const pageHeadersById = new Map(
    pageHeadersCollection.items
      .filter((item): item is IPageHeader & { id: string } => Boolean(item?.id))
      .map((item) => [item.id, item]),
  );

  const dashboardsHeader = pageHeadersById.get(SECTION_HEADER_IDS.dashboards);
  const datastoriesHeader = pageHeadersById.get(SECTION_HEADER_IDS.datastories);
  const publicationsHeader = pageHeadersById.get(
    SECTION_HEADER_IDS.publications,
  );

  return (
    <HubTemplate>
      <MacroThemeBanner content={theme} />

      {!!previewCardsCollection?.items?.length && (
        <section className="w-full bg-white">
          <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-20">
            <div className="flex flex-col pt-10 lg:pt-16 items-center [&>div:nth-child(2)]:mt-[28px]">
              <PreviewContent
                cards={previewCardsCollection.items}
                header={sectionHeadCollection.items.find(
                  (sec: SectionHeader) => sec.id == "preview",
                )}
              />
            </div>
          </div>
        </section>
      )}

      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-20 mt-12 pb-10 pt-0">
        {!!theme.articleTitle && (
          <h2 className="text-xl lg:text-3xl font-semibold">
            {theme.articleTitle}
          </h2>
        )}

        {!!theme.article?.json && (
          <div className="mt-4 prose prose-lg max-w-none">
            {documentToReactComponents(theme.article.json)}
          </div>
        )}
      </div>

      <section className="w-full bg-[#F8F7F8]">
        <MacroThemeTabs
          dashboards={dashboards}
          datastories={datastories}
          publicacoes={publicacoes}
          headers={{
            dashboards: dashboardsHeader,
            datastories: datastoriesHeader,
            publications: publicationsHeader,
          }}
          urls={{
            dashboardsHref,
            datastoriesHref,
            postsByThemeHref,
          }}
        />
      </section>
    </HubTemplate>
  );
}
