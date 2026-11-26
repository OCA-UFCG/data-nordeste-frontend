import { describe, expect, it } from "vitest";
import type { IPublication } from "@/utils/interfaces";
import { pickExperimentalPanels } from "./panels";

const post = (link: string) => ({ title: link, link }) as IPublication;

describe("pickExperimentalPanels", () => {
  it("segue a ordem do catálogo e aponta para a demo", () => {
    const panels = pickExperimentalPanels([
      post("/data-panel/aridez"),
      post("/data-panel/pib"),
      post("/data-panel/populacao"),
    ]);
    expect(panels.map((panel) => panel.href)).toEqual([
      "/demo/pib",
      "/demo/perfil-demografico",
      "/demo/aridez",
    ]);
  });
});
