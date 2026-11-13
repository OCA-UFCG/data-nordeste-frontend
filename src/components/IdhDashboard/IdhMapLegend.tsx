import { buildIdhLegend } from "@/features/panels/idh/idhClasses";
import type { ChoroplethRegion } from "@/features/panels/chartOptions";

/**
 * Legenda do mapa do IDH (`.mleg`): as cinco faixas com o intervalo e a
 * contagem.
 *
 * @example <IdhMapLegend mapa={panel.mapa} />
 */
export const IdhMapLegend = ({
  mapa,
  className = "mt-3",
}: {
  mapa: ChoroplethRegion[];
  className?: string;
}) => (
  <div
    className={`flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-grey-1100 ${className}`}
  >
    {buildIdhLegend(mapa).map((item) => (
      <span key={item.label} className="inline-flex items-center gap-1.5">
        <i
          className="inline-block size-[9px] rounded-full"
          style={{ background: item.color }}
        />
        {item.label} ({item.range}){item.count ? ` · ${item.count}` : ""}
      </span>
    ))}
  </div>
);
