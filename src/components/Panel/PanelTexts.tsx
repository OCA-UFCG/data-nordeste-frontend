import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { documentToPlainTextString } from "@contentful/rich-text-plain-text-renderer";
import Link from "next/link";
import { Icon } from "@/components/Icon/Icon";
import { CollapsibleText } from "@/components/Panel/CollapsibleText";
import { MACROTHEME_ROUTE_BY_NAME } from "@/features/macrothemes/constants";
import { ReportData } from "@/utils/interfaces";

// Textos do Contentful em volta do painel, usados pela página do Power BI e
// pelas demos nativas, para que as duas mostrem o mesmo antes e depois.

const INTRO_TEXT =
  "w-full max-w-[1280px] text-base leading-[150%] text-[#292829]";

// `collapsible`: no celular, o texto de abertura mostra 3 linhas e "Ler mais".
export const PanelIntro = ({
  panel,
  collapsible = false,
}: {
  panel: ReportData;
  collapsible?: boolean;
}) => {
  const { macroTheme, date, abovePanelDescription } = panel;
  const formattedDate = date ? new Date(date).toLocaleDateString("pt-BR") : "";

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-center w-full py-4 sticky left-0">
        <h2 className="text-left font-semibold text-3xl">{macroTheme}</h2>
        <span className="font-medium text-base mt-2 sm:mt-0">
          Publicado em: {formattedDate}
        </span>
      </div>

      {abovePanelDescription &&
        (collapsible ? (
          <CollapsibleText
            text={abovePanelDescription}
            className={INTRO_TEXT}
          />
        ) : (
          <p className={INTRO_TEXT}>{abovePanelDescription}</p>
        ))}
    </>
  );
};

export const PanelDescriptionSection = ({ panel }: { panel: ReportData }) => {
  if (!panel.descriptionTitle && !panel.description?.json) return null;

  const macroThemeHref = getMacroThemeHref(panel.macroTheme);

  return (
    <section className="w-full bg-[#EFEFEF] py-10">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 sm:px-6 lg:px-20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {panel.descriptionTitle && (
            <h2 className="text-[30px] font-semibold leading-[36px] text-[#292829]">
              {panel.descriptionTitle}
            </h2>
          )}
          {macroThemeHref && <MacroThemeLink href={macroThemeHref} />}
        </div>
        {panel.description?.json && (
          <div className="text-base leading-[150%] text-[#292829] [&>p+p]:mt-4">
            {documentToReactComponents(panel.description.json)}
          </div>
        )}
      </div>
    </section>
  );
};

const MacroThemeLink = ({ href }: { href: string }) => (
  <Link
    className="ml-auto inline-flex h-10 shrink-0 items-center justify-center gap-3 rounded-md bg-white px-5 text-sm font-medium leading-6 text-green-900 transition hover:bg-green-neutro"
    href={href}
  >
    Ver mais sobre o tema
    <Icon className="size-2" id="expand" size={9} />
  </Link>
);

export const CatalogLinkSection = ({ macroTheme }: { macroTheme: string }) => {
  const href = getCatalogHref(macroTheme);

  if (!href) return null;

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-2.5 px-4 py-8 sm:px-6 lg:px-20">
      <Link
        className="inline-flex h-10 w-full items-center justify-center gap-3 rounded-md bg-green-800 px-5 text-sm font-medium leading-6 text-white transition hover:bg-green-900"
        href={href}
      >
        Acessar o catálogo de dados
        <Icon className="size-4" id="database-search" size={16} />
      </Link>
    </div>
  );
};

const macroThemeSlug = (macroTheme: string) =>
  MACROTHEME_ROUTE_BY_NAME[macroTheme as keyof typeof MACROTHEME_ROUTE_BY_NAME];

const getCatalogHref = (macroTheme: string): string | null => {
  const slug = macroThemeSlug(macroTheme);

  return slug ? `/catalog?category=${slug}` : null;
};

const getMacroThemeHref = (macroTheme: string): string | null => {
  const slug = macroThemeSlug(macroTheme);

  return slug ? `/macrothemes/${slug}` : null;
};

export const getPanelDescriptionText = (panel: ReportData): string => {
  if (!panel.description?.json) return "";

  return documentToPlainTextString(panel.description.json);
};
