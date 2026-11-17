"use client";

import { useId, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
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
  notice,
}: ThemeFilterCardProps & { disabled?: boolean; className?: string }) {
  const dimmed = disabled ? "opacity-50" : "";

  return (
    <div
      className={cn(
        "flex flex-row items-center h-12 w-[302px] bg-[#F8F7F8] border border-[#DCDBDC] rounded-lg cursor-pointer flex-shrink-0 overflow-hidden",
        disabled ? "cursor-not-allowed" : "",

        // A notice must stay readable, so only the rest of the card dims.
        disabled && !notice ? "opacity-50" : "",
        className,
      )}
      onClick={() => !disabled && onCheckedChange?.(!checked)}
    >
      <div
        className={cn(
          "flex items-center gap-2 h-full w-[254px] min-w-[128px] flex-1 px-2 transition-colors",

          // A disabled card cannot be checked, so it must not look clickable.
          !disabled && "hover:bg-[#DDEADF]",
        )}
        style={{ borderRight: "1px solid #DCDBDC" }}
      >
        <Checkbox
          checked={checked}
          onCheckedChange={onCheckedChange}
          aria-label={name}
          className="w-4 h-4 border-green-800 data-[state=checked]:bg-green-800 flex-shrink-0 rounded"
          onClick={(e) => e.stopPropagation()}
          disabled={disabled}
        />

        <Icon
          className={notice ? dimmed : ""}
          id={iconId}
          size={16}
          style={{ color }}
        />

        <span
          className={cn(
            "w-[182px] flex-1 truncate text-sm font-normal text-[#292829] leading-5",
            notice && dimmed,
          )}
        >
          {name}
        </span>
        {notice && <ThemeNotice text={notice} />}
      </div>

      {href ? (
        <Link
          href={href}
          title="Acesse o tema"
          aria-label={`Acesse o tema ${name}`}
          className="group/tooltip relative flex items-center justify-center w-12 h-full shrink-0 transition-colors hover:bg-[#DDEADF] bg-[#F8F7F8]"
          onClick={(e) => e.stopPropagation()}
        >
          <Icon
            className="flex-shrink-0 rotate-[-90] text-green-800"
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
            className="flex-shrink-0 rotate-[-90] text-green-800"
            id="expand"
            size={10}
          />
        </div>
      )}
    </div>
  );
}

/**
 * A small "!" in a circle that shows `text` on hover, keyboard focus or tap.
 * Example: `<ThemeNotice text="Sem dados para a Caatinga." />`.
 */
function ThemeNotice({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const contentId = useId();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <button
          aria-describedby={open ? contentId : undefined}
          aria-label="Por que este tema não está disponível?"
          className="flex size-4 shrink-0 cursor-help items-center justify-center rounded-full border border-red-800 text-[10px] font-bold leading-none text-red-800 focus-visible:outline-2 focus-visible:outline-green-800"
          type="button"
          onBlur={() => setOpen(false)}
          onClick={(event) => {
            event.stopPropagation();
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          !
        </button>
      </PopoverAnchor>
      <PopoverContent
        className="w-72 border-none bg-[#292829] p-3 text-xs leading-5 text-white"
        id={contentId}
        role="tooltip"
        side="top"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        {text}
      </PopoverContent>
    </Popover>
  );
}

export default ThemeFilterCard;
