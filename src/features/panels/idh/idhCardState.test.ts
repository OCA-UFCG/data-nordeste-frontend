import { describe, expect, it } from "vitest";
import { resolveIdhCardStates } from "@/features/panels/idh/idhCardState";
import type { IdhFilters } from "@/features/panels/idh/idhPanel";

const CURRENT: IdhFilters = { ano: 2021, visao: "geral" };

const navigatingTo = (pending: IdhFilters) =>
  resolveIdhCardStates({ failed: false, retrying: false, pending }, CURRENT);

describe("resolveIdhCardStates", () => {
  it("keeps the map and the ranking when only the state changes", () => {
    expect(navigatingTo({ ...CURRENT, uf: "PE" })).toEqual({
      bigNumbers: "loading",
      evolution: "loading",
      map: "ok",
      ranking: "ok",
      groups: "loading",
    });
  });

  it("keeps the yearly series and the map when only the year changes", () => {
    expect(navigatingTo({ ...CURRENT, ano: 2019 })).toEqual({
      bigNumbers: "loading",
      evolution: "ok",
      map: "ok",
      ranking: "loading",
      groups: "loading",
    });
  });

  it("ignores a pending change that touches no data filter", () => {
    const states = navigatingTo({ ...CURRENT, visao: "sexo" });

    expect(Object.values(states)).toEqual(Array(5).fill("ok"));
  });

  it("shows the skeleton while retrying a failed query", () => {
    const states = resolveIdhCardStates(
      { failed: true, retrying: true, pending: null },
      CURRENT,
    );

    expect(Object.values(states)).toEqual(Array(5).fill("loading"));
  });

  it("shows the skeleton when navigating away from a failed query", () => {
    const states = resolveIdhCardStates(
      { failed: true, retrying: false, pending: { ...CURRENT, uf: "PE" } },
      CURRENT,
    );

    expect(states.map).toBe("loading");
  });

  // Regressão (revisão da task 15): o mapa MapLibre não depende de dado do
  // servidor, e o esqueleto o remontava a cada troca de ano.
  it("keeps the map mounted while a year or state change is pending", () => {
    expect(navigatingTo({ ...CURRENT, ano: 2019 }).map).toBe("ok");
    expect(navigatingTo({ ...CURRENT, ano: 2019, uf: "PE" }).map).toBe("ok");
  });

  it("shows the error once nothing is pending", () => {
    const states = resolveIdhCardStates(
      { failed: true, retrying: false, pending: null },
      CURRENT,
    );

    expect(Object.values(states)).toEqual(Array(5).fill("error"));
  });

  it("is ok when nothing is pending and the query worked", () => {
    const states = resolveIdhCardStates(
      { failed: false, retrying: false, pending: null },
      CURRENT,
    );

    expect(Object.values(states)).toEqual(Array(5).fill("ok"));
  });
});
