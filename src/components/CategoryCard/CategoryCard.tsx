import { MacroTheme } from "@/utils/interfaces";
import { Icon } from "@/components/Icon/Icon";
import { macroThemes } from "@/utils/constants";
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
      className="flex h-[40px] min-w-[40px] shrink-0 items-center justify-center rounded-sm"
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
  const iconId = macroThemes[category.id] || "list";

  return (
    <Link
      href={`/macrothemes/${normalizedId}`}
      className="flex min-h-[116px] items-center justify-between rounded-sm border border-grey-200 bg-white p-4 shadow-sm transition duration-300 hover:border-grey-300 hover:bg-grey-200 md:min-h-[74px]"
      key={category.id}
    >
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 md:w-fit md:flex-row">
        <CategoryThemeIcon color={category.color} iconId={iconId} />
        <span className="flex min-h-[40px] items-center text-center text-base font-semibold leading-tight md:max-w-[90%] md:text-start">
          {category.name}
        </span>
      </div>
      <Icon className="hidden md:flex rotate-270" id="expand" size={9} />
    </Link>
  );
};

export default CategoryCard;
