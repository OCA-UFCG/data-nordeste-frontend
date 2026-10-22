import type { LucideIcon } from "lucide-react";
import { PANEL_TONES, type PanelTone } from "@/components/Panel/PanelShell";

export type HighlightItem = { icon: LucideIcon; label: string; value: string };

export const HighlightCard = ({
  icon: CardIcon,
  label,
  value,
  tone,
}: HighlightItem & { tone: PanelTone }) => (
  <div className="flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-grey-200 bg-white shadow-sm">
    <div
      className={`flex min-h-16 items-center justify-center gap-4 px-4 py-3 text-white ${PANEL_TONES[tone].card}`}
    >
      <CardIcon aria-hidden className="size-8 shrink-0" strokeWidth={1.75} />
      <span className="text-sm font-medium">{label}</span>
    </div>
    <span className="whitespace-nowrap px-4 pb-6 pt-3 text-center text-[2rem] font-bold leading-tight text-green-800">
      {value}
    </span>
  </div>
);
