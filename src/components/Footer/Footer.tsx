import { Icon } from "@/components/Icon/Icon";
import { channels } from "@/utils/constants";
import { sortContentByDesiredOrder } from "@/utils/functions";
import { ISection } from "@/utils/interfaces";

const Footer = ({ content }: { content: { fields: ISection }[] }) => {
  const mainPages = sortContentByDesiredOrder(content, [
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
    <footer className="flex flex-col md:flex-row justify-around items-top px-8 py-16 gap-4 w-full mx-auto bg-grey-1100">
      <div className="flex justify-center w-full md:w-auto">
        <Icon
          id="logo-DNE"
          width={198}
          height={94}
          className="filter brightness-0 invert"
        />
      </div>

      <div className="hidden md:flex gap-10 w-full md:w-auto px-4">
        <div className="flex flex-col items-center md:items-start gap-4">
          {mainPages.map(({ id, path, name }) => (
            <a
              href={path}
              key={id}
              className="text-white font-bold text-lg hover:opacity-60 transition-opacity"
            >
              {name}
            </a>
          ))}
        </div>
        <div className="flex gap-5">
          {splitColumns(macroThemes, 6).map((columnItems, columnIndex) => (
            <div
              key={`column-${columnIndex}`}
              className="flex flex-col md:items-start gap-4"
            >
              {columnItems.map(({ id, path, name }) => (
                <a
                  href={path}
                  key={id}
                  className="text-white text-lg hover:opacity-60 transition-opacity"
                >
                  {name}
                </a>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col justify-between md:items-start w-full md:w-auto gap-4">
        <div className="flex flex-col md:items-start gap-4">
          <p className="hidden md:flex text-white font-semibold text-2xl">
            Redes sociais e contatos
          </p>
          <div className="flex flex-wrap justify-center md:justify-end gap-4">
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
        <div className="flex flex-wrap gap-4 justify-center md:justify-start px-4 md:px-0 max-w-2xl mx-auto">
          <Icon id="logo-gov" width={198} height={94} />
          <Icon id="logo-sudene" width={198} height={94} />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
