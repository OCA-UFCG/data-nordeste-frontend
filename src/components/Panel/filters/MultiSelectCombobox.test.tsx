import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { MultiSelectCombobox } from "@/components/Panel/filters/MultiSelectCombobox";

const OPTIONS = [
  { value: "2507507", label: "João Pessoa (PB)" },
  { value: "2611606", label: "Recife (PE)" },
  { value: "2604106", label: "Caruaru (PE)" },
];

// O posicionamento do Radix Popover mede o gatilho; o jsdom não tem ResizeObserver.
class ResizeObserverStub {
  observe() {}

  unobserve() {}

  disconnect() {}
}

beforeAll(() => {
  globalThis.ResizeObserver ??= ResizeObserverStub;
});

const renderCombobox = (
  values: string[] = [],
  onChange = vi.fn(),
  max?: number,
) => {
  render(
    <MultiSelectCombobox
      id="mun"
      label="Município"
      plural="municípios"
      values={values}
      options={OPTIONS}
      onChange={onChange}
      max={max}
    />,
  );

  return onChange;
};

const open = () =>
  fireEvent.click(screen.getByRole("button", { name: /Município/ }));

const check = (name: string) =>
  fireEvent.click(screen.getByRole("checkbox", { name }));

describe("MultiSelectCombobox", () => {
  afterEach(() => vi.useRealTimers());

  it("summarizes the selection on the labelled trigger", () => {
    renderCombobox(["2611606", "2604106"]);

    expect(
      screen.getByRole("button", { name: "Município 2 municípios" }),
    ).toBeInTheDocument();
  });

  it("filters options ignoring accents and case", () => {
    renderCombobox();
    open();
    fireEvent.change(
      screen.getByRole("searchbox", { name: "Buscar município" }),
      { target: { value: "joao PESSOA" } },
    );

    expect(screen.getAllByRole("checkbox")).toHaveLength(1);
    expect(
      screen.getByRole("checkbox", { name: "João Pessoa (PB)" }),
    ).toBeInTheDocument();
  });

  it("applies quick successive clicks as one change", () => {
    vi.useFakeTimers();
    const onChange = renderCombobox(["2611606"]);

    open();
    check("João Pessoa (PB)");
    check("Recife (PE)");
    expect(onChange).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(400));

    expect(onChange).toHaveBeenCalledExactlyOnceWith(["2507507"]);
  });

  it("applies right away when the list closes", () => {
    const onChange = renderCombobox();

    open();
    check("Recife (PE)");
    fireEvent.keyDown(screen.getByRole("searchbox"), { key: "Escape" });

    expect(onChange).toHaveBeenCalledExactlyOnceWith(["2611606"]);
  });

  it("clears every value", () => {
    vi.useFakeTimers();
    const onChange = renderCombobox(["2611606", "2604106"]);

    open();
    fireEvent.click(screen.getByRole("button", { name: "Limpar seleção" }));
    act(() => vi.advanceTimersByTime(400));

    expect(onChange).toHaveBeenCalledExactlyOnceWith([]);
  });

  it("does not navigate when nothing changed", () => {
    const onChange = renderCombobox(["2611606"]);

    open();
    fireEvent.keyDown(screen.getByRole("searchbox"), { key: "Escape" });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("renders checked options first and caps the rest at 100", () => {
    const many = Array.from({ length: 150 }, (_, index) => ({
      value: String(2500000 + index),
      label: `Município ${index}`,
    }));

    render(
      <MultiSelectCombobox
        id="mun"
        label="Município"
        plural="municípios"
        values={["2500149"]}
        options={many}
        onChange={vi.fn()}
      />,
    );
    open();

    const boxes = screen.getAllByRole("checkbox");

    expect(boxes).toHaveLength(100);
    expect(boxes[0]).toBeChecked();
    expect(screen.getByText(/Mostrando 100 de 150/)).toBeInTheDocument();
  });

  // O servidor corta acima do máximo; sem a trava, a seleção sumiria calada.
  it("locks the unchecked options once the maximum is reached", () => {
    renderCombobox(["2611606"], vi.fn(), 2);
    open();

    // A região viva já existe vazia: o leitor de tela anuncia quando o texto entra.
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    check("João Pessoa (PB)");

    expect(
      screen.getByRole("checkbox", { name: "Caruaru (PE)" }),
    ).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "Recife (PE)" })).toBeEnabled();
    expect(
      screen.getByText("Máximo de 2 municípios selecionados"),
    ).toBeInTheDocument();
  });

  it("unlocks the options after unchecking one", () => {
    renderCombobox(["2611606", "2507507"], vi.fn(), 2);
    open();
    check("Recife (PE)");

    expect(
      screen.getByRole("checkbox", { name: "Caruaru (PE)" }),
    ).toBeEnabled();
    expect(screen.queryByText(/Máximo de/)).not.toBeInTheDocument();
  });
});
