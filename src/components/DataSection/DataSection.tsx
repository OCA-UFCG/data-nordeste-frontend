import { MacroTheme, SectionHeader } from "@/utils/interfaces";
import { Icon } from "@/components/Icon/Icon";
import { LinkButton } from "@/components/LinkButton/LinkButton";
import CategoryCard from "../CategoryCard/CategoryCard";

const DataSection = ({
  header,
  categories,
}: {
  header?: { fields: SectionHeader };
  categories?: { fields: MacroTheme; sys: { id: string } }[];
}) => {
  const { title, subtitle } = header?.fields || {
    title: "",
    subtitle: "",
  };

  const filteredData = categories?.sort((a, b) => {
    if (a.fields.id < b.fields.id) {
      return -1;
    }
    if (a.fields.id > b.fields.id) {
      return 1;
    }

    return 0;
  });

  return (
    <section className="bg-grey-100 w-full" id={title}>
      <div className="max-w-[1440px] px-4 py-10 mx-auto my-0 lg:my-8 content-center flex flex-col gap-6 box-border">
        <div className="flex flex-col gap-3">
          <div className="flex justify-between w-full">
            <h2 className="text-3xl font-semibold">{title}</h2>
            <LinkButton
              href="/explore"
              variant="secondary"
              className="w-fit bg-grey-100 border-grey-300 hidden md:flex"
            >
              <p>Ver Todos</p>
              <Icon className="rotate-270 size-2" id="expand" />
            </LinkButton>
          </div>
          <p className="text-sm">{subtitle}</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredData?.map(
            (category: { fields: MacroTheme; sys: { id: string } }) => (
              <CategoryCard key={category.fields.id} category={category} />
            ),
          )}
        </div>
        <LinkButton
          href="/explore?page=1"
          variant="secondary"
          className="md:hidden bg-grey-100 border-grey-300"
        >
          <p>Ver Todos</p>
          <Icon className="rotate-270 size-2" id="expand" />
        </LinkButton>
      </div>
    </section>
  );
};

export default DataSection;
