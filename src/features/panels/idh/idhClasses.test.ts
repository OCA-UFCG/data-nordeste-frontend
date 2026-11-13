import { describe, expect, it } from "vitest";
import {
  buildIdhLegend,
  describeIdhClass,
  idhClassFor,
  rankIdhStates,
} from "@/features/panels/idh/idhClasses";
import type { IdhPanelData } from "@/features/panels/idh/idhPanel";

const point = (ano: number, idh: number) => ({
  ano,
  idh,
  idhAjustado: 0.5,
  gini: 0.55,
  rendaPerCapita: 467.43,
  rendimento: 934.08,
});

const panelData = (uf?: string): IdhPanelData => ({
  filters: { ano: 2021, visao: "geral", ...(uf ? { uf } : {}) },
  ufs: [
    { sigla: "CE", nome: "Ceará" },
    { sigla: "MA", nome: "Maranhão" },
  ],
  serie: [point(2020, 0.69), point(2021, 0.734)],
  mapa: [],
  sexo: [],
  cor: [],
});

describe("idhClassFor", () => {
  it("puts a class boundary in the upper class, as the PNUD does", () => {
    expect(idhClassFor(0.699).label).toBe("Médio");
    expect(idhClassFor(0.7).label).toBe("Alto");
    expect(idhClassFor(0.8).label).toBe("Muito alto");
  });
});

describe("rankIdhStates", () => {
  it("orders states from the highest IDH and colours each by its class", () => {
    const ranked = rankIdhStates([
      { code: "MA", name: "Maranhão", uf: "MA", value: 0.676 },
      { code: "CE", name: "Ceará", uf: "CE", value: 0.734 },
    ]);

    expect(ranked).toEqual([
      { code: "CE", label: "Ceará", value: 0.734, color: "#00bd47" },
      { code: "MA", label: "Maranhão", value: 0.676, color: "#ffbe20" },
    ]);
  });
});

describe("describeIdhClass", () => {
  it("names the selected state and the class of its IDH in the chosen year", () => {
    expect(describeIdhClass(panelData("CE"))).toBe("Ceará · faixa alto");
  });

  it("stays empty for the Northeast average", () => {
    expect(describeIdhClass(panelData())).toBeUndefined();
  });
});

describe("buildIdhLegend", () => {
  it("counts the states in each PNUD class", () => {
    const legend = buildIdhLegend([
      { code: "CE", name: "Ceará", uf: "CE", value: 0.734 },
      { code: "MA", name: "Maranhão", uf: "MA", value: 0.676 },
      { code: "RN", name: "Rio Grande do Norte", uf: "RN", value: 0.728 },
    ]);

    expect(legend.map(({ label, count }) => [label, count])).toEqual([
      ["Muito baixo", 0],
      ["Baixo", 0],
      ["Médio", 1],
      ["Alto", 2],
      ["Muito alto", 0],
    ]);
    expect(legend[3].range).toBe("0,700–0,799");
  });
});
