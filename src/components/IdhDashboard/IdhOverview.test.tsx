import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IdhOverview } from "@/components/IdhDashboard/IdhOverview";
import {
  allIdhCards,
  idhPanelFixture,
} from "@/components/IdhDashboard/idhTestFixtures";
import type { IdhCardStates } from "@/features/panels/idh/idhCardState";
import { stubPanelBrowserApis } from "@/components/ProtoPanel/protoBrowserFakes";

const FILTERS = { ano: 2021, visao: "geral" } as const;

const overview = (states: IdhCardStates) => (
  <IdhOverview
    data={idhPanelFixture(FILTERS)}
    selection={FILTERS}
    states={states}
    onRetry={vi.fn()}
    onSelectUf={vi.fn()}
    onSelectYear={vi.fn()}
  />
);

describe("IdhOverview", () => {
  beforeEach(stubPanelBrowserApis);

  // Regressão (revisão da PR #397): o diálogo ficava nos children do card, que
  // o esqueleto substitui, e era desmontado a cada estado clicado em tela cheia.
  it("keeps the fullscreen map open while the map card reloads", () => {
    const { rerender } = render(overview(allIdhCards("ok")));

    fireEvent.click(
      screen.getByRole("button", { name: "Abrir mapa em tela cheia" }),
    );
    const dialog = screen.getByRole("dialog");

    rerender(overview(allIdhCards("loading")));

    expect(screen.getByRole("dialog")).toBe(dialog);
  });
});
