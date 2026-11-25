import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { TerritorialSelects } from "@/components/Panel/filters/TerritorialFilterBar";

// O posicionamento do Radix Popover mede o gatilho; o jsdom não tem ResizeObserver.
class ResizeObserverStub {
  observe() {}

  unobserve() {}

  disconnect() {}
}

beforeAll(() => {
  globalThis.ResizeObserver ??= ResizeObserverStub;
});

const renderSelects = (
  multiple?: boolean,
  onChange = vi.fn(),
  single?: boolean,
) => {
  render(
    <TerritorialSelects
      filters={{ ano: 2021, area: "nordeste", uf: ["PE"], mun: ["2611606"] }}
      years={[2021]}
      ufs={[
        { sigla: "PB", nome: "Paraíba" },
        { sigla: "PE", nome: "Pernambuco" },
      ]}
      municipios={[
        { cdMun: "2507507", nome: "João Pessoa (PB)" },
        { cdMun: "2611606", nome: "Recife (PE)" },
      ]}
      onChange={onChange}
      multiple={multiple}
      single={single}
    />,
  );

  return onChange;
};

describe("TerritorialSelects", () => {
  it("keeps native single selects by default", () => {
    const onChange = renderSelects();

    expect(screen.getByRole("combobox", { name: "Estado" })).toHaveValue("PE");
    fireEvent.change(screen.getByRole("combobox", { name: "Estado" }), {
      target: { value: "PB" },
    });

    expect(onChange).toHaveBeenCalledWith({
      ano: 2021,
      area: "nordeste",
      uf: ["PB"],
    });
  });

  it("uses the searchable multi-select when asked (PIB)", () => {
    renderSelects(true);

    expect(
      screen.getByRole("button", { name: "Estado Pernambuco" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Município Recife (PE)" }),
    ).toBeInTheDocument();
  });

  describe("single choice (PIB e Perfil demográfico, versões Power BI)", () => {
    afterEach(() => vi.useRealTimers());

    const pick = (field: RegExp, option: string) => {
      fireEvent.click(screen.getByRole("button", { name: field }));
      fireEvent.click(screen.getByRole("button", { name: option }));
      act(() => vi.advanceTimersByTime(500));
    };

    it("keeps the searchable combobox look", () => {
      renderSelects(true, vi.fn(), true);

      expect(
        screen.getByRole("button", { name: "Estado Pernambuco" }),
      ).toBeInTheDocument();
    });

    it("replaces the state and clears the municipality", () => {
      vi.useFakeTimers();
      const onChange = renderSelects(true, vi.fn(), true);

      pick(/^Estado/, "Paraíba");

      expect(onChange).toHaveBeenCalledExactlyOnceWith({
        ano: 2021,
        area: "nordeste",
        uf: ["PB"],
      });
    });

    it("uses the same combobox for the area and clears state and municipality", () => {
      vi.useFakeTimers();
      const onChange = renderSelects(true, vi.fn(), true);

      pick(/^Área de interesse/, "Semiárido");

      expect(onChange).toHaveBeenCalledExactlyOnceWith({
        ano: 2021,
        area: "semiarido",
      });
    });

    it("never leaves the area empty", () => {
      vi.useFakeTimers();
      const onChange = renderSelects(true, vi.fn(), true);

      pick(/^Área de interesse/, "Nordeste");

      expect(onChange).not.toHaveBeenCalled();
      expect(
        screen.queryByRole("button", { name: "Limpar seleção" }),
      ).not.toBeInTheDocument();
    });

    it("replaces the municipality and keeps the state", () => {
      vi.useFakeTimers();
      const onChange = renderSelects(true, vi.fn(), true);

      pick(/^Município/, "João Pessoa (PB)");

      expect(onChange).toHaveBeenCalledExactlyOnceWith({
        ano: 2021,
        area: "nordeste",
        uf: ["PE"],
        mun: ["2507507"],
      });
    });
  });
});
