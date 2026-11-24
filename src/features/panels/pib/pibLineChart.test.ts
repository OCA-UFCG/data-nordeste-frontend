import { describe, expect, it } from "vitest";
import {
  buildPibLineGeometry,
  PIB_LINE_MARKER_SPACE,
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

describe("buildPibLineGeometry", () => {
  it("uses the prototype frame and one round axis per series", () => {
    const geometry = buildPibLineGeometry({
      width: 820,
      serie: SERIE,
      selectedIndex: 13,
    });

    expect(geometry.height).toBe(360);
    expect(geometry.margin).toEqual({
      left: 72,
      right: 72,
      top: 44,
      bottom: 34,
    });
    expect(geometry.ticks.map((tick) => tick.pib)).toEqual([
      0, 4e11, 8e11, 1.2e12, 1.6e12,
    ]);
    expect(geometry.ticks.map((tick) => tick.perCapita)).toEqual([
      0, 10000, 20000, 30000, 40000,
    ]);
    expect(geometry.ticks[0].y).toBe(326);
    expect(geometry.ticks[4].y).toBe(44);
  });

  it("spreads the years from the left to the right margin", () => {
    const geometry = buildPibLineGeometry({
      width: 820,
      serie: SERIE,
      selectedIndex: 13,
    });

    expect(geometry.years[0].x).toBe(72);
    expect(geometry.years[13].x).toBe(748);
    expect(geometry.selectedX).toBe(748);
    expect(geometry.years.every((year) => year.show)).toBe(true);
    expect(geometry.years[13].selected).toBe(true);
  });

  it("keeps the per capita line below the total thanks to its headroom", () => {
    const { points } = buildPibLineGeometry({
      width: 820,
      serie: SERIE,
      selectedIndex: 13,
    });

    expect(points.perCapita[13].y).toBeGreaterThan(points.pib[13].y);
  });

  it("labels the higher series above and the lower one below, left of a late year", () => {
    const { labels, points } = buildPibLineGeometry({
      width: 820,
      serie: SERIE,
      selectedIndex: 13,
    });

    expect(labels?.pib).toMatchObject({
      anchor: "end",
      x: points.pib[13].x - 4,
      y: points.pib[13].y - 12,
    });
    expect(labels?.perCapita.y).toBe(points.perCapita[13].y + 36);
  });

  it("centres the labels of an earlier year without crossing the left axis", () => {
    const { labels, points } = buildPibLineGeometry({
      width: 820,
      serie: SERIE,
      selectedIndex: 0,
    });

    expect(labels?.pib).toMatchObject({ anchor: "middle", x: 72 + 44 });
    expect(labels?.perCapita.y).toBe(points.perCapita[0].y + 22);
  });

  it.each([820, 560])(
    "keeps the axis titles above the value label of the top point at %i px",
    (width) => {
      // Altura de maiúscula do rótulo (13 px) com o contorno branco, e o
      // descendente do "(" no título (12 px).
      const LABEL_TOP = 12;
      const TITLE_DESCENT = 4;
      const geometry = buildPibLineGeometry({
        width,
        serie: [
          { ano: 2022, pib: 8e11, perCapita: 1e4 },
          { ano: 2023, pib: 1.6e12, perCapita: 1.1e4 },
        ],
        selectedIndex: 1,
      });
      const label = geometry.labels?.pib;

      expect(label?.y).toBe(geometry.margin.top - 12);
      expect((label?.y ?? 0) - LABEL_TOP).toBeGreaterThan(
        geometry.titles.pib.y + TITLE_DESCENT,
      );
    },
  );

  it("shrinks below 560 px and shows one year in four", () => {
    const geometry = buildPibLineGeometry({
      width: 340,
      serie: SERIE,
      selectedIndex: 13,
    });

    expect(geometry.narrow).toBe(true);
    expect(geometry.height).toBe(320);
    expect(
      geometry.years.filter((year) => year.show).map((year) => year.year),
    ).toEqual([2011, 2015, 2019, 2023]);
  });

  it("shows the selected year at narrow width, hiding a neighbour it would touch", () => {
    const geometry = buildPibLineGeometry({
      width: 300,
      serie: SERIE,
      selectedIndex: 12,
    });
    const shown = geometry.years.filter((year) => year.show);

    expect(shown.map((year) => year.year)).toEqual([2011, 2015, 2019, 2022]);
    shown.slice(1).forEach((year, index) => {
      expect(year.x - shown[index].x).toBeGreaterThanOrEqual(YEAR_WIDTH);
    });
  });

  it("never draws narrower than 300 px and centres a single year", () => {
    const geometry = buildPibLineGeometry({
      width: 120,
      serie: [SERIE[0]],
      selectedIndex: 0,
    });

    const { left, right } = geometry.margin;

    expect(geometry.width).toBe(300);
    expect(geometry.years[0].x).toBe(left + (300 - left - right) / 2);
  });

  it("highlights no year when the filtered one is missing from the series", () => {
    const geometry = buildPibLineGeometry({
      width: 820,
      serie: SERIE,
      selectedIndex: -1,
    });

    expect(geometry.selectedX).toBeNull();
    expect(geometry.labels).toBeNull();
    expect(geometry.years.some((year) => year.selected)).toBe(false);
  });

  it("rejects a selected index outside the series", () => {
    expect(() =>
      buildPibLineGeometry({ width: 820, serie: SERIE, selectedIndex: 14 }),
    ).toThrow("selectedIndex 14 for a series of 14 years");
  });
});

// Larguras medidas em Inter (PROTO_CHART_FONT) com folga: título 12 px
// semibold até 128 px ("PIB per capita (R$ mil)"), valor 13 px bold até
// 88 px ("R$ 999,99 Mil"), dígito do eixo até 0,65 em em 11,5 px, "2023" em
// bold 30 px. Aqui por caractere (~20% acima do medido: 0,46 em no título e
// 0,52 em no valor), para valer com qualquer texto.
const TITLE_CHAR = 0.55 * 12;
const VALUE_CHAR = 0.6 * 13;
const TICK_CHAR = 0.65 * 11.5;
const YEAR_WIDTH = 32;
const LONGEST_TITLE = "PIB per capita (R$ mil)".length;
const LONGEST_VALUE = "R$ 999,99 Mil".length;

// Fonte de 11,5 px: altura de maiúscula ~8,5 px acima da linha de base.
const TICK_CAP = 9;

describe("buildPibLineGeometry at narrow width", () => {
  const geometryAt300 = (serie: PibYearPoint[]) =>
    buildPibLineGeometry({ width: 300, serie, selectedIndex: 13 });

  it("moves the selected values to a two-row header instead of the lines", () => {
    const geometry = geometryAt300(SERIE);

    expect(geometry.labels).toBeNull();
    expect(geometry.readouts).toEqual({
      pib: { x: 300, y: geometry.titles.pib.y, value: SERIE[13].pib },
      perCapita: {
        x: 300,
        y: geometry.titles.perCapita.y,
        value: SERIE[13].perCapita,
      },
    });
  });

  it("fits title and value on each header row without touching at 300 px", () => {
    const { titles, readouts } = geometryAt300(SERIE);

    for (const key of ["pib", "perCapita"] as const) {
      const titleEnd = titles[key].x + LONGEST_TITLE * TITLE_CHAR;
      const valueStart = (readouts?.[key].x ?? 0) - LONGEST_VALUE * VALUE_CHAR;

      expect(titles[key].x).toBeGreaterThanOrEqual(PIB_LINE_MARKER_SPACE);
      expect(valueStart - titleEnd).toBeGreaterThanOrEqual(4);
      expect(readouts?.[key].x).toBeLessThanOrEqual(300);
    }
  });

  it("stacks the header rows above the plot and its top tick", () => {
    const { titles, margin } = geometryAt300(SERIE);
    const DESCENT = 4;
    const ROW_HEIGHT = 15;

    expect(titles.perCapita.y - titles.pib.y).toBeGreaterThanOrEqual(
      ROW_HEIGHT,
    );

    // Ponto escolhido (raio 6) no topo do eixo e rótulo da marca de cima.
    expect(margin.top - 6).toBeGreaterThan(titles.perCapita.y + DESCENT);
    expect(margin.top + 4 - TICK_CAP).toBeGreaterThan(
      titles.perCapita.y + DESCENT,
    );
  });

  it.each([
    ["Nordeste", SERIE, "1.600", "40"],
    [
      "a small municipality",
      SERIE.map((point) => ({ ...point, pib: point.pib / 1e4 })),
      "160",
      "40",
    ],
  ])(
    "keeps the tick labels of %s inside the SVG and wider plot than before",
    (_, serie, pibTick, perCapitaTick) => {
      const { margin, width } = geometryAt300(serie);
      const TICK_OFFSET = 8;

      expect(
        margin.left - TICK_OFFSET - pibTick.length * TICK_CHAR,
      ).toBeGreaterThanOrEqual(0);
      expect(
        width - margin.right + TICK_OFFSET + perCapitaTick.length * TICK_CHAR,
      ).toBeLessThanOrEqual(width);

      // Antes: 56 + 52 px de margem.
      expect(margin.left + margin.right).toBeLessThan(56 + 52 - 20);
    },
  );

  it("keeps the last year label inside the SVG", () => {
    const { years, width } = geometryAt300(SERIE);

    expect(years[13].x + YEAR_WIDTH / 2).toBeLessThanOrEqual(width);
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

describe("buildPibLineGeometry with an all-zero series", () => {
  it("spans four units on each axis instead of printing 0 on every tick", () => {
    const serie = [
      { ano: 2022, pib: 0, perCapita: 0 },
      { ano: 2023, pib: 0, perCapita: 0 },
    ];
    const { ticks } = buildPibLineGeometry({
      width: 820,
      serie,
      selectedIndex: 1,
    });

    expect(ticks.map((tick) => tick.pib)).toEqual([0, 1e3, 2e3, 3e3, 4e3]);
    expect(ticks.map((tick) => tick.perCapita)).toEqual([
      0, 1e3, 2e3, 3e3, 4e3,
    ]);
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
