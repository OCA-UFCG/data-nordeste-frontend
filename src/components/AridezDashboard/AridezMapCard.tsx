"use client";

import { useMemo, useState } from "react";
import type { AridezCardProps } from "@/components/AridezDashboard/aridezCardProps";
import { AridezIndexInfo } from "@/components/AridezDashboard/AridezIndexInfo";
import {
  ARIDEZ_CARD_INFO,
  ARIDEZ_CARD_SOURCE,
  ARIDEZ_MAP_MOBILE_TITLE,
  ARIDEZ_MAP_TITLE,
} from "@/components/AridezDashboard/aridezTexts";
import { PanelMap, type PanelMapProps } from "@/components/PanelMap/PanelMap";
import { PanelMapCardActions } from "@/components/PanelMap/PanelMapCardActions";
import { panelMapPosterInput } from "@/components/PanelMap/panelMapPoster";
import { PanelMapSkeleton } from "@/components/PanelMap/PanelMapSkeleton";
import { PANEL_MAP_HINT } from "@/components/PanelMap/panelMapTexts";
import { usePanelMapCard } from "@/components/PanelMap/usePanelMapCard";
import { usePanelMapFilters } from "@/components/PanelMap/usePanelMapFilters";
import { ProtoCard } from "@/components/ProtoPanel/ProtoCard";
import { ProtoMapFullscreen } from "@/components/ProtoPanel/ProtoMapFullscreen";
import { formatSharePercent } from "@/features/panels/aridez/aridezFormat";
import {
  aridezClassCounts,
  aridezMapValues,
  aridezPredominantClasses,
  aridezStateShares,
  aridezTooltipDetails,
} from "@/features/panels/aridez/aridezMap";
import type { AridezPanelData } from "@/features/panels/aridez/aridezPanel";
import type { TerritorialFilters } from "@/features/panels/territorialFilters";
import { areaLabel } from "@/features/panels/territorialOptions";

// Altura fixa: o mapa não depende da proporção da malha, e a legenda das
// classes fica abaixo da caixa.
const MAP_BOX_CLASS = "h-[480px] rounded-[8px] max-[1000px]:h-[400px]";

// O número do tooltip e as linhas por classe (o do município e, só com a área, o do estado), as contagens da legenda e o destaque das classes saem
// de todos os municípios da área (`data.mapa`): só mudam com Área e Ano, não
// com o zoom.
// O cartaz de download: "Mapa do Índice de aridez - {lugar}".
const POSTER_TEXTS = {
  name: "Índice de aridez",
  subtitle: "Índice de aridez",
  source: ARIDEZ_CARD_SOURCE,
};

const useAridezMapProps = (
  data: AridezPanelData,
  selection: TerritorialFilters,
  onFiltersChange: (filters: TerritorialFilters) => void,
): PanelMapProps => {
  const values = useMemo(() => aridezMapValues(data.mapa), [data.mapa]);
  const stateValues = useMemo(() => aridezStateShares(data.mapa), [data.mapa]);
  const classCounts = useMemo(() => aridezClassCounts(data.mapa), [data.mapa]);
  const classOf = useMemo(
    () => aridezPredominantClasses(data.mapa),
    [data.mapa],
  );
  const tooltipDetails = useMemo(
    () => aridezTooltipDetails(data.mapa),
    [data.mapa],
  );

  return {
    ...usePanelMapFilters(selection, onFiltersChange),
    indicator: "aridez",
    deepest: "municipio",
    formatValue: formatSharePercent,
    valueLabel: "Percentual de área suscetível à desertificação",
    label: ARIDEZ_MAP_TITLE,
    values,
    stateValues,
    classCounts,
    classOf,
    tooltipDetails,
  };
};

/**
 * Card "Índice de aridez": o raster do índice da década do ano escolhido, com
 * a legenda das classes e, no tooltip, o % de cada classe e o % de ASD do
 * município (ou do estado, só com a área). Aproximar ou clicar no mapa troca
 * Estado e Município no filtro do painel, pelo mesmo caminho da barra de
 * filtros.
 *
 * @example <AridezMapCard data={panel} selection={filters} onFiltersChange={request} state="ok" onRetry={retry} />
 */
export const AridezMapCard = ({
  data,
  selection,
  onFiltersChange,
  state,
  onRetry,
}: Pick<AridezCardProps, "data" | "state" | "onRetry"> & {
  selection: TerritorialFilters;
  onFiltersChange: (filters: TerritorialFilters) => void;
}) => {
  const card = usePanelMapCard(ARIDEZ_CARD_SOURCE);
  const [fullscreen, setFullscreen] = useState(false);
  const mapProps = useAridezMapProps(data, selection, onFiltersChange);
  const subtitle = `Índice de aridez · ${areaLabel(selection.area)} · ${selection.ano}`;

  return (
    <ProtoCard
      state={state}
      onRetry={onRetry}
      title={ARIDEZ_MAP_TITLE}
      mobileTitle={ARIDEZ_MAP_MOBILE_TITLE}
      subtitle={subtitle}
      kind="map"
      skeleton={<PanelMapSkeleton boxClassName={MAP_BOX_CLASS} />}
      bodyClassName="flex flex-col"
      overlay={
        <ProtoMapFullscreen
          open={fullscreen}
          onOpenChange={setFullscreen}
          title={ARIDEZ_MAP_TITLE}
          subtitle={subtitle}
          hint={PANEL_MAP_HINT}
          renderStage={(frame) => <PanelMap {...mapProps} className={frame} />}
        />
      }
      actions={
        <PanelMapCardActions
          title={ARIDEZ_MAP_TITLE}
          info={<AridezIndexInfo lead={ARIDEZ_CARD_INFO.map} />}
          imageSource={card.imageSource}
          engine={card.engine}
          poster={panelMapPosterInput(mapProps, card.geodata, POSTER_TEXTS)}
          disabled={state === "loading" || state === "error"}
          onOpenFullscreen={() => setFullscreen(true)}
        />
      }
    >
      <PanelMap {...mapProps} {...card.mapBinding} className={MAP_BOX_CLASS} />
    </ProtoCard>
  );
};
