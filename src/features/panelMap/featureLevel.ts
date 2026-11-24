import type { Feature, FeatureCollection, GeoJsonProperties } from "geojson";

import type {
  GeodataStyles,
  PanelIndicator,
} from "@/features/panelMap/geodataTypes";
import { propertyIn } from "@/features/panelMap/mapLayers";
import type { MapRecorte } from "@/features/panelMap/mapRecorte";
import {
  visibleStateOutline,
  type FeaturePaint,
} from "@/features/panelMap/qgisPaint";
import { TERRITORIAL_AREAS } from "@/features/panels/territorialFilters";

/** O que cada feição do mapa é: um município ou um estado. */
export type FeatureLevel = "municipio" | "estado";

/**
 * `level`: o nível das feições. `stateMesh`: as feições são a malha dos
 * estados, sem valores do indicador (vista Estados do perfil), e não as do
 * GeoJSON do indicador.
 */
export type MapFeatureMode = { level: FeatureLevel; stateMesh: boolean };

// Cores da vista Estados do card de porte (o mapa SVG antigo, antes do
// 8880248). Literais: o mapa é canvas e a imagem baixada não lê variáveis CSS.
export const STATE_MESH_FILL = "#f6d3e0";
export const STATE_MESH_FILL_SELECTED = "#e98dae";

/**
 * Nível das feições do mapa. O IDH só existe por estado: as feições dele já
 * são estados, com valores. Nos outros indicadores, `requested` "estado" troca
 * os municípios pela malha dos estados.
 * Ex.: `mapFeatureMode("demografia", "estado")` → `{ level: "estado", stateMesh: true }`.
 */
export function mapFeatureMode(
  indicator: PanelIndicator,
  requested: FeatureLevel = "municipio",
): MapFeatureMode {
  if (indicator === "idh") return { level: "estado", stateMesh: false };

  return { level: requested, stateMesh: requested === "estado" };
}

function areasOf(properties: GeoJsonProperties): string[] {
  return TERRITORIAL_AREAS.flatMap(({ value }) =>
    properties?.[value] === 1 ? [value] : [],
  );
}

function areasByUf(municipios: FeatureCollection): Map<string, Set<string>> {
  const byUf = new Map<string, Set<string>>();

  municipios.features.forEach(({ properties }) => {
    const uf = String(properties?.uf);
    const areas = byUf.get(uf) ?? new Set<string>();

    areasOf(properties).forEach((area) => areas.add(area));
    byUf.set(uf, areas);
  });

  return byUf;
}

function withAreaFlags(state: Feature, areas: Set<string> | undefined) {
  const flags = TERRITORIAL_AREAS.map(({ value }) => [
    value,
    areas?.has(value) ? 1 : 0,
  ]);

  return {
    ...state,
    properties: { ...state.properties, ...Object.fromEntries(flags) },
  };
}

/**
 * Estados com as marcas de área (`nordeste`, `semiarido`…) que o
 * `estados.geojson` não traz: um estado está na área quando algum município
 * dele está. WHY: assim o filtro da área (`areaFilter`) e o centro do zoom
 * (`centerCodes`) só veem estados que o servidor aceita como opção.
 * Ex.: Petrolina no Semiárido → PE com `semiarido: 1`.
 */
export function statesWithAreaFlags(
  states: FeatureCollection,
  municipios: FeatureCollection,
): FeatureCollection {
  const byUf = areasByUf(municipios);
  const features = states.features.map((state) =>
    withAreaFlags(state, byUf.get(String(state.properties?.code))),
  );

  return { ...states, features };
}

/**
 * Pintura da malha dos estados: rosa claro, e os estados escolhidos mais
 * fortes. O contorno é o dos estados no `.qgz`, com espessura mínima visível.
 * Ex.: `stateMeshPaint(styles, ["PE"]).color` → `["case", …, "#e98dae", "#f6d3e0"]`.
 */
export function stateMeshPaint(
  styles: GeodataStyles,
  selectedUfs: string[],
): FeaturePaint {
  return {
    color: [
      "case",
      propertyIn("code", selectedUfs),
      STATE_MESH_FILL_SELECTED,
      STATE_MESH_FILL,
    ],
    outline: visibleStateOutline(styles.stateOutline),
  };
}

/**
 * O recorte como o mapa o desenha no nível: com feições de estado, um
 * município escolhido na barra não tem feição; vale o estado dele. Sem isto
 * o véu cobriria o próprio estado escolhido e o enquadramento não acharia
 * nada.
 * Ex.: `recorteForLevel({ uf: ["PE"], mun: ["2611606"] }, "estado")` → `{ uf: ["PE"], mun: [] }`.
 */
export function recorteForLevel(
  recorte: MapRecorte,
  level: FeatureLevel,
): MapRecorte {
  if (level === "municipio" || recorte.mun.length === 0) return recorte;

  return { uf: recorte.uf, mun: [] };
}
