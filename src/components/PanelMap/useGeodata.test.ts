import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  type GeodataFetch,
  useGeodata,
} from "@/components/PanelMap/useGeodata";

const EMPTY_COLLECTION = { type: "FeatureCollection", features: [] };

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200 });
}

describe("useGeodata", () => {
  // O build de produção embutia o fetch padrão no parâmetro (`t=e=>fetch(e)`):
  // uma função nova a cada render reiniciava a carga e o mapa ficava preso em
  // "Carregando mapa…". Aqui a função nova a cada render é explícita.
  it("does not reload when only the fetch function identity changes", async () => {
    const fetchSpy = vi.fn<GeodataFetch>(async () =>
      jsonResponse(EMPTY_COLLECTION),
    );

    const { result, rerender } = renderHook(() =>
      useGeodata("pib", (url) => fetchSpy(url)),
    );

    rerender();
    rerender();
    await waitFor(() => expect(result.current.status).toBe("ready"));
    rerender();

    expect(fetchSpy).toHaveBeenCalledTimes(5);
  });

  it("reloads when the indicator changes", async () => {
    const fetchSpy = vi.fn<GeodataFetch>(async () =>
      jsonResponse(EMPTY_COLLECTION),
    );

    const { result, rerender } = renderHook(
      ({ indicator }) => useGeodata(indicator, fetchSpy),
      {
        initialProps: { indicator: "pib" as const } as {
          indicator: "pib" | "idh";
        },
      },
    );

    await waitFor(() => expect(result.current.status).toBe("ready"));
    rerender({ indicator: "idh" });
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(10));
    expect(fetchSpy).toHaveBeenLastCalledWith(
      "/api/geodata/vector/areas.geojson",
    );
  });
});
