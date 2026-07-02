import { Icon } from "@/components/Icon/Icon";
import { channels, THEMES_NAVIGATION_ORDER } from "@/utils/constants";
import { sortContentByDesiredOrder } from "@/utils/functions";
import { ISection } from "@/utils/interfaces";

const FOOTER_LINK_IDS = ["home", "explore", "catalog", "connections", "about"];
const FOOTER_LINK_ID_SET = new Set(FOOTER_LINK_IDS);

const Footer = ({ content }: { content: ISection[] }) => {
  const mainPages = sortContentByDesiredOrder<ISection>(
    content.filter((item) => item.appears && FOOTER_LINK_ID_SET.has(item.id)),
    FOOTER_LINK_IDS,
  );

  const macroThemes = sortContentByDesiredOrder(
    content.filter(
      (item) => !item.appears && item.path?.startsWith("/macrothemes/"),
    ),
    THEMES_NAVIGATION_ORDER,
  );

  const splitColumns = <T,>(array: T[], itemsPerColumn: number) => {
    const columns = [];
    for (let i = 0; i < array.length; i += itemsPerColumn) {
      columns.push(array.slice(i, i + itemsPerColumn));
    }

    return columns;
  };

  return (
    <footer className="w-full bg-grey-1100">
      <div className="flex flex-col lg:flex-row justify-around items-top max-w-[1440px] px-20 py-16 gap-4 w-full mx-auto">
        <div className="flex justify-center w-full lg:w-auto">
          <Icon
            id="logo-DNE"
            width={198}
            height={94}
            className="filter brightness-0 invert"
          />
        </div>

        <div className="hidden lg:flex gap-12 w-full lg:w-auto px-4">
          <div className="flex flex-col items-center lg:items-start gap-3">
            {mainPages.map(({ id, path, name }) => (
              <a
                href={path}
                key={id}
                className="text-white font-bold text-md hover:opacity-60 transition-opacity"
              >
                {name}
              </a>
            ))}
          </div>
          <div className="flex gap-3">
            {splitColumns(macroThemes, 6).map((columnItems, columnIndex) => (
              <div
                key={`column-${columnIndex}`}
                className="flex flex-col lg:items-start gap-3"
              >
                {columnItems.map(({ id, path, name }) => (
                  <a
                    href={path}
                    key={id}
                    className="text-white text-md hover:opacity-60 transition-opacity"
                  >
                    {name}
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-between lg:items-start w-full lg:w-auto gap-4">
          <div className="flex flex-col lg:items-start gap-4">
            <p className="hidden lg:flex text-white font-semibold text-2xl">
              Redes sociais e contatos
            </p>
            <div className="flex flex-wrap justify-center lg:justify-end gap-4">
              {channels.map(({ href, icon, size }, index) => (
                <a target="_blank" href={href} key={index}>
                  <Icon
                    id={icon}
                    size={size}
                    key={index}
                    className="text-grey-900"
                  />
                </a>
              ))}
            </div>
            <p className="text-white font-medium text-sm text-center">
              datanordeste@sudene.gov.br
            </p>
          </div>
          <div className="flex flex-wrap gap-4 justify-center lg:justify-start px-4 lg:px-0 max-w-2xl mx-auto">
            <Icon
              id="logo-sudene"
              width={139}
              height={51}
              className="w-[139px] h-[51px]"
            />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
