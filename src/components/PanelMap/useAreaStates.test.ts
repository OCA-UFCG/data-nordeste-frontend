import { act, renderHook, waitFor } from "@testing-library/react";
import type { FeatureCollection } from "geojson";
import { describe, expect, it, vi } from "vitest";

import { useAreaStates } from "@/components/PanelMap/useAreaStates";
import type { TerritorialArea } from "@/features/panels/territorialFilters";

const FULL: FeatureCollection = { type: "FeatureCollection", features: [] };

const piece = (area: string, side: string): FeatureCollection => ({
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { code: "MG", name: `${area} ${side}` },
      geometry: { type: "Point", coordinates: [0, 0] },
    },
  ],
});

/** Rota dos geodados que só responde quando o teste manda (rede lenta). */
class DeferredGeodataFetchFake {
  private readonly pending = new Map<string, (response: Response) => void>();

  readonly fetch = vi.fn(
    (url: string) =>
      new Promise<Response>((resolve) => this.pending.set(url, resolve)),
  );

  respond(area: string): void {
    this.pending.get(`/api/geodata/vector/estados_${area}.geojson`)?.(
      Response.json(piece(area, "dentro")),
    );
    this.pending.get(`/api/geodata/vector/estados_fora_${area}.geojson`)?.(
      Response.json(piece(area, "fora")),
    );
  }
}

const loadedStates = (area: string) => ({
  inside: piece(area, "dentro"),
  outside: piece(area, "fora"),
  ready: true,
});

describe("useAreaStates", () => {
  it("usa os estados inteiros, sem parte de fora, até os arquivos chegarem", async () => {
    const fake = new DeferredGeodataFetchFake();
    const { result } = renderHook(() =>
      useAreaStates("sudene", FULL, fake.fetch),
    );

    expect(result.current).toEqual({
      inside: FULL,
      outside: { type: "FeatureCollection", features: [] },
      ready: false,
    });
    fake.respond("sudene");

    await waitFor(() => expect(result.current).toEqual(loadedStates("sudene")));
  });

  it("a resposta atrasada da área anterior não vale para a nova", async () => {
    const fake = new DeferredGeodataFetchFake();
    const { result, rerender } = renderHook(
      ({ area }: { area: TerritorialArea }) =>
        useAreaStates(area, FULL, fake.fetch),
      { initialProps: { area: "sudene" } },
    );

    rerender({ area: "caatinga" });
    fake.respond("sudene");

    // Deixa a resposta velha terminar (json + setState) antes de conferir.
    await act(() => new Promise((resolve) => setTimeout(resolve, 10)));

    expect(result.current.ready).toBe(false);
    fake.respond("caatinga");

    await waitFor(() =>
      expect(result.current).toEqual(loadedStates("caatinga")),
    );
  });
});
