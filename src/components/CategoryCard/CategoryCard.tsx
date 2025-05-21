import { MacroTheme } from "@/utils/interfaces";
import { Icon } from "@/components/Icon/Icon";
import { macroThemes } from "@/utils/constants";
import Link from "next/link";

const CategoryCard = ({
  category,
}: {
  category: { fields: MacroTheme; sys: { id: string } };
}) => {
  return (
    <Link
      href={`/explore?category=${category.sys.id}`}
      className="flex justify-between items-center rounded-sm shadow-sm p-4 w-full bg-grey-100 hover:bg-grey-200 border border-grey-200 hover:border-grey-300 cursor-pointer transition duration-300"
      key={category.fields.id}
    >
      <div className="flex flex-col md:flex-row w-full md:w-fit items-center justify-center gap-4">
        <div
          className="flex items-center justify-center rounded-sm min-w-[40px] w-[40px] h-[40px]"
          style={{ backgroundColor: category.fields.color }}
        >
          <Icon
            className="text-white"
            id={macroThemes[category.fields.id]}
            size={20}
          />
        </div>
        <span className="text-base text-center md:text-start font-semibold md:max-w-[90%]">
          {category.fields.name}
        </span>
      </div>
      <Icon className="hidden md:flex rotate-270" id="expand" size={9} />
    </Link>
  );
};

export default CategoryCard;
