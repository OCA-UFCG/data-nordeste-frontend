import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Footer from "./Footer";

describe("Footer", () => {
  it("names each icon-only social link after its network", () => {
    render(<Footer content={[]} />);

    for (const network of ["YouTube", "Facebook", "Instagram", "LinkedIn"]) {
      expect(
        screen.getByRole("link", { name: `SUDENE no ${network}` }),
      ).toBeInTheDocument();
    }
  });
});
