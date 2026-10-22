import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PanelTabs } from "@/components/Panel/PanelTabs";

const TABS = [
  { key: "geral", label: "Visão geral" },
  { key: "sexo", label: "Visão por sexo" },
  { key: "cor", label: "Visão por cor" },
];

describe("PanelTabs", () => {
  it("keeps only the active tab in the tab order and moves with arrows", () => {
    const onSelect = vi.fn();

    render(
      <PanelTabs
        tabs={TABS}
        activeKey="geral"
        idPrefix="p"
        onSelect={onSelect}
      />,
    );
    const geral = screen.getByRole("tab", { name: "Visão geral" });

    expect(geral).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("tab", { name: "Visão por cor" })).toHaveAttribute(
      "tabindex",
      "-1",
    );

    fireEvent.keyDown(geral, { key: "ArrowLeft" });
    fireEvent.keyDown(geral, { key: "ArrowRight" });

    expect(onSelect.mock.calls).toEqual([["cor"], ["sexo"]]);
  });
});
