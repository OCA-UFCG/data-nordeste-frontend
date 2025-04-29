import { MacroTheme, SectionHeader } from "@/utils/interfaces";
import { Icon } from "@/components/Icon/Icon";
import { macroThemes } from "@/utils/constants";
import Link from "next/link";

const PanelSection = ({
  header,
  panels,
}: {
  header?: { fields: SectionHeader };
  panels?: { fields: MacroTheme }[];
}) => {
  const { title, subtitle } = header?.fields || {
    title: "",
    subtitle: "",
  };

  const filteredData = panels?.sort((a, b) => {
    if (a.fields.id < b.fields.id) {
      return -1;
    }
    if (a.fields.id > b.fields.id) {
      return 1;
    }

    return 0;
  });

  return (
    <section
      className="w-full max-w-[1440px] px-4 py-6 content-center flex flex-col gap-6 box-border"
      id={title}
    >
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-3xl font-semibold">{title}</h2>
        </div>
        <p className="text-sm">{subtitle}</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredData?.map((panel: { fields: MacroTheme }) => (
          <Link
            href={`/posts?category=${panel.fields.id}`}
            className="flex justify-between items-center rounded-sm shadow-sm p-4 w-full bg-grey-100 hover:bg-grey-200 border border-grey-200 hover:border-grey-300 cursor-pointer transition duration-300"
            key={panel.fields.id}
          >
            <div className="flex flex-col md:flex-row w-full md:w-fit items-center justify-center gap-4">
              <div
                className="flex items-center justify-center rounded-sm min-w-[32px] w-[32px] h-[32px]"
                style={{ backgroundColor: panel.fields.color }}
              >
                <Icon
                  className="text-white"
                  id={macroThemes[panel.fields.id]}
                  size={18}
                />
              </div>
              <span className="text-base text-center md:text-start font-semibold md:max-w-[90%]">
                {panel.fields.name}
              </span>
            </div>
            <Icon className="hidden md:flex rotate-270" id="expand" size={9} />
          </Link>
        ))}
      </div>
    </section>
  );
};

export default PanelSection;
