import { Icon } from "@/components/Icon/Icon";
import { channels } from "@/utils/constants";
import { sortContentByDesiredOrder } from "@/utils/functions";
import { ISection } from "@/utils/interfaces";

type FooterProps = {
  content: ISection[];
};

type FooterVariant = "institutional" | "legacy";

const ACTIVE_FOOTER_VARIANT: FooterVariant = "institutional";

const FOOTER_SIGNATURE_ALT =
  "Sudene, Ministério da Integração e do Desenvolvimento Regional, Governo do Brasil. Do lado do povo brasileiro.";

function getLegacyMainPages(content: ISection[]): ISection[] {
  return sortContentByDesiredOrder<ISection>(content, [
    "home",
    "about",
    "explore",
    "posts",
    "projects",
  ]).filter((item) => item.appears);
}

function getLegacyMacroThemes(content: ISection[]): ISection[] {
  return content
    .filter((item) => !item.appears && item.path?.startsWith("/macrothemes/"))
    .sort((left, right) => left.name.localeCompare(right.name));
}

function splitFooterColumns<T>(items: T[], itemsPerColumn: number): T[][] {
  const columns: T[][] = [];

  for (let index = 0; index < items.length; index += itemsPerColumn) {
    columns.push(items.slice(index, index + itemsPerColumn));
  }

  return columns;
}

function LegacyMainLinks({ content }: FooterProps) {
  const mainPages = getLegacyMainPages(content);
  const macroThemes = getLegacyMacroThemes(content);

  return (
    <div className="hidden w-full gap-12 px-4 lg:flex lg:w-auto">
      <LegacyPageLinks pages={mainPages} />
      <LegacyMacroThemeLinks macroThemes={macroThemes} />
    </div>
  );
}

function LegacyPageLinks({ pages }: { pages: ISection[] }) {
  return (
    <div className="flex flex-col items-center gap-3 lg:items-start">
      {pages.map(({ id, path, name }) => (
        <a
          className="text-md font-bold text-white transition-opacity hover:opacity-60"
          href={path}
          key={id}
        >
          {name}
        </a>
      ))}
    </div>
  );
}

function LegacyMacroThemeLinks({ macroThemes }: { macroThemes: ISection[] }) {
  return (
    <div className="flex gap-3">
      {splitFooterColumns(macroThemes, 6).map((columnItems, columnIndex) => (
        <LegacyMacroThemeColumn
          columnIndex={columnIndex}
          items={columnItems}
          key={`column-${columnIndex}`}
        />
      ))}
    </div>
  );
}

function LegacyMacroThemeColumn({
  columnIndex,
  items,
}: {
  columnIndex: number;
  items: ISection[];
}) {
  return (
    <div className="flex flex-col gap-3 lg:items-start">
      {items.map(({ id, path, name }) => (
        <a
          className="text-md text-white transition-opacity hover:opacity-60"
          href={path}
          key={`${columnIndex}-${id}`}
        >
          {name}
        </a>
      ))}
    </div>
  );
}

function LegacyContactLinks() {
  return (
    <div className="flex flex-col gap-4 lg:items-start">
      <p className="hidden text-2xl font-semibold text-white lg:flex">
        Redes sociais e contatos
      </p>
      <LegacyChannelLinks />
      <p className="text-center text-sm font-medium text-white">
        datanordeste@sudene.gov.br
      </p>
    </div>
  );
}

function LegacyChannelLinks() {
  return (
    <div className="flex flex-wrap justify-center gap-4 lg:justify-end">
      {channels.map(({ href, icon, size }) => (
        <a href={href} key={href} target="_blank">
          <Icon className="text-grey-900" id={icon} size={size} />
        </a>
      ))}
    </div>
  );
}

function LegacyInstitutionalLogos() {
  return (
    <div className="mx-auto flex max-w-2xl flex-wrap justify-center gap-4 px-4 lg:justify-start lg:px-0">
      <Icon
        className="h-[60px] w-[128px] sm:h-[94px] sm:w-[198px]"
        height={94}
        id="logo-gov"
        width={198}
      />
      <Icon
        className="h-[60px] w-[128px] sm:h-[94px] sm:w-[198px]"
        height={94}
        id="logo-sudene"
        width={198}
      />
    </div>
  );
}

function LegacyBrandLogo() {
  return (
    <div className="flex w-full justify-center lg:w-auto">
      <Icon
        className="filter brightness-0 invert"
        height={94}
        id="logo-DNE"
        width={198}
      />
    </div>
  );
}

/**
 * Renders the original navigational footer while the institutional footer is validated.
 *
 * @example
 * <LegacyFooter content={headerItems} />
 */
function LegacyFooter({ content }: FooterProps) {
  return (
    <footer className="w-full bg-grey-1100">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col items-top justify-around gap-4 px-20 py-16 lg:flex-row">
        <LegacyBrandLogo />
        <LegacyMainLinks content={content} />
        <div className="flex w-full flex-col justify-between gap-4 lg:w-auto lg:items-start">
          <LegacyContactLinks />
          <LegacyInstitutionalLogos />
        </div>
      </div>
    </footer>
  );
}

/**
 * Renders the institutional footer extracted from the local novofooter.pdf.
 *
 * @example
 * <InstitutionalFooter />
 */
function InstitutionalFooter() {
  return (
    <footer className="w-full bg-black">
      <img
        alt={FOOTER_SIGNATURE_ALT}
        className="mx-auto block h-auto w-full max-w-[1440px]"
        src="/footer-signature.svg"
      />
    </footer>
  );
}

/**
 * Renders the currently selected footer variant.
 *
 * @example
 * <Footer content={headerItems} />
 */
function Footer({ content }: FooterProps) {
  // INTENTIONAL: Switch to "legacy" above if the institutional signature changes again.
  if (ACTIVE_FOOTER_VARIANT === "legacy") {
    return <LegacyFooter content={content} />;
  }

  return <InstitutionalFooter />;
}

export default Footer;
