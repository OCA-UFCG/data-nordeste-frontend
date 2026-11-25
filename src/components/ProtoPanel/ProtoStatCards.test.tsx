import { fireEvent, render } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { ProtoCardMenuContext } from "@/components/ProtoPanel/ProtoCardMenu";
import { stubPanelBrowserApis } from "@/components/ProtoPanel/protoBrowserFakes";
import {
  ProtoStatCards,
  type ProtoStatVariant,
} from "@/components/ProtoPanel/ProtoStatCards";

const CELLS = [{ icon: "area", label: "Área", value: null }] as const;

const renderLoading = (variant: ProtoStatVariant, withPill?: boolean) =>
  render(
    <ProtoStatCards
      label="Números"
      cells={[...CELLS]}
      state="loading"
      onRetry={() => {}}
      variant={variant}
      withPill={withPill}
    />,
  );

// As barras do esqueleto: cabeçalho e valor (e legenda e variação, com pill).
const skeletonBars = (container: HTMLElement) =>
  container.querySelectorAll('[aria-busy="true"] .animate-shimmer');

describe("ProtoStatCards loading skeleton", () => {
  beforeEach(stubPanelBrowserApis);

  it("keeps the pair skeleton to chip, label and value when cells have no pill", () => {
    const { container } = renderLoading("pair");

    expect(skeletonBars(container)).toHaveLength(3);
    expect(container.querySelector(".h-5")).toBeNull();
  });

  it("adds caption and pill bars to the pair skeleton only with withPill", () => {
    const { container } = renderLoading("pair", true);

    expect(skeletonBars(container)).toHaveLength(5);
    expect(container.querySelector(".h-5")).not.toBeNull();
  });

  it("does not change the row skeleton", () => {
    const { container } = renderLoading("row");

    expect(skeletonBars(container)).toHaveLength(3);
  });
});

const MENU = {
  share: { path: "/demo/perfil-demografico", chips: [] },
  catalogHref: null,
  imageSource: "IBGE",
};

const renderBigNumber = (state: "ok" | "error") =>
  render(
    <ProtoCardMenuContext.Provider value={MENU}>
      <ProtoStatCards
        label="Números"
        cells={[{ icon: "users", label: "População residente", value: "1" }]}
        state={state}
        onRetry={() => {}}
        variant="hero"
      />
    </ProtoCardMenuContext.Provider>,
  );

describe("ProtoStatCards menu", () => {
  beforeEach(stubPanelBrowserApis);

  it("gives every big number the ⋮ menu, titled by its label", () => {
    const { getByRole } = renderBigNumber("ok");

    expect(
      getByRole("button", { name: "Mais opções: População residente" }),
    ).toBeTruthy();
  });

  it("offers the image download on a loaded big number", () => {
    const { getByRole } = renderBigNumber("ok");

    fireEvent.click(
      getByRole("button", { name: "Mais opções: População residente" }),
    );

    expect(getByRole("button", { name: "Baixar imagem" })).toBeTruthy();
  });

  it("has no image to download when the big number failed to load", () => {
    const { getByRole, queryByRole } = renderBigNumber("error");

    fireEvent.click(
      getByRole("button", { name: "Mais opções: População residente" }),
    );

    expect(queryByRole("button", { name: "Baixar imagem" })).toBeNull();
  });
});
