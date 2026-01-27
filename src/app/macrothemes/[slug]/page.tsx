import HubTemplate from "@/templates/HubTemplate";
import { REVALIDATE, macroThemes } from "@/utils/constants";
import { MacroThemeBanner } from "@/components/MacroThemeBanner/MacroThemeBanner";
import { IPreviewCards, IPublication, MacroTheme, SectionHeader } from "@/utils/interfaces";
import { notFound } from "next/navigation";
import { getContent } from "@/utils/contentful";
import { MACROTHEME_PAGE_QUERY, MAIN_PAGE_QUERY } from "@/utils/queries";
import PreviewSection from "@/components/PreviewSection/PreviewSection";
import { RecentSection } from "@/components/RecentSection/RecentSection";

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
    sectionHeadCollection 
  }: IMacroThemePageContent = await getContent(MACROTHEME_PAGE_QUERY, { slug: normalizedSlug });

  const { postCollection: posts} : IMacroThemePageContent = await getContent(MAIN_PAGE_QUERY);
  const { sectionHeadCollection: sectionHead } : IMacroThemePageContent = await getContent(MAIN_PAGE_QUERY);

  const theme = themeCollection.items?.[0];
  if (!theme) notFound();

  const logoIconId = macroThemes[theme.id];
  const logoBackgroundColor = theme.color;

  return (
    <HubTemplate>
      <MacroThemeBanner
        content={theme}
        logoIconId={logoIconId}
        logoBackgroundColor={logoBackgroundColor}
      />

      {!!previewCardsCollection?.items?.length && (
        <PreviewSection
          header={{
            id: "preview",
            title: "Indicadores em destaques",
            subtitle: "",
          }}
          cards={previewCardsCollection.items}
        />
      )}

      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-20 py-10">
        <h2 className="text-2xl font-semibold">{theme.textSlogan}</h2>

        {!!theme.textPage && (
          <p className="mt-4 text-base leading-relaxed whitespace-pre-line">
            {theme.textPage}
          </p>
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

      {!!postCollection?.items?.length && (
        <RecentSection
          content={postCollection.items}
          header={{
            ...sectionHeadCollection.items[0],
            subtitle: ""
          }}
        />
      )}

      {!!postCollection?.items?.length && (
        <RecentSection
          content={postCollection.items}
          header={{
            ...sectionHeadCollection.items[0],
            subtitle: ""
          }}
        />
      )}

      
    </HubTemplate>
  );
}
