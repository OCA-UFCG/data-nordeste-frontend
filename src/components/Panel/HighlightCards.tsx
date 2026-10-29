import type { KpiItem } from "@/components/Panel/KpiCards";
import { PANEL_TONES, type PanelTone } from "@/components/Panel/PanelShell";

export const HighlightCard = ({
  icon: CardIcon,
  label,
  value,
  tone,
  compact = false,
}: KpiItem & { tone: PanelTone; compact?: boolean }) => (
  <div className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-grey-200 bg-white shadow-sm">
    <div
      className={`flex min-h-16 items-center justify-center gap-4 px-4 py-3 text-white ${PANEL_TONES[tone].card}`}
    >
      <CardIcon aria-hidden className="size-8 shrink-0" strokeWidth={1.75} />
      <span className="text-sm font-medium">{label}</span>
    </div>
    {/* compact: dois cards lado a lado no celular sem cortar "R$ 27,68 Mil". */}
    <span
      className={`whitespace-nowrap pb-6 pt-3 text-center font-bold leading-tight text-green-800 ${compact ? "px-2 text-2xl lg:px-4 lg:text-[2rem]" : "px-4 text-[2rem]"}`}
    >
      {value}
    </span>
  </div>
);
