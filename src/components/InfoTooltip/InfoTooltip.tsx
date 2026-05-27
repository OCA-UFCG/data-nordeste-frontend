"use client";

import Link from "next/link";
import { ReactNode, useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type InfoTooltipProps = {
  label: string;
  title: string;
  description?: string;
  content?: ReactNode;
  href?: string;
  ctaLabel?: string;
  className?: string;
};

export function InfoTooltip({
  label,
  title,
  description,
  content,
  href,
  ctaLabel,
  className,
}: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressOpenRef = useRef(false);

  const clearCloseTimeout = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const openPopover = () => {
    if (suppressOpenRef.current) {
      return;
    }

    clearCloseTimeout();
    setOpen(true);
  };

  const scheduleClose = () => {
    clearCloseTimeout();
    closeTimeoutRef.current = setTimeout(() => {
      setOpen(false);
    }, 120);
  };

  const resetSuppressedOpen = () => {
    suppressOpenRef.current = false;
  };

  const closePopover = () => {
    suppressOpenRef.current = true;
    clearCloseTimeout();
    setOpen(false);
  };

  useEffect(() => {
    return () => clearCloseTimeout();
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onMouseEnter={openPopover}
          onMouseLeave={() => {
            resetSuppressedOpen();
            scheduleClose();
          }}
          onFocus={openPopover}
          onClick={() => {
            if (open) {
              closePopover();

              return;
            }

            suppressOpenRef.current = false;
            openPopover();
          }}
          className={cn(
            "inline-flex h-10 w-10 items-center justify-center rounded-[6px] border border-[#EFEFEF] bg-white text-[#077432] transition-colors hover:border-[#D9D9D9] hover:bg-[#FAFAFA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#077432]/20 cursor-pointer",
            className,
          )}
        >
          <Info className="size-4" strokeWidth={2} />
        </button>
      </PopoverTrigger>

      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={8}
        onMouseEnter={openPopover}
        onMouseLeave={() => {
          resetSuppressedOpen();
          scheduleClose();
        }}
        onCloseAutoFocus={(event) => event.preventDefault()}
        className="w-[376px] rounded-[8px] border border-[#DCDBDC] bg-white p-0 shadow-[0_10px_30px_rgba(15,23,42,0.12)]"
      >
        <div className="space-y-6 p-4 text-[#292829]">
          <div className="flex items-start justify-between gap-3">
            <h3 className="pr-6 text-[18px] leading-7 font-semibold text-[#077432]">
              {title}
            </h3>
          </div>

          {content ? (
            content
          ) : description ? (
            <p className="text-[14px] leading-6 text-[#52525B]">
              {description}
            </p>
          ) : null}

          {href && ctaLabel && (
            <Link
              href={href}
              className="inline-flex max-w-[240px] text-[14px] leading-6 font-medium text-[#4B5563] transition-colors hover:text-[#077432]"
            >
              {ctaLabel}
            </Link>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
