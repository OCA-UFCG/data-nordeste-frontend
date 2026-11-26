import { afterEach, describe, expect, it, vi } from "vitest";
import type { ISection } from "@/utils/interfaces";
import { withExperimentalNavigation } from "./experimentalLink";
import { withReportsNavigation } from "./reportLink";

const content = [
  { appears: true, id: "catalog", name: "Catálogo de dados", path: "/catalog" },
  { appears: true, id: "about", name: "Sobre nós", path: "/about" },
] as ISection[];

describe("withExperimentalNavigation", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("põe Experimental depois de Relatório no gamma e no beta", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "beta");
    const ids = withExperimentalNavigation(withReportsNavigation(content)).map(
      (item) => item.id,
    );
    expect(ids).toEqual(["catalog", "reports", "experimental", "about"]);
  });

  it("não aparece em produção", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "prod");
    expect(withExperimentalNavigation(content)).toBe(content);
  });
});
