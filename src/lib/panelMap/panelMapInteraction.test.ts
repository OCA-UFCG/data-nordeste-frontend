import type { Map as MaplibreMap } from "maplibre-gl";
import { describe, expect, it, vi } from "vitest";

import type { MapFeatureProps } from "@/features/panelMap/geodataTypes";
import {
  type PanelMapMoveEnd,
  trackMoves,
} from "@/lib/panelMap/panelMapInteraction";
import { PANEL_MAP_LAYER } from "@/lib/panelMap/panelMapStyle";

type MoveEndEvent = object;

type RenderedQuery = { layers: string[] };

/**
 * Só o que `trackMoves` usa do MapLibre: o moveend, o zoom e o centro. O
 * `fitBounds` termina na hora, com o eventData no moveend, como o real.
 * `centerFeature` é a feição do indicador desenhada sob o centro (ou nenhuma).
 */
class MaplibreMovesFake {
  zoom = 5;
  centerFeature: Partial<MapFeatureProps> | null = null;
  private moveEnd: ((event: MoveEndEvent) => void) | null = null;

  readonly on = vi.fn((_type: string, callback: (event: object) => void) => {
    this.moveEnd = callback;
  });
  readonly getZoom = () => this.zoom;
  readonly getCenter = () => ({ lng: -37, lat: -8 });
  readonly project = () => ({ x: 0, y: 0 });
  readonly queryRenderedFeatures = vi.fn(
    (_point: unknown, query: RenderedQuery) => {
      const drawn = query.layers.includes(PANEL_MAP_LAYER.indicatorFill);

      return drawn && this.centerFeature
        ? [{ properties: this.centerFeature }]
        : [];
    },
  );

  readonly fitBounds = vi.fn(
    (_bbox: unknown, _options: unknown, data: object) => {
      this.zoom = 7;
      this.end(data);
    },
  );

  end(event: MoveEndEvent): void {
    this.moveEnd?.({ type: "moveend", ...event });
  }

  asMap(): MaplibreMap {
    return this as unknown as MaplibreMap;
  }
}

function trackedMoves(municipal = true) {
  const map = new MaplibreMovesFake();
  const moves: PanelMapMoveEnd[] = [];
  const tracker = trackMoves(map.asMap(), municipal);

  tracker.onMoveEnd((move) => moves.push(move));

  return { map, moves, tracker };
}

describe("trackMoves", () => {
  it("o fim de um fitTo é programático e marcado como fit", () => {
    const { moves, tracker } = trackedMoves();

    tracker.fitTo([
      [-41, -9.5],
      [-35, -3.5],
    ]);

    expect(moves.at(-1)).toMatchObject({
      programmatic: true,
      fit: true,
      fittedZoom: 7,
    });
  });

  it("um resize é programático, mas não é fit e mantém o fittedZoom", () => {
    const { map, moves } = trackedMoves();

    map.zoom = 6;
    map.end({});

    expect(moves.at(-1)).toMatchObject({
      programmatic: true,
      fit: false,
      fittedZoom: 5,
    });
  });

  it("um gesto do usuário não é programático nem fit", () => {
    const { map, moves } = trackedMoves();

    map.end({ originalEvent: new Event("wheel") });

    expect(moves.at(-1)).toMatchObject({ programmatic: false, fit: false });
  });
});

describe("trackMoves: códigos do centro", () => {
  it("município e UF vêm da mesma feição do indicador", () => {
    const { map, moves } = trackedMoves(true);

    // Divisa PE/PB: a UF é a do município sob o centro, não a de outra malha.
    map.centerFeature = { code: "2507507", uf: "PB" };
    map.end({ originalEvent: new Event("wheel") });

    expect(map.queryRenderedFeatures).toHaveBeenCalledWith(expect.anything(), {
      layers: [PANEL_MAP_LAYER.indicatorFill],
    });
    expect(moves.at(-1)).toMatchObject({
      centerUf: "PB",
      centerMun: "2507507",
    });
  });

  it("no IDH a UF é o código do estado sob o centro", () => {
    const { map, moves } = trackedMoves(false);

    map.centerFeature = { code: "PE", uf: "PE" };
    map.end({ originalEvent: new Event("wheel") });

    expect(moves.at(-1)?.centerUf).toBe("PE");
    expect(moves.at(-1)?.centerMun).toBeUndefined();
  });

  it("sem feição do indicador sob o centro (fora da área, mar), sem códigos", () => {
    const { map, moves } = trackedMoves(true);

    map.end({ originalEvent: new Event("wheel") });

    expect(moves.at(-1)?.centerUf).toBeUndefined();
    expect(moves.at(-1)?.centerMun).toBeUndefined();
  });
});
