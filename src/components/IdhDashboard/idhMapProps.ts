import type { ProtoStateMapProps } from "@/components/ProtoPanel/ProtoStateMap";
import type { ChoroplethRegion } from "@/features/panels/chartOptions";
import { idhClassFor } from "@/features/panels/idh/idhClasses";
import { formatIdh } from "@/features/panels/idh/idhFormat";

// Estado sem dado no ano: cinza neutro, e o mapa não o deixa escolher.
const NO_DATA_FILL = "#e3e1e2";

export const IDH_MAP_LABEL = "Mapa do IDH por estado do Nordeste";

const describeState = (code: string, region?: ChoroplethRegion) =>
  region
    ? `${region.name}, IDH ${formatIdh(region.value)}, ${idhClassFor(region.value).label}`
    : `${code}, sem dado`;

/**
 * Ligação do mapa do IDH: a cor é a faixa do estado, o texto é o do IDH e só
 * estado com dado escolhe. Usado pelo mapa do card e pelo de tela cheia.
 *
 * @example <ProtoStateMap {...buildIdhMapProps(panel.mapa, "PE", toggleUf)} />
 */
export const buildIdhMapProps = (
  mapa: ChoroplethRegion[],
  selectedUf: string | undefined,
  onSelect: (code: string) => void,
): ProtoStateMapProps => {
  const byCode = new Map(mapa.map((region) => [region.code, region]));

  return {
    fillFor: (code) => {
      const region = byCode.get(code);

      return region ? idhClassFor(region.value).color : NO_DATA_FILL;
    },
    describe: (code) => describeState(code, byCode.get(code)),
    isSelectable: (code) => byCode.has(code),
    label: IDH_MAP_LABEL,
    selectedUf,
    onSelect,
  };
};
