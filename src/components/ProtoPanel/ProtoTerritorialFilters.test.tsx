import { act, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ProtoTerritorialFilters } from "@/components/ProtoPanel/ProtoTerritorialFilters";
import type { TerritorialSelection } from "@/features/panels/territorialOptions";

// O posicionamento do Radix Popover mede o gatilho; o jsdom não tem ResizeObserver.
class ResizeObserverStub {
  observe() {}

  unobserve() {}

  disconnect() {}
}

beforeAll(() => {
  globalThis.ResizeObserver ??= ResizeObserverStub;
});

const DATA: TerritorialSelection = {
  filters: {
    ano: 2022,
    area: "nordeste",
    uf: ["PE"],
    mun: ["2611606"],
  },
  ufs: [
    { sigla: "PB", nome: "Paraíba" },
    { sigla: "PE", nome: "Pernambuco" },
  ],
  municipios: [
    { cdMun: "2507507", nome: "João Pessoa" },
    { cdMun: "2611606", nome: "Recife" },
  ],
};

const renderBar = (onChange = vi.fn()) => {
  render(
    <ProtoTerritorialFilters
      data={DATA}
      years={[2022, 2021]}
      onChange={onChange}
      onClear={vi.fn()}
      isDefault={false}
      top={0}
      stuck={false}
      barRef={createRef<HTMLDivElement>()}
    />,
  );

  return onChange;
};

const pick = (field: RegExp, option: string) => {
  fireEvent.click(screen.getByRole("button", { name: field }));
  fireEvent.click(screen.getByRole("button", { name: option }));
  act(() => vi.advanceTimersByTime(500));
};

describe("ProtoTerritorialFilters single choice", () => {
  afterEach(() => vi.useRealTimers());

  it("replaces the chosen state and clears the municipality", () => {
    vi.useFakeTimers();
    const onChange = renderBar();

    pick(/^Estado/, "Paraíba");

    expect(onChange).toHaveBeenCalledExactlyOnceWith({
      ano: 2022,
      area: "nordeste",
      uf: ["PB"],
    });
  });

  it("replaces the chosen municipality and keeps the state", () => {
    vi.useFakeTimers();
    const onChange = renderBar();

    pick(/^Município/, "João Pessoa");

    expect(onChange).toHaveBeenCalledExactlyOnceWith({
      ...DATA.filters,
      mun: ["2507507"],
    });
  });
});
