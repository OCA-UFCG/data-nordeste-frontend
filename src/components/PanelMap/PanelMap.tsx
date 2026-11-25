"use client";

import { type ReactNode, useEffect } from "react";

import { BasemapSwitch } from "@/components/PanelMap/BasemapSwitch";
import { PanelMapLegend } from "@/components/PanelMap/PanelMapLegend";
import { useAreaStates } from "@/components/PanelMap/useAreaStates";
import {
  PanelMapTooltip,
  usePanelMapTooltip,
} from "@/components/PanelMap/PanelMapTooltip";
import {
  type ReadyGeodata,
  useGeodata,
} from "@/components/PanelMap/useGeodata";
import { useMapRecorte } from "@/components/PanelMap/useMapRecorte";
import { usePanelMapAridez } from "@/components/PanelMap/usePanelMapAridez";
import { usePanelMapControls } from "@/components/PanelMap/usePanelMapControls";
import { usePanelMapEngine } from "@/components/PanelMap/usePanelMapEngine";
import { usePanelMapLayers } from "@/components/PanelMap/usePanelMapLayers";
import {
  aridezModeFor,
  type PanelMapAridez,
} from "@/features/panelMap/aridezRaster";
import {
  type FeatureLevel,
  featureLevelFor,
  recorteForLevel,
} from "@/features/panelMap/featureLevel";
import type { PanelIndicator } from "@/features/panelMap/geodataTypes";
import { hoverLevelFor } from "@/features/panelMap/hoverLevel";
import type { MapTooltipDetails } from "@/features/panelMap/mapTooltip";
import type { MapLevel, MapRecorte } from "@/features/panelMap/mapRecorte";
import type { TerritorialArea } from "@/features/panels/territorialFilters";
import type {
  BasemapKind,
  createPanelMapEngine,
  PanelMapEngine,
} from "@/lib/panelMapEngine";

export const GEODATA_UNAVAILABLE =
  "Mapa indisponível: os geodados não foram encontrados neste ambiente.";
export const ENGINE_UNAVAILABLE =
  "Mapa indisponível: este navegador não conseguiu desenhar o mapa.";

export type PanelMapProps = {
  indicator: PanelIndicator;
  ano: number;
  area: TerritorialArea;
  recorte: MapRecorte;
  deepest: MapLevel;
  onRecorteChange: (recorte: MapRecorte) => void;
  formatValue: (value: number) => string;

  // Nome do indicador no tooltip: "<valueLabel>: <valor formatado>".
  valueLabel: string;
  label: string;

  // Raster do índice de aridez: "off" não mostra; "base" mostra o da década do
  // `ano`, sempre ligado, sob os contornos. Não há controle no mapa. Padrão:
  // "base" no indicador "aridez", "off" nos outros.
  aridez?: PanelMapAridez;

  // Números do tooltip e do ranking por `code` da feição, vindos do painel
  // (aridez: a malha não tem valores). Sem eles, o `v<ano>` do GeoJSON;
  // feição fora do mapa = "sem dado".
  values?: ReadonlyMap<string, number>;

  // Hover por estado (só a área de interesse ativa): o número de cada estado
  // por sigla. Obrigatório quando os `values` não se somam (aridez: % de ASD
  // do estado, não a soma dos %). Sem ele, a soma do `v<ano>` dos municípios
  // do estado que estão na área.
  stateValues?: ReadonlyMap<string, number>;

  // Linhas extras do tooltip, entre o nome e o valor (aridez: % de cada classe
  // por município e por estado). Chaves: `code` IBGE e sigla. Sem ele, só o
  // nome, o valor e a posição.
  tooltipDetails?: MapTooltipDetails;

  // Legenda da aridez: quantas feições por valor de classe da paleta.
  classCounts?: ReadonlyMap<number, number>;

  // Aridez: classe predominante (valor da paleta) por `code` do município; é
  // o que a pílula da legenda destaca no mapa. Sem ela, a aridez não destaca.
  classOf?: ReadonlyMap<string, number>;
  onEngine?: (engine: PanelMapEngine | null) => void;

  // Os geodados prontos (e `null` ao desmontar): o card os usa na legenda e no
  // mini-mapa do cartaz de download.
  onGeodata?: (geodata: ReadyGeodata | null) => void;

  // O usuário trocou o basemap (o card ajusta o crédito da imagem baixada).
  onBasemapChange?: (kind: BasemapKind) => void;

  // Gestos cooperativos (Ctrl/⌘ + roda, dois dedos): o mapa no card não
  // sequestra a rolagem da página. A tela cheia deixa desligado.
  cooperative?: boolean;

  // Classes do quadro do mapa (a legenda fica abaixo dele): é dele a altura,
  // então defina uma, ex.: `h-[480px]`. Sem ela, `min-h-80`.
  className?: string;
  createEngine?: typeof createPanelMapEngine;
};

const FRAME = "relative w-full overflow-hidden";
const DEFAULT_FRAME_HEIGHT = "min-h-80";

const frameClass = (className: string | undefined) =>
  `${FRAME} ${className ?? DEFAULT_FRAME_HEIGHT}`;

const PanelMapNotice = ({
  className,
  busy = false,
  children,
}: {
  className?: string;
  busy?: boolean;
  children: ReactNode;
}) => (
  <div
    aria-busy={busy}
    className={`${frameClass(className)} flex items-center justify-center bg-grey-100 p-6 text-center text-sm text-grey-800`}
  >
    <p>{children}</p>
  </div>
);

// Só com a área de interesse, o hover das feições municipais nomeia estados.
function useHoverLevel(
  engine: PanelMapEngine | null,
  level: FeatureLevel,
  recorte: MapRecorte,
) {
  const hoverLevel = hoverLevelFor(level, recorte);

  useEffect(() => engine?.setHoverLevel(hoverLevel), [engine, hoverLevel]);
}

// Camadas e recorte pelo zoom: o zoom emite pelo `onRecorteChange` das props.
function usePanelMapRecorte(
  props: PanelMapProps,
  geodata: ReadyGeodata,
  engine: PanelMapEngine | null,
  level: FeatureLevel,
) {
  const aridez = aridezModeFor(props.indicator, props.aridez);

  // Hover e seleção de estado só na parte dele dentro da área de interesse; a
  // parte de fora do estado escolhido fica sob o véu.
  const areaStates = useAreaStates(props.area, geodata.states);
  const layers = { ...props, engine, geodata, areaStates, aridez, level };
  usePanelMapLayers(layers);

  usePanelMapAridez(engine, geodata.manifest, aridez, props.ano, props.area);

  // IMPORTANT: o zoom resolve a partir do recorte que o mapa desenha. Com
  // feições de estado, um município da barra prenderia o nível em município
  // (sem município no centro, nada muda) e afastar o tiraria sem aviso.
  const recorte = recorteForLevel(props.recorte, level);

  useMapRecorte({ ...layers, recorte });
  useHoverLevel(engine, level, props.recorte);
}

// Motor, controles, camadas e tooltip, já com os geodados em mãos.
function usePanelMapStage(
  props: PanelMapProps,
  geodata: ReadyGeodata,
  level: FeatureLevel,
) {
  const { containerRef, engine, failed } = usePanelMapEngine({
    municipal: level === "municipio",
    cooperative: props.cooperative ?? false,
    createEngine: props.createEngine,
    onEngine: props.onEngine,
  });
  const controls = usePanelMapControls(engine, props.onBasemapChange);
  const { features, states } = geodata;
  const tooltip = usePanelMapTooltip({ ...props, engine, features, states });

  usePanelMapRecorte(props, geodata, engine, level);

  return { containerRef, engine, controls, tooltip, failed };
}

// WARNING: `onGeodata` precisa ter identidade estável (um `setState`); uma
// função nova a cada render refaria o efeito sem fim.
function useReportGeodata(
  geodata: ReadyGeodata,
  onGeodata: PanelMapProps["onGeodata"],
) {
  useEffect(() => {
    onGeodata?.(geodata);

    return () => onGeodata?.(null);
  }, [geodata, onGeodata]);
}

const PanelMapStage = ({
  geodata,
  ...props
}: PanelMapProps & { geodata: ReadyGeodata }) => {
  const level = featureLevelFor(props.indicator);

  useReportGeodata(geodata, props.onGeodata);
  const stage = usePanelMapStage(props, geodata, level);
  const { containerRef, engine, controls, tooltip } = stage;

  if (stage.failed) {
    return (
      <PanelMapNotice className={props.className}>
        {ENGINE_UNAVAILABLE}
      </PanelMapNotice>
    );
  }

  // INTENTIONAL: a legenda é irmã do quadro, não filha: o quadro tem altura
  // fixa e `overflow-hidden`, e dentro dele a legenda seria cortada.
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        role="region"
        aria-label={props.label}
        className={frameClass(props.className)}
      >
        {/* IMPORTANT: o maplibre-gl.css força `.maplibregl-map { position: relative }`
            e anula o `absolute inset-0`; sem `h-full w-full` o contêiner fica com
            altura 0 e o canvas some. */}
        <div ref={containerRef} className="absolute inset-0 h-full w-full" />
        <BasemapSwitch
          value={controls.basemap}
          onChange={controls.setBasemap}
        />
        <PanelMapTooltip tooltip={tooltip} />
      </div>
      <PanelMapLegend
        styles={geodata.styles}
        features={geodata.features}
        indicator={props.indicator}
        area={props.area}
        ano={props.ano}
        classCounts={props.classCounts}
        classOf={props.classOf}
        engine={engine}
      />
    </div>
  );
};

/**
 * Mapa MapLibre compartilhado dos painéis (PIB, Demografia, IDH, aridez):
 * carrega os geodados, pinta o indicador com as classes do `.qgz` e transforma
 * o zoom do usuário no recorte territorial do painel. Na aridez, o raster da
 * década é a camada principal e as feições são só contornos, com os números
 * do painel (`values`, `classCounts`). Sem geodados no ambiente, mostra um
 * aviso no lugar do mapa e o card continua de pé.
 *
 * @example <PanelMap indicator="aridez" ano={2021} area="semiarido" recorte={recorte} deepest="municipio" onRecorteChange={apply} values={asdPorMunicipio} classCounts={predominantes} formatValue={formatPercent} valueLabel="Área suscetível" label="Mapa do índice de aridez" />
 * @example <PanelMap indicator="pib" ano={2023} area="nordeste" recorte={recorte} deepest="municipio" onRecorteChange={apply} formatValue={formatPibReais} valueLabel="PIB" label="Mapa do PIB por município" />
 */
export const PanelMap = (props: PanelMapProps) => {
  const geodata = useGeodata(props.indicator);

  if (geodata.status === "error") {
    return (
      <PanelMapNotice className={props.className}>
        {GEODATA_UNAVAILABLE}
      </PanelMapNotice>
    );
  }
  if (geodata.status === "loading") {
    return (
      <PanelMapNotice busy className={props.className}>
        Carregando mapa…
      </PanelMapNotice>
    );
  }

  return <PanelMapStage {...props} geodata={geodata} />;
};
