import HubTemplate from "@/templates/HubTemplate";
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
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { LinkButton } from "@/components/LinkButton/LinkButton";
import { Icon } from "@/components/Icon/Icon";
import { CardCarousel } from "@/components/CardCarousel/CardCarousel";
import { REVALIDATE } from "@/utils/constants";
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
    sectionHeadCollection,
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
          <h2 className="text-2xl font-semibold">{theme.articleTitle}</h2>
        )}

        {!!theme.article?.json && (
          <div className="mt-4 text-base leading-relaxed whitespace-pre-line">
            {documentToReactComponents(theme.article.json)}
          </div>
        )}
      </div>

      {!!dashboards.length && (
        <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-20 py-10 space-y-12">
          <section className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Painéis Interativos</h2>

              <LinkButton
                href={dashboardsHref}
                variant="secondary"
                className="w-fit"
              >
                <p>Ver Todos</p>
                <Icon className="rotate-270 size-2" id="expand" />
              </LinkButton>
            </div>
            <CardCarousel items={dashboards} variant="post" />
          </section>
        </div>
      )}

      {!!datastories.length && (
        <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-20 py-10 space-y-12">
          <section className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Datastories</h2>

              <LinkButton
                href={datastoriesHref}
                variant="secondary"
                className="w-fit"
              >
                <p>Ver Todos</p>
                <Icon className="rotate-270 size-2" id="expand" />
              </LinkButton>
            </div>
            <CardCarousel items={datastories} variant="post" />
          </section>
        </div>
      )}

      {!!publicacoes.length && (
        <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-20 py-10 space-y-12">
          <section className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Publicações</h2>

              <LinkButton
                href={postsByThemeHref}
                variant="secondary"
                className="w-fit"
              >
                <p>Ver Todos</p>
                <Icon className="rotate-270 size-2" id="expand" />
              </LinkButton>
            </div>
            <CardCarousel items={publicacoes} variant="post" />
          </section>
        </div>
      )}
    </HubTemplate>
  );
}
