import type { Map as MaplibreMap } from "maplibre-gl";
import { describe, expect, it, vi } from "vitest";

import {
  type PanelMapMoveEnd,
  trackMoves,
} from "@/lib/panelMap/panelMapInteraction";

type MoveEndEvent = object;

/**
 * Só o que `trackMoves` usa do MapLibre: o moveend, o zoom e o centro. O
 * `fitBounds` termina na hora, com o eventData no moveend, como o real.
 */
class MaplibreMovesFake {
  zoom = 5;
  private moveEnd: ((event: MoveEndEvent) => void) | null = null;

  readonly on = vi.fn((_type: string, callback: (event: object) => void) => {
    this.moveEnd = callback;
  });
  readonly getZoom = () => this.zoom;
  readonly getCenter = () => ({ lng: -37, lat: -8 });
  readonly project = () => ({ x: 0, y: 0 });
  readonly queryRenderedFeatures = () => [];

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

function trackedMoves() {
  const map = new MaplibreMovesFake();
  const moves: PanelMapMoveEnd[] = [];
  const tracker = trackMoves(map.asMap(), true);

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
