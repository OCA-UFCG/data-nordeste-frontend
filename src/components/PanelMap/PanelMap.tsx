"use client";

import type { ReactNode } from "react";

import { AridezControl } from "@/components/PanelMap/AridezControl";
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
import { usePanelMapControls } from "@/components/PanelMap/usePanelMapControls";
import { usePanelMapEngine } from "@/components/PanelMap/usePanelMapEngine";
import { usePanelMapLayers } from "@/components/PanelMap/usePanelMapLayers";
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
  label: string;
  onEngine?: (engine: PanelMapEngine | null) => void;

  // O usuário trocou o basemap (o card ajusta o crédito da imagem baixada).
  onBasemapChange?: (kind: BasemapKind) => void;

  // Gestos cooperativos (Ctrl/⌘ + roda, dois dedos): o mapa no card não
  // sequestra a rolagem da página. A tela cheia deixa desligado.
  cooperative?: boolean;
  className?: string;
  createEngine?: typeof createPanelMapEngine;
};

const FRAME = "relative h-full min-h-80 w-full overflow-hidden";

const PanelMapNotice = ({
  className = "",
  busy = false,
  children,
}: {
  className?: string;
  busy?: boolean;
  children: ReactNode;
}) => (
  <div
    aria-busy={busy}
    className={`${FRAME} flex items-center justify-center bg-grey-100 p-6 text-center text-sm text-grey-800 ${className}`}
  >
    <p>{children}</p>
  </div>
);

// Camadas e recorte pelo zoom: o zoom usa o callback marcado pelas camadas.
function usePanelMapRecorte(
  props: PanelMapProps,
  geodata: ReadyGeodata,
  engine: PanelMapEngine | null,
  aridezOn: boolean,
) {
  const layers = { ...props, engine, geodata, aridezOn };
  const onZoomRecorte = usePanelMapLayers(layers);

  useMapRecorte({ ...layers, onRecorteChange: onZoomRecorte });
}

// Motor, controles, camadas e tooltip, já com os geodados em mãos.
function usePanelMapStage(props: PanelMapProps, geodata: ReadyGeodata) {
  const { containerRef, engine, failed } = usePanelMapEngine({
    municipal: props.indicator !== "idh",
    cooperative: props.cooperative ?? false,
    createEngine: props.createEngine,
    onEngine: props.onEngine,
  });
  const controls = usePanelMapControls(
    engine,
    geodata.manifest,
    props.onBasemapChange,
  );
  const features = geodata.features;
  const tooltip = usePanelMapTooltip({ ...props, engine, features });

  usePanelMapRecorte(props, geodata, engine, controls.aridez.on);

  return { containerRef, controls, tooltip, failed };
}

type PanelMapOverlaysProps = {
  controls: ReturnType<typeof usePanelMapControls>;
  geodata: ReadyGeodata;
  props: PanelMapProps;
};

// Cada controle já vem posicionado no seu canto do mapa.
const PanelMapOverlays = ({
  controls,
  geodata,
  props,
}: PanelMapOverlaysProps) => (
  <>
    <AridezControl
      years={geodata.manifest.aridez.years}
      value={controls.aridez}
      onChange={controls.setAridez}
    />
    <BasemapSwitch value={controls.basemap} onChange={controls.setBasemap} />
    <PanelMapLegend
      styles={geodata.styles}
      indicator={props.indicator}
      label={props.label}
      aridezYear={controls.aridez.on ? controls.aridez.year : null}
    />
  </>
);

const PanelMapStage = ({
  geodata,
  ...props
}: PanelMapProps & { geodata: ReadyGeodata }) => {
  const stage = usePanelMapStage(props, geodata);
  const { containerRef, controls, tooltip } = stage;

  if (stage.failed) {
    return (
      <PanelMapNotice className={props.className}>
        {ENGINE_UNAVAILABLE}
      </PanelMapNotice>
    );
  }

  return (
    <div
      role="region"
      aria-label={props.label}
      className={`${FRAME} ${props.className ?? ""}`}
    >
      {/* IMPORTANT: o maplibre-gl.css força `.maplibregl-map { position: relative }`
          e anula o `absolute inset-0`; sem `h-full w-full` o contêiner fica com
          altura 0 e o canvas some. */}
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />
      <PanelMapOverlays controls={controls} geodata={geodata} props={props} />
      <PanelMapTooltip tooltip={tooltip} />
    </div>
  );
};

/**
 * Mapa MapLibre compartilhado dos painéis (PIB, Demografia, IDH): carrega os
 * geodados, pinta o indicador com as classes do `.qgz` e transforma o zoom do
 * usuário no recorte territorial do painel. Sem geodados no ambiente, mostra
 * um aviso no lugar do mapa e o card continua de pé.
 *
 * @example <PanelMap indicator="pib" ano={2023} area="nordeste" recorte={recorte} deepest="municipio" onRecorteChange={apply} formatValue={formatPibReais} label="Mapa do PIB por município" />
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
