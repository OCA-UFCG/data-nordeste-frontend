import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useIdhNavigation } from "@/components/IdhDashboard/useIdhNavigation";

const applyFilters = vi.hoisted(() => vi.fn());

vi.mock("@/components/Panel/filters/useTerritorialNavigation", () => ({
  usePanelNavigation: () => ({
    isPending: false,
    pathname: "/demo/idh",
    applyFilters,
  }),
}));

describe("useIdhNavigation", () => {
  it("switches the view in the URL without asking the server", () => {
    const replaceState = vi.spyOn(window.history, "replaceState");
    const { result } = renderHook(() =>
      useIdhNavigation({ first: 2012, last: 2021 }),
    );

    result.current.showVisao({ ano: 2015, visao: "sexo", uf: "PE" });

    expect(replaceState).toHaveBeenCalledWith(
      null,
      "",
      "/demo/idh?ano=2015&uf=PE&visao=sexo",
    );
    expect(applyFilters).not.toHaveBeenCalled();
  });
});
