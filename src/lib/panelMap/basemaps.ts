export type BasemapKind = "satelite" | "oceano";

export type Basemap = {
  label: string;
  tiles: string;
  attribution: string;

  // Último nível com ladrilhos de verdade; acima dele o MapLibre amplia esse
  // nível (overzoom). Sem isto, o Oceano mostra "Map data not yet available".
  maxzoom?: number;
};

// Ambos os serviços respondem com `Access-Control-Allow-Origin: *` — sem isso o
// canvas fica "tainted" e o PNG do mapa (toDataURL) falha.
export const BASEMAPS: Record<BasemapKind, Basemap> = {
  satelite: {
    label: "Satélite",
    tiles:
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Esri, Maxar, Earthstar Geographics",
  },
  oceano: {
    label: "Oceano",
    tiles:
      "https://services.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}",
    attribution: "Esri",
    maxzoom: 10,
  },
};

export const BASEMAP_KINDS = Object.keys(BASEMAPS) as BasemapKind[];

/** Id da camada raster de um basemap: `basemapLayerId("oceano")` → `"basemap-oceano"`. */
export function basemapLayerId(kind: BasemapKind): string {
  return `basemap-${kind}`;
}
