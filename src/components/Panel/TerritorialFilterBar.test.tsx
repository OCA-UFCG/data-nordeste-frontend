import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TerritorialSelects } from "@/components/Panel/TerritorialFilterBar";

const renderSelects = (multiple?: boolean, onChange = vi.fn()) => {
  render(
    <TerritorialSelects
      filters={{ ano: 2021, area: "nordeste", uf: ["PE"], mun: ["2611606"] }}
      years={[2021]}
      ufs={[
        { sigla: "PB", nome: "Paraíba" },
        { sigla: "PE", nome: "Pernambuco" },
      ]}
      municipios={[{ cdMun: "2611606", nome: "Recife (PE)" }]}
      onChange={onChange}
      multiple={multiple}
    />,
  );

  return onChange;
};

describe("TerritorialSelects", () => {
  it("keeps native single selects by default (Perfil Demográfico)", () => {
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
});
