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
import PreviewCarousel from "@/components/PreviewCarousel/PreviewCarousel";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { PostCarousel } from "@/components/PostCarousel/PostCarousel";

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
  }: IMacroThemePageContent = await getContent(MACROTHEME_PAGE_QUERY, {
    slug: normalizedSlug,
  });

  // const { postCollection: posts }: IMacroThemePageContent =
  //   await getContent(MAIN_PAGE_QUERY);
  // const { sectionHeadCollection: sectionHead }: IMacroThemePageContent =
  //   await getContent(MAIN_PAGE_QUERY);

  const theme = themeCollection.items?.[0];
  if (!theme) notFound();

  const logoIconId = macroThemes[theme.id];
  const logoBackgroundColor = theme.color;

  const publicacoes = postCollection.items.filter(
    (post) => post.type === "newsletter" || "additional-content",
  );

  return (
    <HubTemplate>
      <MacroThemeBanner
        content={theme}
        logoIconId={logoIconId}
        logoBackgroundColor={logoBackgroundColor}
      />

      {/* testando ainda */}

      {!!previewCardsCollection?.items?.length && (
        <PreviewCarousel
          cards={previewCardsCollection.items.map((regionData) => {
            const source = regionData.jsonFile;

            return {
              title: source.title,
              subtitle: source.subtitle,
              data: source.data,
              link: source.link,
              note: source.note,
              category: regionData.category,
            };
          })}
        />
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

      {/* {!!postCollection?.items?.length && (
        <RecentSection
          content={postCollection.items}
          header={{
            ...sectionHeadCollection.items[0],
            subtitle: "",
          }}
        />
      )}

      {!!postCollection?.items?.length && (
        <RecentSection
          content={postCollection.items}
          header={{
            ...sectionHeadCollection.items[0],
            subtitle: "",
          }}
        />
      )}

      {!!postCollection?.items?.length && (
        <RecentSection
          content={postCollection.items}
          header={{
            ...sectionHeadCollection.items[0],
            subtitle: "",
          }}
        />
      )} */}

      {!!publicacoes.length && (
        <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-20 py-10 space-y-12">
          <section className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Publicações</h2>
            </div>

            <PostCarousel posts={publicacoes} />
          </section>
        </div>
      )}
    </HubTemplate>
  );
}
