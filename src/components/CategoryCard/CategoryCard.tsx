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
  const iconId = MACROTHEME_ICON_BY_ID[category.id] || "list";

  return (
    <Link
      href={`/macrothemes/${normalizedId}`}
      className="flex w-full items-center justify-between gap-4 rounded-lg border border-[#E4E4E7] bg-white px-6 py-4 transition-colors hover:bg-[#F8F8F8]"
    >
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <CategoryThemeIcon color={category.color} iconId={iconId} />

        <span className="text-sm font-normal text-[#292829] break-words md:text-[16px] md:leading-6">
          {category.name}
        </span>
      </div>

      <Icon
        className="hidden shrink-0 rotate-270 text-[#292829] md:block"
        id="expand"
        size={8}
      />
    </Link>
  );
};

export default CategoryCard;
