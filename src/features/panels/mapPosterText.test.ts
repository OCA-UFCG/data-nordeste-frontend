import { describe, expect, it } from "vitest";
import {
  flowRows,
  textWidth,
  truncateText,
  wrapWords,
} from "@/features/panels/mapPosterText";

describe("textWidth", () => {
  it("grows with the text and the font size", () => {
    expect(textWidth("Nordeste", 10, 400)).toBeGreaterThan(
      textWidth("Sul", 10, 400),
    );
    expect(textWidth("Nordeste", 20, 400)).toBeCloseTo(
      textWidth("Nordeste", 10, 400) * 2,
    );
  });

  it("makes bold text wider than regular text", () => {
    expect(textWidth("Nordeste", 10, 700)).toBeGreaterThan(
      textWidth("Nordeste", 10, 400),
    );
  });

  it("counts narrow letters as narrower than wide ones", () => {
    expect(textWidth("iiii", 10, 400)).toBeLessThan(textWidth("mmmm", 10, 400));
  });
});

describe("truncateText", () => {
  it("keeps text that fits", () => {
    expect(truncateText("PIB", 200, 10, 400)).toBe("PIB");
  });

  it("cuts with an ellipsis so the result fits the width", () => {
    const text = "Observatório da Caatinga e Desertificação";
    const cut = truncateText(text, 80, 10, 400);

    expect(cut.endsWith("…")).toBe(true);
    expect(textWidth(cut, 10, 400)).toBeLessThanOrEqual(80);
  });

  it("returns only the ellipsis when not even one letter fits", () => {
    expect(truncateText("Nordeste", 2, 10, 400)).toBe("…");
  });
});

describe("wrapWords", () => {
  it("breaks on word boundaries within the width", () => {
    const lines = wrapWords(
      "Mapa do porte populacional - Pernambuco",
      120,
      12,
      700,
      3,
    );

    expect(lines.length).toBeGreaterThan(1);
    lines.forEach((line) =>
      expect(textWidth(line, 12, 700)).toBeLessThanOrEqual(120),
    );
  });

  it("truncates the last line when the text needs more lines than allowed", () => {
    const lines = wrapWords(
      "um dois tres quatro cinco seis sete oito",
      60,
      12,
      400,
      2,
    );

    expect(lines).toHaveLength(2);
    expect(lines[1].endsWith("…")).toBe(true);
  });

  it("returns a single line for short text", () => {
    expect(wrapWords("PIB", 300, 12, 400, 2)).toEqual(["PIB"]);
  });
});

describe("flowRows", () => {
  it("fills each row up to the width, counting the gap between items", () => {
    const items = [{ width: 40 }, { width: 40 }, { width: 40 }];

    expect(flowRows(items, 90, 5)).toEqual([[0, 1], [2]]);
  });

  it("puts an item wider than the row alone on its row", () => {
    expect(flowRows([{ width: 200 }, { width: 10 }], 100, 5)).toEqual([
      [0],
      [1],
    ]);
  });

  it("returns no rows for no items", () => {
    expect(flowRows([], 100, 5)).toEqual([]);
  });
});
