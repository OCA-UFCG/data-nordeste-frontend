import { Checkbox } from "@/components/ui/checkbox";
import { Icon } from "@/components/Icon/Icon";
import Link from "next/link";
import { ThemeFilterCardProps } from "./types";

function ThemeFilterCard({
  iconId,
  color,
  name,
  href,
  checked,
  onCheckedChange,
}: ThemeFilterCardProps) {
  return (
    <div
      className="flex flex-row items-center h-12 w-[302px] bg-[#F8F7F8] border border-[#DCDBDC] rounded-lg cursor-pointer flex-shrink-0 overflow-hidden"
      onClick={() => onCheckedChange?.(!checked)}
    >
      <div
        className="flex items-center gap-2 h-full w-[254px] min-w-[128px] px-2 transition-colors hover:bg-[#DDEADF]"
        style={{ borderRight: "1px solid #DCDBDC" }}
      >
        <Checkbox
          checked={checked}
          onCheckedChange={onCheckedChange}
          className="w-4 h-4 border-[#018F39] data-[state=checked]:bg-[#018F39] flex-shrink-0 rounded"
          onClick={(e) => e.stopPropagation()}
        />

        <Icon id={iconId} size={16} style={{ color }} />

        <span className="w-[182px] text-sm font-normal text-[#292829] leading-5 truncate">
          {name}
        </span>
      </div>

      {href ? (
        <Link
          href={href}
          className="flex items-center justify-center w-12 h-full shrink-0 transition-colors hover:bg-[#DDEADF] bg-[#F8F7F8]"
          onClick={(e) => e.stopPropagation()}
        >
          <Icon
            className="flex-shrink-0 rotate-[-90] text-[#018F39]"
            id="expand"
            size={10}
          />
        </Link>
      ) : (
        <div className="flex items-center justify-center w-12 h-full shrink-0 transition-colors hover:bg-[#DDEADF] bg-[#F8F7F8]">
          <Icon
            className="flex-shrink-0 rotate-[-90] text-[#018F39]"
            id="expand"
            size={10}
          />
        </div>
      )}
    </div>
  );
}

export default ThemeFilterCard;
