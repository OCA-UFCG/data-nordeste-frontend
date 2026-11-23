import { describe, expect, it } from "vitest";

import {
  EMPTY_RECORTE,
  levelForZoom,
  levelOfRecorte,
  resolveRecorte,
  sameRecorte,
} from "@/features/panelMap/mapRecorte";
import type { MapRecorte } from "@/features/panelMap/mapRecorte";

const RECIFE = "2611606";

describe("levelForZoom", () => {
  it("escolhe o nível pelos limiares absolutos de zoom", () => {
    expect(levelForZoom(5, "municipio")).toBe("area");
    expect(levelForZoom(7, "municipio")).toBe("estado");
    expect(levelForZoom(9, "municipio")).toBe("municipio");
  });

  it("inclui os limiares: 6,5 é estado e 8,5 é município", () => {
    expect(levelForZoom(6.5, "municipio")).toBe("estado");
    expect(levelForZoom(8.5, "municipio")).toBe("municipio");
    expect(levelForZoom(6.49, "municipio")).toBe("area");
    expect(levelForZoom(8.49, "municipio")).toBe("estado");
  });

  it("limita o nível ao mais fundo permitido (IDH não passa de estado)", () => {
    expect(levelForZoom(9, "estado")).toBe("estado");
  });
});

describe("levelOfRecorte", () => {
  it("deriva o nível do que está selecionado", () => {
    expect(levelOfRecorte(EMPTY_RECORTE)).toBe("area");
    expect(levelOfRecorte({ uf: ["PE"], mun: [] })).toBe("estado");
    expect(levelOfRecorte({ uf: ["PE"], mun: [RECIFE] })).toBe("municipio");
  });
});

describe("resolveRecorte", () => {
  const base = {
    fittedZoom: 5,
    current: EMPTY_RECORTE,
    deepest: "municipio" as const,
  };

  it("desce para estado ao passar do zoom de estado sobre PE", () => {
    const result = resolveRecorte({ ...base, zoom: 7, centerUf: "PE" });

    expect(result).toEqual({ uf: ["PE"], mun: [] });
  });

  it("desce para município com uf e mun ao passar do zoom de município", () => {
    const result = resolveRecorte({
      ...base,
      zoom: 9,
      centerUf: "PE",
      centerMun: RECIFE,
    });

    expect(result).toEqual({ uf: ["PE"], mun: [RECIFE] });
  });

  it("fica no estado quando não há município sob o centro", () => {
    const result = resolveRecorte({ ...base, zoom: 9, centerUf: "PE" });

    expect(result).toEqual({ uf: ["PE"], mun: [] });
  });

  it("não sobe quando o zoom está dentro da tolerância do enquadramento", () => {
    const current: MapRecorte = { uf: ["BA"], mun: [] };
    const result = resolveRecorte({
      ...base,
      current,
      fittedZoom: 5.8,
      zoom: 5.8,
      centerUf: "BA",
    });

    expect(result).toBe(current);
  });

  it("não sobe quando o zoom é exatamente enquadramento menos a tolerância", () => {
    const current: MapRecorte = { uf: ["PE"], mun: [] };
    const result = resolveRecorte({
      ...base,
      current,
      fittedZoom: 7,
      zoom: 6.5,
      centerUf: "PE",
    });

    expect(result).toBe(current);
  });

  it("mantém o município quando afasta mas segue no nível município e o centro não tem município", () => {
    const current: MapRecorte = { uf: ["PE"], mun: [RECIFE] };
    const result = resolveRecorte({
      ...base,
      current,
      fittedZoom: 10.5,
      zoom: 9.5,
      centerUf: "PE",
    });

    expect(result).toBe(current);
  });

  it("sobe para a área quando afasta além da tolerância", () => {
    const result = resolveRecorte({
      ...base,
      current: { uf: ["PE"], mun: [] },
      fittedZoom: 7,
      zoom: 6.2,
      centerUf: "PE",
    });

    expect(result).toEqual(EMPTY_RECORTE);
  });

  it("sobe de município para estado quando afasta além da tolerância", () => {
    const result = resolveRecorte({
      ...base,
      current: { uf: ["PE"], mun: [RECIFE] },
      fittedZoom: 9,
      zoom: 7.5,
      centerUf: "PE",
      centerMun: RECIFE,
    });

    expect(result).toEqual({ uf: ["PE"], mun: [] });
  });

  it("troca o estado alvo ao arrastar no mesmo nível", () => {
    const result = resolveRecorte({
      ...base,
      current: { uf: ["PE"], mun: [] },
      fittedZoom: 7,
      zoom: 7,
      centerUf: "PB",
    });

    expect(result).toEqual({ uf: ["PB"], mun: [] });
  });

  it("troca o município alvo ao arrastar, com o uf dele", () => {
    const result = resolveRecorte({
      ...base,
      current: { uf: ["PE"], mun: [RECIFE] },
      fittedZoom: 9,
      zoom: 9,
      centerUf: "PB",
      centerMun: "2507507",
    });

    expect(result).toEqual({ uf: ["PB"], mun: ["2507507"] });
  });

  it("mantém a seleção múltipla quando o centro está dentro dela", () => {
    const current: MapRecorte = { uf: ["PE", "PB"], mun: [] };
    const result = resolveRecorte({
      ...base,
      current,
      fittedZoom: 7,
      zoom: 7,
      centerUf: "PE",
    });

    expect(result).toBe(current);
  });

  it("mantém a seleção quando não há estado sob o centro (oceano)", () => {
    const current: MapRecorte = { uf: ["PE"], mun: [] };
    const result = resolveRecorte({ ...base, current, zoom: 9 });

    expect(result).toBe(current);
  });

  it("nunca põe município quando o nível mais fundo é estado", () => {
    const result = resolveRecorte({
      ...base,
      zoom: 10,
      centerUf: "PE",
      centerMun: RECIFE,
      deepest: "estado",
    });

    expect(result).toEqual({ uf: ["PE"], mun: [] });
  });
});

describe("sameRecorte", () => {
  it("ignora a ordem dos itens", () => {
    const a: MapRecorte = { uf: ["PB", "PE"], mun: [] };
    const b: MapRecorte = { uf: ["PE", "PB"], mun: [] };

    expect(sameRecorte(a, b)).toBe(true);
  });

  it("diferencia seleções distintas", () => {
    const a: MapRecorte = { uf: ["PB"], mun: [] };
    const b: MapRecorte = { uf: ["PB"], mun: [RECIFE] };

    expect(sameRecorte(a, b)).toBe(false);
  });
});
