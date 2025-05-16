import { Icon } from "@/components/Icon/Icon";
import { channels } from "@/utils/constants";
import { sortContentByDesiredOrder } from "@/utils/functions";
import { ISection } from "@/utils/interfaces";

const Footer = ({ content }: { content: { fields: ISection }[] }) => {
  const mainPages = sortContentByDesiredOrder<ISection>(content, [
    "home",
    "about",
    "explore",
    "posts",
    "projects",
  ])
    .filter((item) => item.fields.appears)
    .map(({ fields: { name, id, path, children } }) => ({
      name,
      id,
      path,
      children,
    }));

  const macroThemes = content
    .filter((item) => !item.fields.appears)
    .sort((a, b) => a.fields.name.localeCompare(b.fields.name))
    .map(({ fields: { name, id, path } }) => ({ name, id, path }));

  const splitColumns = <T,>(array: T[], itemsPerColumn: number) => {
    const columns = [];
    for (let i = 0; i < array.length; i += itemsPerColumn) {
      columns.push(array.slice(i, i + itemsPerColumn));
    }

    return columns;
  };

  return (
    <footer className="flex flex-col lg:flex-row justify-around items-top px-8 py-16 gap-4 w-full mx-auto bg-grey-1100">
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
                <Icon id={icon} size={size} key={index} />
              </a>
            ))}
          </div>
          <p className="text-white font-medium text-sm text-center">
            datanordeste@sudene.gov.br
          </p>
        </div>
        <div className="flex flex-wrap gap-4 justify-center lg:justify-start px-4 lg:px-0 max-w-2xl mx-auto">
          <Icon
            id="logo-gov"
            width={198}
            height={94}
            className="w-[128px] h-[60px] sm:w-[198px] sm:h-[94px]"
          />
          <Icon
            id="logo-sudene"
            width={198}
            height={94}
            className="w-[128px] h-[60px] sm:w-[198px] sm:h-[94px]"
          />{" "}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
