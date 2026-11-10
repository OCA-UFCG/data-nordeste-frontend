import { describe, expect, it } from "vitest";
import { resolveInitialTab } from "./tabSelection";

describe("resolveInitialTab", () => {
  it("keeps the tab from the URL when it is visible", () => {
    expect(resolveInitialTab("boletins", ["paineis", "boletins"])).toBe(
      "boletins",
    );
  });

  it("opens on Painéis when the URL has no tab and panels exist", () => {
    expect(resolveInitialTab(null, ["paineis", "analises"])).toBe("paineis");
  });

  it("opens on the first visible tab when the theme has no panels", () => {
    expect(resolveInitialTab(null, ["boletins", "analises"])).toBe("boletins");
  });

  it("ignores a URL tab that is hidden for this theme", () => {
    expect(resolveInitialTab("paineis", ["boletins", "analises"])).toBe(
      "boletins",
    );
  });

  it("ignores a URL tab that does not exist", () => {
    expect(resolveInitialTab("inexistente", ["datastories"])).toBe(
      "datastories",
    );
  });
});
