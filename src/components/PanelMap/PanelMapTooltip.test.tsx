import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  PanelMapTooltip,
  type PanelMapTooltipState,
} from "@/components/PanelMap/PanelMapTooltip";

const tooltip = (
  overrides: Partial<PanelMapTooltipState> = {},
): PanelMapTooltipState => ({
  title: "Aroazes (PI)",
  details: [],
  value: "População: 5.369",
  rank: "1.511º de 1.794",
  x: 10,
  y: 20,
  ...overrides,
});

describe("PanelMapTooltip", () => {
  it("renders nothing without a hovered feature", () => {
    const { container } = render(<PanelMapTooltip tooltip={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("shows the name, the labelled value and the rank, in that order", () => {
    render(<PanelMapTooltip tooltip={tooltip()} />);

    const lines = [...screen.getByRole("tooltip").querySelectorAll("p")];

    expect(lines.map((line) => line.textContent)).toEqual([
      "Aroazes (PI)",
      "População: 5.369",
      "1.511º de 1.794",
    ]);
  });

  it("is a white card with a bold value line", () => {
    render(<PanelMapTooltip tooltip={tooltip()} />);

    expect(screen.getByRole("tooltip")).toHaveClass("bg-white", "border");
    expect(screen.getByText("População: 5.369")).toHaveClass("font-bold");
  });

  it("omits the rank line when the feature has no rank", () => {
    render(
      <PanelMapTooltip
        tooltip={tooltip({ value: "População: sem dado", rank: null })}
      />,
    );

    expect(screen.getByRole("tooltip").querySelectorAll("p")).toHaveLength(2);
  });

  it("shows only the name when the feature has no value", () => {
    render(<PanelMapTooltip tooltip={tooltip({ value: null, rank: null })} />);

    expect(screen.getByRole("tooltip")).toHaveTextContent(/^Aroazes \(PI\)$/);
  });
});
