import { renderHook, waitFor } from "@testing-library/react";
import type { FeatureCollection } from "geojson";
import { describe, expect, it, vi } from "vitest";

import { useAreaStates } from "@/components/PanelMap/useAreaStates";
import type { TerritorialArea } from "@/features/panels/territorialFilters";

const FULL: FeatureCollection = { type: "FeatureCollection", features: [] };

const clipped = (area: string): FeatureCollection => ({
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { code: "MG", name: area },
      geometry: { type: "Point", coordinates: [0, 0] },
    },
  ],
});

// Respostas que o teste solta na ordem que quiser (rede lenta).
function deferredFetch() {
  const pending = new Map<string, (response: Response) => void>();
  const fetchGeodata = vi.fn(
    (url: string) =>
      new Promise<Response>((resolve) => pending.set(url, resolve)),
  );
  const respond = (area: string) =>
    pending.get(`/api/geodata/vector/estados_${area}.geojson`)?.(
      Response.json(clipped(area)),
    );

  return { fetchGeodata, respond };
}

describe("useAreaStates", () => {
  it("usa os estados inteiros até o arquivo da área chegar", async () => {
    const { fetchGeodata, respond } = deferredFetch();
    const { result } = renderHook(() =>
      useAreaStates("sudene", FULL, fetchGeodata),
    );

    expect(result.current).toBe(FULL);
    respond("sudene");

    await waitFor(() => expect(result.current).toEqual(clipped("sudene")));
  });

  it("a resposta atrasada da área anterior não vale para a nova", async () => {
    const { fetchGeodata, respond } = deferredFetch();
    const { result, rerender } = renderHook(
      ({ area }: { area: TerritorialArea }) =>
        useAreaStates(area, FULL, fetchGeodata),
      { initialProps: { area: "sudene" } },
    );

    rerender({ area: "caatinga" });
    respond("sudene");
    await Promise.resolve();

    expect(result.current).toBe(FULL);
    respond("caatinga");

    await waitFor(() => expect(result.current).toEqual(clipped("caatinga")));
  });
});
