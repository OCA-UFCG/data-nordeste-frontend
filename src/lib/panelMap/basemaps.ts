export type BasemapKind = "satelite" | "oceano";

export type Basemap = {
  label: string;
  tiles: string;
  attribution: string;

  // Último nível com ladrilhos de verdade; acima dele o MapLibre amplia esse
  // nível (overzoom). Sem isto, o MapLibre mostra "Map data not yet available".
  maxzoom?: number;
};

// Os dois serviços (ESRI e tile.openstreetmap.org) respondem com
// `Access-Control-Allow-Origin: *` — sem isso o canvas fica "tainted" e o PNG do
// mapa (toDataURL) falha. O Oceano é o raster padrão do OpenStreetMap (terra
// branca, oceano azul); o uso segue a política de ladrilhos da OSMF.
export const BASEMAPS: Record<BasemapKind, Basemap> = {
  satelite: {
    label: "Satélite",
    tiles:
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Esri, Maxar, Earthstar Geographics",
  },
  oceano: {
    label: "Oceano",
    tiles: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "© OpenStreetMap contributors",
    maxzoom: 19,
  },
};

export const BASEMAP_KINDS = Object.keys(BASEMAPS) as BasemapKind[];

/** Id da camada raster de um basemap: `basemapLayerId("oceano")` → `"basemap-oceano"`. */
export function basemapLayerId(kind: BasemapKind): string {
  return `basemap-${kind}`;
}
