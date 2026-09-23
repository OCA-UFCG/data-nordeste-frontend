import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { MunicipalitySearch } from "./MunicipalitySearch";

const CITIES = ["Presidente Dutra (BA)", "Presidente Dutra (MA)"];

function ControlledMunicipalitySearch({
  onChange,
}: {
  onChange: (value: string) => void;
}) {
  const [value, setValue] = useState("");

  return (
    <MunicipalitySearch
      cities={CITIES}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
      value={value}
    />
  );
}

describe("MunicipalitySearch", () => {
  it("does not auto-select a suggestion on Enter when the query is ambiguous and unnavigated", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<ControlledMunicipalitySearch onChange={onChange} />);

    const input = screen.getByPlaceholderText("Pesquise o município");
    await user.type(input, "Presidente Dutra");
    await screen.findByRole("option", { name: "Presidente Dutra (BA)" });
    onChange.mockClear();
    await user.keyboard("{Enter}");

    expect(onChange).not.toHaveBeenCalled();
  });

  it("selects the highlighted suggestion on Enter after explicit arrow navigation", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<ControlledMunicipalitySearch onChange={onChange} />);

    const input = screen.getByPlaceholderText("Pesquise o município");
    await user.type(input, "Presidente Dutra");
    await screen.findByRole("option", { name: "Presidente Dutra (BA)" });
    await user.keyboard("{ArrowDown}{Enter}");

    expect(onChange).toHaveBeenLastCalledWith("Presidente Dutra (MA)");
  });

  it("still auto-selects on Enter when only one suggestion matches", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<ControlledMunicipalitySearch onChange={onChange} />);

    const input = screen.getByPlaceholderText("Pesquise o município");
    await user.type(input, "Presidente Dutra (MA)");
    await screen.findByRole("option", { name: "Presidente Dutra (MA)" });
    await user.keyboard("{Enter}");

    expect(onChange).toHaveBeenLastCalledWith("Presidente Dutra (MA)");
  });

  it("selects a suggestion on click regardless of navigation", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<ControlledMunicipalitySearch onChange={onChange} />);

    const input = screen.getByPlaceholderText("Pesquise o município");
    await user.type(input, "Presidente Dutra");
    const option = await screen.findByRole("option", {
      name: "Presidente Dutra (BA)",
    });
    await user.click(option);

    expect(onChange).toHaveBeenLastCalledWith("Presidente Dutra (BA)");
  });
});
