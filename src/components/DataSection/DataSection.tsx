import { MacroTheme, SectionHeader } from "@/utils/interfaces";
import { Icon } from "@/components/Icon/Icon";
import { LinkButton } from "@/components/LinkButton/LinkButton";
import CategoryCard from "../CategoryCard/CategoryCard";

const DataSection = ({
  header,
  categories,
}: {
  header?: { fields: SectionHeader };
  categories?: { fields: MacroTheme }[];
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
    <section
      className="w-full max-w-[1440px] px-4 py-6 content-center flex flex-col gap-6 box-border"
      id={title}
    >
      <div className="flex flex-col gap-3">
        <div className="flex justify-between w-full">
          <h2 className="text-3xl font-semibold">{title}</h2>
          <LinkButton
            href="/posts"
            variant="secondary"
            className="w-fit hidden md:flex hover:underline"
          >
            <p>ver todos</p>
            <Icon className="rotate-270 size-2" id="expand" />
          </LinkButton>
        </div>
        <p className="text-sm">{subtitle}</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredData?.map((category: { fields: MacroTheme }) => (
          <CategoryCard key={category.fields.id} category={category} />
        ))}
      </div>
      <LinkButton
        href="/posts"
        variant="secondary"
        className="md:hidden hover:underline"
      >
        <p>ver todos</p>
        <Icon className="rotate-270 size-2" id="expand" />
      </LinkButton>
    </section>
  );
};

export default DataSection;
