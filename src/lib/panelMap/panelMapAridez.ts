import type { Coordinates, ImageSource, Map as MaplibreMap } from "maplibre-gl";

import type { Bounds } from "@/features/panelMap/mapLayers";
import {
  PANEL_MAP_LAYER,
  PANEL_MAP_SOURCE,
} from "@/lib/panelMap/panelMapStyle";

export type AridezOverlay = { url: string; bounds: Bounds };

/**
 * Cantos da imagem na ordem do MapLibre (NO, NE, SE, SO) a partir da caixa
 * `[[oeste, sul], [leste, norte]]` do manifest.
 */
function imageCorners([[west, south], [east, north]]: Bounds): Coordinates {
  return [
    [west, north],
    [east, north],
    [east, south],
    [west, south],
  ];
}

function removeAridez(map: MaplibreMap): void {
  if (map.getLayer(PANEL_MAP_LAYER.aridez)) {
    map.removeLayer(PANEL_MAP_LAYER.aridez);
  }
  if (map.getSource(PANEL_MAP_SOURCE.aridez)) {
    map.removeSource(PANEL_MAP_SOURCE.aridez);
  }
}

/**
 * Raster do índice de aridez logo abaixo das cores do indicador; `null` tira.
 * A fonte de imagem só existe com uma URL, por isso nasce aqui e não no estilo.
 */
export function showAridez(
  map: MaplibreMap,
  overlay: AridezOverlay | null,
): void {
  if (!overlay) return removeAridez(map);

  const coordinates = imageCorners(overlay.bounds);
  const current = map.getSource<ImageSource>(PANEL_MAP_SOURCE.aridez);

  if (current) {
    current.updateImage({ url: overlay.url, coordinates });

    return;
  }
  map.addSource(PANEL_MAP_SOURCE.aridez, {
    type: "image",
    url: overlay.url,
    coordinates,
  });
  map.addLayer(
    {
      id: PANEL_MAP_LAYER.aridez,
      type: "raster",
      source: PANEL_MAP_SOURCE.aridez,
    },
    PANEL_MAP_LAYER.indicatorFill,
  );
}
