import { MacroTheme } from "@/utils/interfaces";
import { Icon } from "@/components/Icon/Icon";
import { MACROTHEME_ICON_BY_ID } from "@/features/macrothemes/constants";
import Link from "next/link";

const CategoryCard = ({ category }: { category: MacroTheme }) => {
  if (!category?.id) {
    return null;
  }

  const normalizedId = category.id.replace(/_/g, "-");
  const iconId = MACROTHEME_ICON_BY_ID[category.id] || "list";

  return (
    <Link
      href={`/macrothemes/${normalizedId}`}
      className="flex items-center justify-center md:justify-start w-[160.5px] h-[88px] md:w-[302px] md:h-[68px] px-2 md:px-4 py-2 md:py-3 bg-white border border-[#EFEFEF] rounded-lg shadow-[0px_1px_2px_-1px_rgba(0,0,0,0.1),0px_1px_3px_rgba(0,0,0,0.1)] hover:border-[#D4D4D8] transition-colors duration-300"
    >
      <div className="flex items-center justify-between w-full gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div
            className="flex items-center justify-center w-10 h-10 p-2 rounded"
            style={{ backgroundColor: category.color }}
          >
            <Icon className="text-white" id={iconId} size={24} />
          </div>

          <span className="text-sm md:text-[16px] md:leading-6 font-normal md:font-medium text-[#292829] text-center md:text-left break-words">
            {category.name}
          </span>
        </div>

        <Icon
          className="hidden md:block rotate-270 text-[#292829] shrink-0"
          id="expand"
          size={8}
        />
      </div>
    </Link>
  );
};

export default CategoryCard;
