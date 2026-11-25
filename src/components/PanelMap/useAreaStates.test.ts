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

  // Regressão do gamma (#416): uma função de fetch nova a cada render (o que o
  // minificador fazia com o parâmetro padrão) não pode reiniciar a carga.
  it("não busca de novo quando só muda a identidade da função de fetch", async () => {
    const fake = new DeferredGeodataFetchFake();
    const { result, rerender } = renderHook(() =>
      useAreaStates("sudene", FULL, (url) => fake.fetch(url)),
    );

    rerender();
    fake.respond("sudene");
    await waitFor(() => expect(result.current).toEqual(loadedStates("sudene")));
    rerender();

    expect(fake.fetch).toHaveBeenCalledTimes(2);
  });

  // Um 200 que não é FeatureCollection (página de erro, arquivo pela metade)
  // não pode chegar ao mapa: `collection.features` seria undefined.
  it("resposta sem FeatureCollection vale como falha: estados inteiros, fora vazio", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchGeodata = vi.fn(async () => Response.json({ error: "x" }));
    const { result } = renderHook(() =>
      useAreaStates("sudene", FULL, fetchGeodata),
    );

    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.inside).toBe(FULL);
    expect(result.current.outside).toEqual({
      type: "FeatureCollection",
      features: [],
    });
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
