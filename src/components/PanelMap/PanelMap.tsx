"use client";

import { type ReactNode, useMemo } from "react";

import { BasemapSwitch } from "@/components/PanelMap/BasemapSwitch";
import { PanelMapLegend } from "@/components/PanelMap/PanelMapLegend";
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
  type MapFeatureMode,
  mapFeatureMode,
  recorteForLevel,
  statesWithAreaFlags,
} from "@/features/panelMap/featureLevel";
import type { PanelIndicator } from "@/features/panelMap/geodataTypes";
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

  // O que cada feição é. "estado" troca os municípios pela malha dos estados,
  // sem classes nem legenda: rosa, os escolhidos mais fortes, e o tooltip só
  // com o nome (vista Estados do perfil). Use com `deepest: "estado"`. O IDH
  // é sempre "estado". Lido na montagem: para trocar, remonte (`key`).
  featureLevel?: FeatureLevel;

  // Raster do índice de aridez: "off" não mostra; "base" mostra o da década do
  // `ano`, sempre ligado, sob os contornos. Não há controle no mapa. Padrão:
  // "base" no indicador "aridez", "off" nos outros.
  aridez?: PanelMapAridez;

  // Números do tooltip e do ranking por `code` da feição, vindos do painel
  // (aridez: a malha não tem valores). Sem eles, o `v<ano>` do GeoJSON;
  // feição fora do mapa = "sem dado".
  values?: ReadonlyMap<string, number>;

  // Legenda da aridez: quantas feições por valor de classe da paleta.
  classCounts?: ReadonlyMap<number, number>;

  // Aridez: classe predominante (valor da paleta) por `code` do município; é
  // o que a pílula da legenda destaca no mapa. Sem ela, a aridez não destaca.
  classOf?: ReadonlyMap<string, number>;
  onEngine?: (engine: PanelMapEngine | null) => void;

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

// Camadas e recorte pelo zoom: o zoom emite pelo `onRecorteChange` das props.
function usePanelMapRecorte(
  props: PanelMapProps,
  geodata: ReadyGeodata,
  engine: PanelMapEngine | null,
  mode: MapFeatureMode,
) {
  const aridez = aridezModeFor(props.indicator, props.aridez);
  const layers = { ...props, engine, geodata, aridez, mode };
  usePanelMapLayers(layers);

  usePanelMapAridez(engine, geodata.manifest, aridez, props.ano, props.area);

  // IMPORTANT: o zoom resolve a partir do recorte que o mapa desenha. Com
  // feições de estado, um município da barra prenderia o nível em município
  // (sem município no centro, nada muda) e afastar o tiraria sem aviso.
  const recorte = recorteForLevel(props.recorte, mode.level);

  useMapRecorte({ ...layers, recorte });
}

// Na malha dos estados, as feições são os estados com as marcas de área que
// os municípios do indicador dão a eles.
function useModeGeodata(
  loaded: ReadyGeodata,
  stateMesh: boolean,
): ReadyGeodata {
  return useMemo(() => {
    if (!stateMesh) return loaded;
    const features = statesWithAreaFlags(loaded.states, loaded.features);

    return { ...loaded, features };
  }, [loaded, stateMesh]);
}

// Motor, controles, camadas e tooltip, já com os geodados em mãos.
function usePanelMapStage(
  props: PanelMapProps,
  geodata: ReadyGeodata,
  mode: MapFeatureMode,
) {
  const { containerRef, engine, failed } = usePanelMapEngine({
    municipal: mode.level === "municipio",
    cooperative: props.cooperative ?? false,
    createEngine: props.createEngine,
    onEngine: props.onEngine,
  });
  const controls = usePanelMapControls(engine, props.onBasemapChange);
  const { features } = geodata;
  const nameOnly = mode.stateMesh;
  const tooltip = usePanelMapTooltip({ ...props, engine, features, nameOnly });

  usePanelMapRecorte(props, geodata, engine, mode);

  return { containerRef, engine, controls, tooltip, failed };
}

const PanelMapStage = ({
  geodata: loaded,
  ...props
}: PanelMapProps & { geodata: ReadyGeodata }) => {
  const mode = mapFeatureMode(props.indicator, props.featureLevel);
  const geodata = useModeGeodata(loaded, mode.stateMesh);
  const stage = usePanelMapStage(props, geodata, mode);
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
      {mode.stateMesh ? null : (
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
      )}
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
