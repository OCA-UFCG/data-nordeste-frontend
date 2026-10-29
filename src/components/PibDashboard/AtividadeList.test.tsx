import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AtividadeList } from "@/components/PibDashboard/AtividadeList";

const pointsOf = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    label: `Atividade ${index + 1}`,
    value: count - index,
  }));

const renderList = (count: number, atividade: string | null = null) =>
  render(
    <AtividadeList
      points={pointsOf(count)}
      atividade={atividade}
      onSelectAtividade={() => undefined}
    />,
  );

describe("AtividadeList", () => {
  it("offers to expand only past the first five", () => {
    renderList(5);

    expect(screen.queryByRole("button", { name: /Ver todas/ })).toBeNull();
  });

  it("toggles between the first five and all", () => {
    renderList(7);
    const toggle = screen.getByRole("button", { name: "Ver todas (7)" });

    fireEvent.click(toggle);

    expect(toggle).toHaveTextContent("Ver menos");
    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });

  it("repeats the highlight next to the list with a link to the map", () => {
    renderList(3, "Atividade 2");

    expect(screen.getByRole("button", { name: "Ver no mapa" })).toBeVisible();
  });
});
