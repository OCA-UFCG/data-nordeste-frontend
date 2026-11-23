"use client";

import type { ProtoCardState } from "@/components/ProtoPanel/ProtoCard";
import {
  ProtoStatCards,
  type ProtoStatCell,
} from "@/components/ProtoPanel/ProtoStatCards";
import { asdArea, asdShare } from "@/features/panels/aridez/aridezClasses";
import { formatAreaKm2 } from "@/features/panels/aridez/aridezFormat";
import type { AridezPanelData } from "@/features/panels/aridez/aridezPanel";
import { formatPercent } from "@/features/panels/format";
import { describeTerritorialSelection } from "@/features/panels/territorialOptions";

// `.arid .bn .ico`: chip redondo em verde-claro, como no protótipo.
const ICON_CLASS = "rounded-full bg-[#e1eda9] text-[#49581c]";

/**
 * Os dois números de destaque da aridez: a área suscetível à desertificação
 * em km² e em % da área classificada. Sem área classificada, os valores
 * ficam vazios.
 *
 * @example aridezBigNumbers(panel)[1].value // "65%"
 */
export const aridezBigNumbers = (data: AridezPanelData): ProtoStatCell[] => {
  const caption = describeTerritorialSelection(data, true);
  const { areas } = data;

  return [
    {
      icon: "area",
      label: "Área suscetível à desertificação (km²)",
      caption,
      value: areas ? formatAreaKm2(asdArea(areas)) : null,
    },
    {
      icon: "pct",
      label: "Área suscetível à desertificação (%)",
      caption: `da área classificada · ${caption}`,
      value: areas ? formatPercent(asdShare(areas), 0) : null,
    },
  ];
};

/**
 * Números de destaque da aridez (`.arid .bns` do protótipo): dois cards lado
 * a lado, em carrossel no celular.
 *
 * @example <AridezBigNumbers data={panel} state="ok" onRetry={retry} />
 */
export const AridezBigNumbers = ({
  data,
  state,
  onRetry,
}: {
  data: AridezPanelData;
  state: ProtoCardState;
  onRetry: () => void;
}) => (
  <ProtoStatCards
    label="Números da aridez"
    variant="pair"
    iconClassName={ICON_CLASS}
    cells={aridezBigNumbers(data)}
    state={state}
    onRetry={onRetry}
  />
);
