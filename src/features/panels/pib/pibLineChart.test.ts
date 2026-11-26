import { describe, expect, it } from "vitest";
import {
  buildPibLineGeometry,
  PIB_LINE_TITLE_Y,
  pibLineSubtitle,
  pibLineUnits,
} from "@/features/panels/pib/pibLineChart";
import type { PibYearPoint } from "@/features/panels/pib/pibPanel";

// PIB e per capita do Nordeste no protótipo, 2010 a 2023.
const PIB_BILLIONS = [
  522.769, 583.413, 653.067, 724.524, 805.099, 848.579, 898.362, 953.429,
  1004.827, 1047.766, 1079.331, 1243.103, 1388.05, 1513.055,
];
const PER_CAPITA = [
  9849, 10905, 12118, 12986, 14329, 15003, 15784, 16653, 17703, 18359, 18812,
  21556, 25401, 27682,
];

const SERIE: PibYearPoint[] = PIB_BILLIONS.map((pib, index) => ({
  ano: 2010 + index,
  pib: pib * 1e9,
  perCapita: PER_CAPITA[index],
}));

// "2023" em negrito a 11,5 px mede 30 px; com folga.
const YEAR_WIDTH = 32;

const geometryOf = (
  key: "pib" | "perCapita",
  width = 600,
  selectedIndex = 13,
) => buildPibLineGeometry({ width, serie: SERIE, key, selectedIndex });

describe("buildPibLineGeometry", () => {
  it("draws the total on its own round axis from zero, in billions", () => {
    const geometry = geometryOf("pib");

    expect(geometry.height).toBe(360);
    expect(geometry.ticks.map((tick) => tick.value)).toEqual([
      0, 4e11, 8e11, 1.2e12, 1.6e12,
    ]);
    expect(geometry.ticks[0].y).toBe(360 - geometry.margin.bottom);
    expect(geometry.ticks[4].y).toBe(geometry.margin.top);
  });

  // O motivo de separar os gráficos: com eixo próprio, o per capita ocupa a
  // altura toda em vez de ficar achatado sob a escala do PIB total.
  it("gives the per capita its own axis in thousands, filling the height", () => {
    const geometry = geometryOf("perCapita");
    const top = Math.min(...geometry.points.map((point) => point.y));

    expect(geometry.ticks.map((tick) => tick.value)).toEqual([
      0, 8000, 16000, 24000, 32000,
    ]);
    expect(top - geometry.margin.top).toBeLessThan(60);
  });

  it("sizes the left margin by the longest tick label", () => {
    // "1.600" (5 caracteres) no PIB total, "32" no per capita.
    expect(geometryOf("pib").margin.left).toBe(49);
    expect(geometryOf("perCapita").margin.left).toBe(25);
  });

  it("spreads the years from the left to the right margin", () => {
    const geometry = geometryOf("pib");

    expect(geometry.years[0].x).toBe(geometry.margin.left);
    expect(geometry.years[13].x).toBe(600 - geometry.margin.right);
    expect(geometry.selectedX).toBe(geometry.years[13].x);
    expect(geometry.years.every((year) => year.show)).toBe(true);
    expect(geometry.years[13].selected).toBe(true);
  });

  it("labels a late year above the point, ending left of it", () => {
    const { label, points } = geometryOf("pib");

    expect(label).toMatchObject({
      anchor: "end",
      x: points[13].x - 4,
      y: points[13].y - 12,
      value: SERIE[13].pib,
    });
  });

  it("centres the label of an earlier year without crossing the left axis", () => {
    const geometry = geometryOf("pib", 600, 0);

    expect(geometry.label).toMatchObject({
      anchor: "middle",
      x: geometry.margin.left + 44,
    });
  });

  it("keeps the axis title above the value label of the top point", () => {
    // Altura de maiúscula do rótulo (13 px) com o contorno branco.
    const LABEL_TOP = 12;
    const TITLE_DESCENT = 4;
    const geometry = buildPibLineGeometry({
      width: 600,
      serie: [
        { ano: 2022, pib: 8e11, perCapita: 1e4 },
        { ano: 2023, pib: 1.6e12, perCapita: 1.1e4 },
      ],
      key: "pib",
      selectedIndex: 1,
    });

    expect(geometry.label?.y).toBe(geometry.margin.top - 12);
    expect((geometry.label?.y ?? 0) - LABEL_TOP).toBeGreaterThan(
      PIB_LINE_TITLE_Y + TITLE_DESCENT,
    );
  });

  it("shrinks below 560 px and skips years that would touch, keeping the last", () => {
    const geometry = geometryOf("pib", 340);
    const shown = geometry.years.filter((year) => year.show);

    expect(geometry.narrow).toBe(true);
    expect(geometry.height).toBe(320);
    expect(shown.length).toBeLessThan(14);
    expect(shown[shown.length - 1].year).toBe(2023);
    shown.slice(1).forEach((year, index) => {
      expect(year.x - shown[index].x).toBeGreaterThanOrEqual(YEAR_WIDTH);
    });
  });

  it("shows the selected year at narrow width, hiding a neighbour it would touch", () => {
    const shown = geometryOf("pib", 300, 12).years.filter((year) => year.show);

    expect(shown.map((year) => year.year)).toContain(2022);
    shown.slice(1).forEach((year, index) => {
      expect(year.x - shown[index].x).toBeGreaterThanOrEqual(YEAR_WIDTH);
    });
  });

  it("keeps the last year label inside the SVG", () => {
    const { years, width } = geometryOf("perCapita", 300);

    expect(years[13].x + YEAR_WIDTH / 2).toBeLessThanOrEqual(width);
  });

  it("never draws narrower than 300 px and centres a single year", () => {
    const geometry = buildPibLineGeometry({
      width: 120,
      serie: [SERIE[0]],
      key: "pib",
      selectedIndex: 0,
    });
    const { left, right } = geometry.margin;

    expect(geometry.width).toBe(300);
    expect(geometry.years[0].x).toBe(left + (300 - left - right) / 2);
  });

  it("highlights no year when the filtered one is missing from the series", () => {
    const geometry = geometryOf("pib", 600, -1);

    expect(geometry.selectedX).toBeNull();
    expect(geometry.label).toBeNull();
    expect(geometry.years.some((year) => year.selected)).toBe(false);
  });

  it("rejects a selected index outside the series", () => {
    expect(() => geometryOf("pib", 600, 14)).toThrow(
      "selectedIndex 14 for a series of 14 years",
    );
  });

  it("spans four units instead of printing 0 on every tick for an all-zero series", () => {
    const serie = [
      { ano: 2022, pib: 0, perCapita: 0 },
      { ano: 2023, pib: 0, perCapita: 0 },
    ];
    const ticksOf = (key: "pib" | "perCapita") =>
      buildPibLineGeometry({ width: 600, serie, key, selectedIndex: 1 }).ticks;

    expect(ticksOf("pib").map((tick) => tick.value)).toEqual([
      0, 1e3, 2e3, 3e3, 4e3,
    ]);
    expect(ticksOf("perCapita").map((tick) => tick.value)).toEqual([
      0, 1e3, 2e3, 3e3, 4e3,
    ]);
  });
});

describe("pibLineSubtitle", () => {
  it("gives the place and the span the series has, without naming the series", () => {
    expect(pibLineSubtitle("Nordeste · Piauí", [2010, 2011, 2023])).toBe(
      "Nordeste · Piauí · 2010 a 2023",
    );
    expect(pibLineSubtitle("Piauí", [])).toBe("Piauí");
  });
});

describe("pibLineUnits", () => {
  it("puts the total in billions and the per capita in thousands", () => {
    expect(pibLineUnits(SERIE)).toEqual({
      pib: { divisor: 1e9, label: "bilhões" },
      perCapita: { divisor: 1e3, label: "mil" },
    });
  });

  it("drops the total to millions for a series under R$ 1 bi", () => {
    const serie = [{ ano: 2023, pib: 3.5e8, perCapita: 12000 }];

    expect(pibLineUnits(serie).pib).toEqual({
      divisor: 1e6,
      label: "milhões",
    });
  });
});
