import HubTemplate from "@/templates/HubTemplate";
import { REVALIDATE, macroThemes } from "@/utils/constants";
import { MacroThemeBanner } from "@/components/MacroThemeBanner/MacroThemeBanner";
import {
  IPreviewCards,
  IPublication,
  MacroTheme,
  SectionHeader,
} from "@/utils/interfaces";
import { notFound } from "next/navigation";
import { getContent } from "@/utils/contentful";
import { MACROTHEME_PAGE_QUERY } from "@/utils/queries";
import { RecentSection } from "@/components/RecentSection/RecentSection";
import PreviewSection from "@/components/PreviewSection/PreviewSection";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import PreviewContent from "@/components/PreviewSection/PreviewContent";

export const revalidate = REVALIDATE;

interface IMacroThemePageContent {
  themeCollection: { items: MacroTheme[] };
  postCollection: { items: IPublication[] };
  sectionHeadCollection: { items: SectionHeader[] };
  previewCardsCollection: { items: IPreviewCards[] };
}

export default async function MacroThemePage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;

  const normalizedSlug = slug.replace(/-/g, "_");

  const {
    themeCollection,
    previewCardsCollection,
    postCollection,
    sectionHeadCollection,
  }: IMacroThemePageContent = await getContent(MACROTHEME_PAGE_QUERY, {
    slug: normalizedSlug,
  });

  const theme = themeCollection.items?.[0];
  if (!theme) notFound();

  return (
    <HubTemplate>
      <MacroThemeBanner
        content={theme}
      />

      {!!previewCardsCollection?.items?.length && (
        <section className="w-full bg-white">
          <div className="w-full max-w-[1440px] mx-auto px-3 lg:px-20">
            <div
              className="flex flex-col gap-3 lg:px-6 py-10 lg:py-16 justify-center items-center"
            >
              <PreviewContent
                cards={previewCardsCollection.items}
                header={sectionHeadCollection.items[0]}
              />
            </div>
          </div>
        </section>
      )}

      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-20 py-10">
        {!!theme.articleTitle && (
          <h2 className="text-2xl font-semibold">{theme.articleTitle}</h2>
        )}

        {!!theme.article?.json && (
          <div className="mt-4 text-base leading-relaxed whitespace-pre-line">
            {documentToReactComponents(theme.article.json)}
          </div>
        )}
      </div>

      {!!postCollection?.items?.length && (
        <RecentSection
          content={postCollection.items}
          header={{
            ...sectionHeadCollection.items[0],
            subtitle: "",
          }}
        />
      )}


    </HubTemplate>
  );
}
