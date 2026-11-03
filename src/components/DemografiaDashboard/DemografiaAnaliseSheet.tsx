"use client";

import { ChevronLeft } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { ChartPoint } from "@/features/panels/chartOptions";
import {
  describeCorRaca,
  describePortes,
} from "@/features/panels/demografia/demografiaAnalise";
import type { DemografiaPanelData } from "@/features/panels/demografia/demografiaPanel";

const AnaliseSection = ({
  title,
  lines,
}: {
  title: string;
  lines: string[];
}) => (
  <section className="flex flex-col gap-2">
    <h3 className="text-base font-bold text-grey-1100">{title}</h3>
    {lines.map((line) => (
      <p key={line} className="text-base leading-relaxed text-grey-1100">
        {line}
      </p>
    ))}
  </section>
);

export const DemografiaAnaliseSheet = ({
  data,
  municipios,
}: {
  data: Pick<DemografiaPanelData, "corRaca" | "corRacaAnterior">;
  municipios: ChartPoint[];
}) => (
  <Sheet>
    <SheetTrigger className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-md bg-[#c53d69] px-3 text-sm font-medium text-white hover:bg-[#a8325a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c53d69]">
      <ChevronLeft aria-hidden className="size-4" />
      Veja análise
    </SheetTrigger>
    <SheetContent
      side="right"
      aria-describedby={undefined}
      className="h-full w-[min(24rem,90vw)] gap-6 overflow-y-auto border-l-[6px] border-l-[#c53d69] bg-white"
    >
      <div className="flex flex-col gap-6 px-6 pb-6">
        <SheetTitle className="text-xl font-bold text-grey-1100">
          Análise descritiva
        </SheetTitle>
        <AnaliseSection
          title="Distribuição por cor ou raça"
          lines={describeCorRaca(data.corRaca, data.corRacaAnterior)}
        />
        <AnaliseSection
          title="Quantidade de municípios por porte"
          lines={describePortes(municipios)}
        />
      </div>
    </SheetContent>
  </Sheet>
);
