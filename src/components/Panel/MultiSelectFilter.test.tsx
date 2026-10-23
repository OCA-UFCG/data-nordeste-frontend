import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MultiSelectFilter } from "@/components/Panel/MultiSelectFilter";

const OPTIONS = [
  { value: "2507507", label: "João Pessoa (PB)" },
  { value: "2611606", label: "Recife (PE)" },
  { value: "2304400", label: "Fortaleza (CE)" },
];

const NOUN = { singular: "município", plural: "municípios" };

const renderFilter = (values: string[], onChange = vi.fn()) =>
  render(
    <MultiSelectFilter
      label="Município"
      noun={NOUN}
      options={OPTIONS}
      values={values}
      onChange={onChange}
    />,
  );

describe("MultiSelectFilter", () => {
  it("summarises the selection on the trigger", () => {
    const { rerender } = renderFilter([]);

    expect(screen.getByRole("button", { name: /Todos/ })).toBeInTheDocument();
    rerender(
      <MultiSelectFilter
        label="Município"
        noun={NOUN}
        options={OPTIONS}
        values={["2611606", "2304400"]}
        onChange={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: /2 municípios/ }),
    ).toBeInTheDocument();
  });

  it("filters by search and applies all ticks in one change", () => {
    const onChange = vi.fn();

    renderFilter([], onChange);
    fireEvent.click(screen.getByRole("button", { name: /Município/ }));
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "joao" },
    });
    expect(screen.queryByLabelText("Recife (PE)")).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("João Pessoa (PB)"));
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByLabelText("Recife (PE)"));
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Aplicar (2)" }));

    expect(onChange).toHaveBeenCalledExactlyOnceWith(["2507507", "2611606"]);
  });

  it("keeps the list order while boxes are ticked", () => {
    renderFilter([]);
    fireEvent.click(screen.getByRole("button", { name: /Município/ }));
    const order = () =>
      screen
        .getAllByRole("checkbox")
        .map((box) => box.parentElement?.textContent);
    const before = order();

    fireEvent.click(screen.getByLabelText("Fortaleza (CE)"));

    expect(order()).toEqual(before);
  });

  it("treats unticking and ticking again as no change", () => {
    const onChange = vi.fn();

    renderFilter(["2507507", "2611606"], onChange);
    fireEvent.click(screen.getByRole("button", { name: /Município/ }));
    fireEvent.click(screen.getByLabelText("João Pessoa (PB)"));
    fireEvent.click(screen.getByLabelText("João Pessoa (PB)"));
    fireEvent.click(screen.getByRole("button", { name: "Aplicar (2)" }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not report a change when the selection stays the same", () => {
    const onChange = vi.fn();

    renderFilter(["2611606"], onChange);
    fireEvent.click(screen.getByRole("button", { name: /Município/ }));
    fireEvent.click(screen.getByRole("button", { name: "Aplicar (1)" }));

    expect(onChange).not.toHaveBeenCalled();
  });
});
