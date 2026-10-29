import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RankedBars } from "@/components/Panel/RankedBars";

const POINTS = [
  { label: "Demais serviços", value: 26.77 },
  { label: "Indústrias de transformação", value: 5.87 },
];

describe("RankedBars", () => {
  it("is a plain list without onSelect", () => {
    render(<RankedBars points={POINTS} formatValue={String} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("toggles the selected row", () => {
    const onSelect = vi.fn();

    render(
      <RankedBars
        points={POINTS}
        formatValue={String}
        selectedLabel="Demais serviços"
        onSelect={onSelect}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Demais serviços/ }));
    fireEvent.click(screen.getByRole("button", { name: /Indústrias/ }));

    expect(onSelect.mock.calls).toEqual([
      [null],
      ["Indústrias de transformação"],
    ]);
    expect(
      screen.getByRole("button", { name: /Demais serviços/ }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("previews the row under the mouse, but not under a finger", () => {
    const onPreview = vi.fn();

    render(
      <RankedBars
        points={POINTS}
        formatValue={String}
        onSelect={() => undefined}
        onPreview={onPreview}
      />,
    );
    const row = screen.getByRole("button", { name: /Indústrias/ });

    fireEvent.pointerEnter(row, { pointerType: "touch" });
    fireEvent.pointerEnter(row, { pointerType: "mouse" });
    fireEvent.pointerLeave(screen.getByRole("list"), { pointerType: "mouse" });

    expect(onPreview.mock.calls).toEqual([
      ["Indústrias de transformação"],
      [null],
    ]);
  });
});
