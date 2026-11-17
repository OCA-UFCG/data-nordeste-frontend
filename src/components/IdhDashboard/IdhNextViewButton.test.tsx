import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { IdhNextViewButton } from "@/components/IdhDashboard/IdhNextViewButton";

describe("IdhNextViewButton", () => {
  it("selects the view and moves focus to its tab", () => {
    const onSelect = vi.fn();

    render(
      <>
        <button type="button" role="tab" id="idh-tab-sexo">
          Visão por sexo
        </button>
        <IdhNextViewButton
          visao="sexo"
          tabIds={["idh-tab-sexo", "idh-rail-sexo"]}
          onSelect={onSelect}
        />
      </>,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Ir para a aba de Visão por sexo" }),
    );

    expect(onSelect).toHaveBeenCalledWith("sexo");
    expect(screen.getByRole("tab", { name: "Visão por sexo" })).toHaveFocus();
  });
});
