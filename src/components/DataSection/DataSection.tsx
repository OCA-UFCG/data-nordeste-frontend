import { MacroTheme, SectionHeader } from "@/utils/interfaces";
import { Icon } from "@/components/Icon/Icon";
import { LinkButton } from "@/components/LinkButton/LinkButton";
import CategoryCard from "../CategoryCard/CategoryCard";
import { THEMES_NAVIGATION_ORDER } from "@/utils/constants";

const DataSection = ({
  header,
  categories,
}: {
  header?: SectionHeader;
  categories?: MacroTheme[];
}) => {
  const { title, subtitle } = header || {
    title: "",
    subtitle: "",
  };

  const validCategories = (categories || []).filter(
    (category): category is MacroTheme => Boolean(category?.id),
  );

  const filteredData = validCategories.sort((a, b) => {
    const indexA = THEMES_NAVIGATION_ORDER.indexOf(a.id);
    const indexB = THEMES_NAVIGATION_ORDER.indexOf(b.id);

    const posA = indexA === -1 ? 99 : indexA;
    const posB = indexB === -1 ? 99 : indexB;

    return posA - posB;
  });

  return (
    <section className="bg-grey-100 w-full py-12" id={title}>
      <div className="max-w-[1440px] mx-auto my-0 flex flex-col gap-6 px-4 lg:px-20">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between w-full">
            <h2 className="text-3xl font-semibold">{title}</h2>
            <LinkButton
              href="/explore"
              variant="secondary"
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-white border border-[#EFEFEF] rounded-md text-[#077432] hover:bg-grey-100"
            >
              <span className="text-sm font-medium">Ver todos</span>
              <Icon className="size-2" id="expand" />
            </LinkButton>
          </div>
          <p className="text-sm text-grey-600">{subtitle}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {filteredData.map((category: MacroTheme) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>

        <LinkButton
          href="/explore?page=1"
          variant="secondary"
          className="md:hidden items-center gap-2 px-4 py-2 bg-white border border-[#EFEFEF] rounded-md text-[#077432]"
        >
          <span className="text-sm font-medium">Ver todos</span>
          <Icon className="size-2" id="expand" />
        </LinkButton>
      </div>
    </section>
  );
};

export default DataSection;
