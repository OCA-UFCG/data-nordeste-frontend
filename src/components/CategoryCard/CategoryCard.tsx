import { MacroTheme } from "@/utils/interfaces";
import { Icon } from "@/components/Icon/Icon";
import { MACROTHEME_ICON_BY_ID } from "@/features/macrothemes/constants";
import Link from "next/link";

type CategoryIconVisual = {
  className: string;
  height: number;
  width: number;
};

const DEFAULT_CATEGORY_ICON_VISUAL: CategoryIconVisual = {
  className: "text-white",
  height: 20,
  width: 20,
};

const CATEGORY_ICON_VISUAL_BY_ID: { [key: string]: CategoryIconVisual } = {
  drop: { className: "text-white", height: 22, width: 18 },
  instruments: { className: "text-white", height: 18, width: 18 },
};

const getCategoryIconVisual = (iconId: string): CategoryIconVisual =>
  CATEGORY_ICON_VISUAL_BY_ID[iconId] ?? DEFAULT_CATEGORY_ICON_VISUAL;

const CategoryThemeIcon = ({
  color,
  iconId,
}: {
  color: string;
  iconId: string;
}) => {
  const iconVisual = getCategoryIconVisual(iconId);

  return (
    <div
      className="flex h-[40px] min-w-[40px] shrink-0 items-center justify-center rounded-[4px]"
      style={{ backgroundColor: color }}
    >
      <Icon
        className={iconVisual.className}
        height={iconVisual.height}
        id={iconId}
        width={iconVisual.width}
      />
    </div>
  );
};

const CategoryCard = ({ category }: { category: MacroTheme }) => {
  if (!category?.id) {
    return null;
  }

  const normalizedId = category.id.replace(/_/g, "-");
  const iconId = MACROTHEME_ICON_BY_ID[category.id] || "list";

  return (
    <Link
      href={`/macrothemes/${normalizedId}`}
      className="
        flex min-h-[80px] w-full min-w-0 flex-col items-center justify-center gap-2 rounded-lg border border-[#E4E4E7] bg-white px-3 py-3 text-center transition-colors hover:bg-[#F8F8F8]
        md:h-[68px]
        md:min-h-0
        md:flex-row
        md:items-center
        md:justify-between
        md:rounded-[8px]
        md:border-[#EFEFEF]
        md:px-4
        md:py-3
        md:text-left
        md:shadow-[0px_1px_2px_-1px_rgba(0,0,0,0.1),0px_1px_3px_rgba(0,0,0,0.1)]
      "
    >
      <div className="flex w-full min-w-0 flex-col items-center gap-2 md:flex-row md:items-center md:gap-4">
        <CategoryThemeIcon color={category.color} iconId={iconId} />

        <span className="w-full text-center text-sm font-normal leading-5 text-[#292829] md:w-auto md:text-left md:text-[18px] md:font-semibold md:leading-7">
          {category.name}
        </span>
      </div>

      <Icon
        className="hidden shrink-0 rotate-270 text-[#292829] md:block"
        id="expand"
        width={8}
        height={8}
      />
    </Link>
  );
};

export default CategoryCard;
