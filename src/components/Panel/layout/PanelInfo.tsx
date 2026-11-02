"use client";

import { Info } from "lucide-react";
import type { ReactNode } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Botão ⓘ do Power BI: abre um balão com a explicação dos indicadores.
export const PanelInfo = ({
  label,
  className = "text-grey-100",
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) => (
  <Popover>
    <PopoverTrigger
      aria-label={label}
      title={label}
      className={`inline-flex size-11 shrink-0 items-center justify-center rounded-md hover:bg-black/10 ${className}`}
    >
      <Info aria-hidden className="size-6" />
    </PopoverTrigger>
    <PopoverContent className="w-[min(32rem,calc(100vw-2rem))] bg-white text-sm leading-6 text-grey-1100">
      {children}
    </PopoverContent>
  </Popover>
);
