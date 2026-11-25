import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AridezIndexInfo } from "@/components/AridezDashboard/AridezIndexInfo";

const LEAD = "Leitura específica do card.";

describe("AridezIndexInfo", () => {
  it("renders the card lead before the index definition", () => {
    render(<AridezIndexInfo lead={LEAD} />);

    expect(screen.getByText(LEAD)).toBeInTheDocument();
  });

  it("lists each aridity class as a list item", () => {
    render(<AridezIndexInfo lead={LEAD} />);

    const items = screen
      .getAllByRole("listitem")
      .map((item) => item.textContent);

    expect(items).toContain("Semiárido: IA entre 0,20 e 0,50;");
  });

  it("keeps the observation about coastal areas verbatim", () => {
    render(<AridezIndexInfo lead={LEAD} />);

    expect(
      screen.getByText(/^Obs\.: Os campos com valor "sem dados"/),
    ).toBeInTheDocument();
  });
});
