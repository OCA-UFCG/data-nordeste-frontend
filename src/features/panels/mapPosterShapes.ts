import type { FeatureCollection } from "geojson";

import type { MapRecorte } from "@/features/panelMap/mapRecorte";
import type { MapPosterInset } from "@/features/panels/mapPosterData";
import type { TerritorialArea } from "@/features/panels/territorialFilters";

// O que o mini-mapa lê dos geodados do mapa (um `ReadyGeodata` serve).
export type PosterShapes = {
  features: FeatureCollection;
  states: FeatureCollection;
  areas: FeatureCollection;
};

const pick = (
  collection: FeatureCollection,
  property: string,
  values: readonly string[],
): FeatureCollection => ({
  ...collection,
  features: collection.features.filter((feature) =>
    values.includes(String(feature.properties?.[property])),
  ),
});

// O recorte mais específico: município, senão estado, senão o contorno da área.
// WHY o estado inteiro e não só a parte dentro da área: o `estados_<area>`
// recortado não chega ao card, e no mini-mapa a diferença some.
const recorteShapes = (
  shapes: PosterShapes,
  area: TerritorialArea,
  recorte: MapRecorte,
): FeatureCollection => {
  if (recorte.mun.length > 0) return pick(shapes.features, "code", recorte.mun);
  if (recorte.uf.length > 0) return pick(shapes.states, "code", recorte.uf);

  return pick(shapes.areas, "area", [area]);
};

/**
 * Dados do mini-mapa de recorte do cartaz: todos os estados ao fundo e, em
 * destaque, o que está filtrado (município, estado ou a área). O desenho em
 * SVG é de `mapPosterInset.ts`.
 *
 * @example buildPosterInset(shapes, "nordeste", { uf: ["PE"], mun: [] }, "Pernambuco") // { label: "Recorte: Pernambuco", context: <estados>, highlight: <PE> }
 */
export const buildPosterInset = (
  shapes: PosterShapes,
  area: TerritorialArea,
  recorte: MapRecorte,
  place: string,
): MapPosterInset => ({
  label: `Recorte: ${place}`,
  context: shapes.states,
  highlight: recorteShapes(shapes, area, recorte),
});
