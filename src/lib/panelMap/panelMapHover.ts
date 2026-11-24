import type {
  FeatureIdentifier,
  MapLayerMouseEvent,
  Map as MaplibreMap,
} from "maplibre-gl";

import type { MapFeatureProps } from "@/features/panelMap/geodataTypes";
import type { PanelMapHoverLevel } from "@/features/panelMap/hoverLevel";
import {
  PANEL_MAP_LAYER,
  PANEL_MAP_SOURCE,
} from "@/lib/panelMap/panelMapStyle";

export type { PanelMapHoverLevel } from "@/features/panelMap/hoverLevel";

/**
 * O que está sob o ponteiro. `level: "feicao"`: a feição do indicador
 * (município, ou o estado no IDH), com as propriedades dela. `level:
 * "estado"`: o estado do município sob o ponteiro, só com a sigla em `code`
 * e `uf` (o nome vem do `estados.geojson`, que o componente já tem).
 */
export type PanelMapHover = {
  level: PanelMapHoverLevel;
  props: MapFeatureProps;
  x: number;
  y: number;
};

type FeatureId = FeatureIdentifier["id"];

type HoverTarget = { source: string; id: FeatureId };

type HoveredFeature = {
  id?: FeatureId;
  properties: unknown;
};

// O estado do município sob o ponteiro: o id na fonte dos estados é a sigla
// (promoteId `code`), a mesma do `uf` do município.
function stateHover(props: MapFeatureProps): {
  target: HoverTarget;
  props: MapFeatureProps;
} {
  const { uf } = props;

  return {
    target: { source: PANEL_MAP_SOURCE.states, id: uf },
    props: { code: uf, name: uf, uf },
  };
}

function hoverOf(feature: HoveredFeature, level: PanelMapHoverLevel) {
  const props = feature.properties as MapFeatureProps;

  if (level === "estado") return stateHover(props);
  if (feature.id === undefined) return null;
  const target = { source: PANEL_MAP_SOURCE.features, id: feature.id };

  return { target, props };
}

const sameTarget = (a: HoverTarget | null, b: HoverTarget | null) =>
  a?.source === b?.source && a?.id === b?.id;

// Um contorno de hover por vez, na fonte do nível (feições ou estados).
class FeatureHoverTracker {
  private hovered: HoverTarget | null = null;
  level: PanelMapHoverLevel = "feicao";
  listener: ((hover: PanelMapHover | null) => void) | null = null;

  constructor(private readonly map: MaplibreMap) {}

  readonly hover = (event: MapLayerMouseEvent) => {
    const feature = event.features?.[0];
    const hovered = feature ? hoverOf(feature, this.level) : null;

    if (!hovered) return this.clear();
    this.highlight(hovered.target);
    const { x, y } = event.point;

    this.listener?.({ level: this.level, props: hovered.props, x, y });
  };

  readonly clear = () => {
    this.highlight(null);
    this.listener?.(null);
  };

  private highlight(target: HoverTarget | null) {
    const { map, hovered } = this;

    if (hovered && !sameTarget(hovered, target)) {
      map.setFeatureState(hovered, { hover: false });
    }
    if (target) map.setFeatureState(target, { hover: true });
    map.getCanvas().style.cursor = target ? "pointer" : "";
    this.hovered = target;
  }
}

/**
 * Hover nas feições do indicador: contorno escuro por feature-state, cursor de
 * clique e o callback com o nível, as propriedades e a posição (null ao sair).
 * O ponteiro sempre passa pelas feições do indicador (já filtradas pela área
 * de interesse); no nível "estado" o contorno e o callback são do estado do
 * município, então só acendem estados com municípios na área.
 * `setHoverLevel` troca o nível e apaga o hover atual (o ponteiro pode estar
 * parado sobre o mapa quando o clique muda o recorte).
 */
export function trackHover(map: MaplibreMap) {
  const tracker = new FeatureHoverTracker(map);

  map.on("mousemove", PANEL_MAP_LAYER.indicatorFill, tracker.hover);
  map.on("mouseleave", PANEL_MAP_LAYER.indicatorFill, tracker.clear);

  return {
    onHover: (callback: (hover: PanelMapHover | null) => void) => {
      tracker.listener = callback;
    },
    setHoverLevel: (level: PanelMapHoverLevel) => {
      if (level === tracker.level) return;
      tracker.level = level;
      tracker.clear();
    },
  };
}
