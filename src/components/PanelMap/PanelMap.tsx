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
  createPanelMapEngine,
  PanelMapEngine,
} from "@/lib/panelMapEngine";

export const GEODATA_UNAVAILABLE =
  "Mapa indisponível: os geodados não foram encontrados neste ambiente.";

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

// Motor, camadas e recorte pelo zoom, já com os geodados em mãos.
function usePanelMapStage(props: PanelMapProps, geodata: ReadyGeodata) {
  const { indicator, recorte, deepest } = props;
  const { containerRef, engine } = usePanelMapEngine({
    municipal: indicator !== "idh",
    createEngine: props.createEngine,
    onEngine: props.onEngine,
  });
  const controls = usePanelMapControls(engine, geodata.manifest);
  const onZoomRecorte = usePanelMapLayers({
    ...props,
    engine,
    geodata,
    aridezOn: controls.aridez.on,
  });

  useMapRecorte({ engine, recorte, deepest, onRecorteChange: onZoomRecorte });
  const tooltip = usePanelMapTooltip({
    ...props,
    engine,
    features: geodata.features,
  });

  return { containerRef, controls, tooltip };
}

type PanelMapControls = ReturnType<typeof usePanelMapControls>;

// Aridez no canto superior esquerdo; basemap à esquerda do +/− do MapLibre,
// que ocupa o canto superior direito.
const PanelMapTopControls = ({
  controls,
  aridezYears,
}: {
  controls: PanelMapControls;
  aridezYears: number[];
}) => (
  <>
    <div className="absolute top-2.5 left-2.5 z-10">
      <AridezControl
        years={aridezYears}
        value={controls.aridez}
        onChange={controls.setAridez}
      />
    </div>
    <div className="absolute top-2.5 right-12 z-10">
      <BasemapSwitch value={controls.basemap} onChange={controls.setBasemap} />
    </div>
  </>
);

const PanelMapStage = ({
  geodata,
  ...props
}: PanelMapProps & { geodata: ReadyGeodata }) => {
  const { containerRef, controls, tooltip } = usePanelMapStage(props, geodata);
  const { aridez } = controls;

  return (
    <div
      role="region"
      aria-label={props.label}
      className={`${FRAME} ${props.className ?? ""}`}
    >
      <div ref={containerRef} className="absolute inset-0" />
      <PanelMapTopControls
        controls={controls}
        aridezYears={geodata.manifest.aridez.years}
      />
      <div className="absolute bottom-2.5 left-2.5 z-10">
        <PanelMapLegend
          styles={geodata.styles}
          indicator={props.indicator}
          label={props.label}
          aridezYear={aridez.on ? aridez.year : null}
        />
      </div>
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
