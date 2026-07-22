import { Checkbox } from "@/components/ui/checkbox";
import { Icon } from "@/components/Icon/Icon";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ThemeFilterCardProps } from "./types";

function ThemeFilterCard({
  iconId,
  color,
  name,
  href,
  checked,
  disabled,
  onCheckedChange,
  className,
}: ThemeFilterCardProps & { disabled?: boolean; className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-row items-center h-12 w-[302px] bg-[#F8F7F8] border border-[#DCDBDC] rounded-lg cursor-pointer flex-shrink-0 overflow-hidden",
        disabled ? "opacity-50 cursor-not-allowed" : "",
        className,
      )}
      onClick={() => !disabled && onCheckedChange?.(!checked)}
    >
      <div
        className="flex items-center gap-2 h-full w-[254px] min-w-[128px] flex-1 px-2 transition-colors hover:bg-[#DDEADF]"
        style={{ borderRight: "1px solid #DCDBDC" }}
      >
        <Checkbox
          checked={checked}
          onCheckedChange={onCheckedChange}
          className="w-4 h-4 border-[#018F39] data-[state=checked]:bg-[#018F39] flex-shrink-0 rounded"
          onClick={(e) => e.stopPropagation()}
          disabled={disabled}
        />

        <Icon id={iconId} size={16} style={{ color }} />

        <span className="w-[182px] flex-1 truncate text-sm font-normal text-[#292829] leading-5">
          {name}
        </span>
      </div>

      {href ? (
        <Link
          href={href}
          title="Acesse o tema"
          className="group/tooltip relative flex items-center justify-center w-12 h-full shrink-0 transition-colors hover:bg-[#DDEADF] bg-[#F8F7F8]"
          onClick={(e) => e.stopPropagation()}
        >
          <Icon
            className="flex-shrink-0 rotate-[-90] text-[#018F39]"
            id="expand"
            size={10}
          />
          <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#292829] px-2 py-1 text-xs font-medium text-white opacity-0 shadow-md transition-opacity group-hover/tooltip:opacity-100">
            Acesse o tema
          </span>
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
