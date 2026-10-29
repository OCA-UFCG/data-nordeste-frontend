import { render, screen } from "@testing-library/react";
import { CircleDollarSign } from "lucide-react";
import { describe, expect, it } from "vitest";
import {
  HighlightCard,
  withCommonFit,
} from "@/components/Panel/HighlightCards";

describe("HighlightCard", () => {
  it("gives every card of a group the font of the longest value", () => {
    const items = withCommonFit([
      { icon: CircleDollarSign, label: "PIB", value: "R$ 1,24 Tri" },
      { icon: CircleDollarSign, label: "Per capita", value: "R$ 21,56 Mil" },
    ]);

    render(
      <>
        {items.map((item) => (
          <HighlightCard key={item.label} tone="orange" {...item} />
        ))}
      </>,
    );

    expect(items.map((item) => item.fitTo)).toEqual([
      "R$ 21,56 Mil",
      "R$ 21,56 Mil",
    ]);
    expect(screen.getByText("R$ 1,24 Tri").style.fontSize).toBe(
      screen.getByText("R$ 21,56 Mil").style.fontSize,
    );
  });

  it("keeps the change line height when there is no previous year", () => {
    const { container } = render(
      <HighlightCard
        tone="orange"
        icon={CircleDollarSign}
        label="PIB"
        value="R$ 0,52 Tri"
        change={null}
      />,
    );

    expect(container.querySelector("[aria-hidden].leading-5")).not.toBeNull();
  });
});
