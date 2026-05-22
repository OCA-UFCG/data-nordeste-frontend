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
import PreviewContent from "@/components/PreviewSection/PreviewContent";
import { InfoTooltip } from "@/components/InfoTooltip/InfoTooltip";
import type { Metadata } from "next";
import { buildMetadata } from "@/config/seo";
import { documentToPlainTextString } from "@contentful/rich-text-plain-text-renderer";

interface IMacroThemePageContent {
  themeCollection: { items: MacroTheme[] };
  postCollection: { items: IPublication[] };
  sectionHeadCollection: { items: SectionHeader[] };
  previewCardsCollection: { items: IPreviewCards[] };
}

const SECTION_INFO = {
  dashboards: {
    label: "Saiba mais sobre painéis de dados",
    title: "Saiba mais",
    description:
      "Um painel permite a interatividade e exploração dos dados de maneira dinâmica.",
    href: "/explore",
    ctaLabel: "Explore aqui o Panorama da Educação Regional",
  },
  datastories: {
    label: "Saiba mais sobre narrativas de dados",
    title: "Saiba mais",
    description:
      "Narrativas de dados apresentam análises guiadas, conectando indicadores, contexto e interpretação em um formato editorial.",
    href: "/posts?type_in=data-story&page=1",
    ctaLabel: "Explore aqui as narrativas de dados",
  },
  publications: {
    label: "Saiba mais sobre publicações",
    title: "Saiba mais",
    description:
      "Publicações reúnem boletins, notas técnicas e outros conteúdos para consulta e aprofundamento sobre os temas do portal.",
    href: "/posts?page=1",
    ctaLabel: "Explore aqui as publicações",
  },
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
          <div className="mt-4 prose prose-lg max-w-none">
            {documentToReactComponents(theme.article.json)}
          </div>
        )}
      </div>

      {!!dashboards.length && (
        <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-20 py-10 space-y-12">
          <section className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-semibold">Painel de Dados</h2>
                <InfoTooltip {...SECTION_INFO.dashboards} />
              </div>

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
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-semibold">Narrativa de Dados</h2>
                <InfoTooltip {...SECTION_INFO.datastories} />
              </div>

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
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-semibold">Publicações</h2>
                <InfoTooltip {...SECTION_INFO.publications} />
              </div>

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
