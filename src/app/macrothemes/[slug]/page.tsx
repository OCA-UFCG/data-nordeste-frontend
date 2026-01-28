import HubTemplate from "@/templates/HubTemplate";
import { REVALIDATE, macroThemes } from "@/utils/constants";
import { MacroThemeBanner } from "@/components/MacroThemeBanner/MacroThemeBanner";
import { MacroTheme } from "@/utils/interfaces";
import { notFound } from "next/navigation";
import { getContent } from "@/utils/contentful";
import { MACROTHEME_PAGE_QUERY } from "@/utils/queries";

export const revalidate = REVALIDATE;

interface IMacroThemePageContent {
  themeCollection: { items: MacroTheme[] };
}

export default async function MacroThemePage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;

  const normalizedSlug = slug.replace(/-/g, "_");

  const { themeCollection }: IMacroThemePageContent = await getContent(
    MACROTHEME_PAGE_QUERY,
    { slug: normalizedSlug },
  );

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

      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-20 py-10">
        <h2 className="text-2xl font-semibold">{theme.textSlogan}</h2>

        {!!theme.textPage && (
          <p className="mt-4 text-base leading-relaxed whitespace-pre-line">
            {theme.textPage}
          </p>
        )}
      </div>
    </HubTemplate>
  );
}
