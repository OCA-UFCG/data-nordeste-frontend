import { describe, expect, it } from "vitest";
import {
  buildCorRacaGeometry,
  buildSerieGeometry,
  pyramidBandLabel,
  describePyramidBand,
  formatCompactPeople,
  zeroBasedAxis,
  pyramidRows,
  sexColumns,
} from "@/features/panels/demografia/perfilCharts";

const NE_SERIE = [
  { ano: 2000, valor: 47_741_711 },
  { ano: 2010, valor: 53_081_950 },
  { ano: 2022, valor: 54_658_515 },
];

const COR_RACA = [
  { label: "Amarela", value: 69_000 },
  { label: "Branca", value: 14_590_000 },
  { label: "Indígena", value: 328_000 },
  { label: "Parda", value: 32_580_000 },
  { label: "Preta", value: 7_000_000 },
];

describe("formatCompactPeople", () => {
  it("writes millions and thousands like the prototype labels", () => {
    expect(formatCompactPeople(14_590_000)).toBe("15 Mi");
    expect(formatCompactPeople(69_000)).toBe("69 Mil");
    expect(formatCompactPeople(328_000)).toBe("328 Mil");
    expect(formatCompactPeople(54_658_515)).toBe("55 Mi");
    expect(formatCompactPeople(7_000_000)).toBe("7 Mi");
  });

  it("keeps values under one thousand as plain integers", () => {
    expect(formatCompactPeople(999)).toBe("999");
  });
});

describe("buildSerieGeometry grid span", () => {
  it("starts the gridlines at the axis and stops half the right margin short", () => {
    const geometry = buildSerieGeometry({ width: 800, points: NE_SERIE });

    expect(geometry.grid).toEqual({ x1: 54, x2: 782 });
  });
});

describe("pyramidBandLabel", () => {
  it("shortens closed and open bands", () => {
    expect(pyramidBandLabel("30 a 39 anos")).toBe("30-39");
    expect(pyramidBandLabel("80+ anos")).toBe("80+");
  });
});

describe("buildSerieGeometry", () => {
  it("is 290px tall with the 54px left margin at width 800", () => {
    const geometry = buildSerieGeometry({ width: 800, points: NE_SERIE });

    expect(geometry.height).toBe(290);
    expect(geometry.axisLabelX).toBe(46);
  });

  it("grows into the free height but never below the prototype's", () => {
    const tall = buildSerieGeometry({
      width: 800,
      height: 335,
      points: NE_SERIE,
    });
    const short = buildSerieGeometry({
      width: 800,
      height: 100,
      points: NE_SERIE,
    });

    expect(tall.height).toBe(335);
    expect(tall.yearLabelY).toBe(325);
    expect(short.height).toBe(290);
  });

  it("is 250px tall at width 400", () => {
    const geometry = buildSerieGeometry({ width: 400, points: NE_SERIE });

    expect(geometry.height).toBe(250);
  });

  it("labels the Northeast gridlines from top to bottom, down to zero", () => {
    const geometry = buildSerieGeometry({ width: 800, points: NE_SERIE });

    expect(geometry.gridLines.map((line) => line.label)).toEqual([
      "60 Mi",
      "40 Mi",
      "20 Mi",
      "0",
    ]);
  });

  it("draws one column per census, evenly spaced and rising with the value", () => {
    const { bars } = buildSerieGeometry({ width: 800, points: NE_SERIE });

    expect(bars).toHaveLength(3);
    expect(bars[1].x - bars[0].x).toBeCloseTo(bars[2].x - bars[1].x, 5);
    expect(bars[2].barHeight).toBeGreaterThan(bars[0].barHeight);
  });

  it("sits every column on the baseline and caps the width at 40px", () => {
    const geometry = buildSerieGeometry({ width: 800, points: NE_SERIE });

    for (const bar of geometry.bars) {
      expect(bar.barY + bar.barHeight).toBeCloseTo(geometry.base, 5);
      expect(bar.barWidth).toBe(40);
    }
  });

  it("keeps a value at the axis floor visible with at least 2px", () => {
    const { bars } = buildSerieGeometry({
      width: 800,
      points: [
        { ano: 2000, valor: 40_000_000 },
        { ano: 2010, valor: 60_000_000 },
      ],
    });

    expect(bars[0].barHeight).toBeGreaterThanOrEqual(2);
  });
});

describe("buildCorRacaGeometry", () => {
  it("uses the prototype sizes for wide and narrow widths", () => {
    const wide = buildCorRacaGeometry({ width: 800, bars: COR_RACA });
    const narrow = buildCorRacaGeometry({ width: 300, bars: COR_RACA });

    expect([wide.width, wide.height, wide.base]).toEqual([800, 270, 238]);
    expect([narrow.width, narrow.height]).toEqual([300, 250]);
  });

  it("drives the largest bar to the top and keeps the smallest at 2px", () => {
    const geometry = buildCorRacaGeometry({ width: 600, bars: COR_RACA });
    const largest = geometry.bars.find((bar) => bar.label === "Parda");
    const smallest = geometry.bars.find((bar) => bar.label === "Amarela");

    expect(largest?.barY).toBe(26);
    expect(smallest?.barHeight).toBe(2);
  });

  it("writes compact value labels", () => {
    const geometry = buildCorRacaGeometry({ width: 600, bars: COR_RACA });

    expect(geometry.bars.map((bar) => bar.valueLabel)).toEqual([
      "69 Mil",
      "15 Mi",
      "328 Mil",
      "33 Mi",
      "7 Mi",
    ]);
  });

  it("caps bar width at 40px and centers each bar in its slot", () => {
    const geometry = buildCorRacaGeometry({ width: 600, bars: COR_RACA });
    const [first] = geometry.bars;

    expect(first.barWidth).toBe(40);
    expect(first.barX).toBeCloseTo(first.x - 20, 5);
  });
});

describe("sexColumns", () => {
  it("orders mulheres before homens with share and ratio", () => {
    const [mulher, homem] = sexColumns({ mulheres: 60, homens: 40 });

    expect(mulher).toEqual({
      label: "Mulher",
      value: 60,
      share: 0.6,
      ratio: 1,
    });
    expect(homem.label).toBe("Homem");
    expect(homem.share).toBeCloseTo(0.4, 10);
    expect(homem.ratio).toBeCloseTo(40 / 60, 10);
  });

  it("returns zeros when there is no population", () => {
    const columns = sexColumns({ mulheres: 0, homens: 0 });

    expect(columns.map((column) => column.share)).toEqual([0, 0]);
  });
});

describe("pyramidRows", () => {
  const piramide = [
    { faixa: "0 a 9 anos", mulheres: 10, homens: 12 },
    { faixa: "30 a 39 anos", mulheres: 60, homens: 40 },
    { faixa: "80+ anos", mulheres: 30, homens: 20 },
  ];

  it("lists the oldest band first", () => {
    const rows = pyramidRows(piramide);

    expect(rows.map((row) => row.label)).toEqual([
      "80+ anos",
      "30 a 39 anos",
      "0 a 9 anos",
    ]);
  });

  it("scales both sexes by the largest bar across the pyramid", () => {
    const [oldest, , youngest] = pyramidRows(piramide);

    expect(oldest.mulheresRatio).toBeCloseTo(30 / 60, 10);
    expect(oldest.homensRatio).toBeCloseTo(20 / 60, 10);
    expect(youngest.homensRatio).toBeCloseTo(12 / 60, 10);
  });
});

describe("describePyramidBand", () => {
  it("titles a closed band and computes sex shares", () => {
    const [middle] = pyramidRows([
      { faixa: "30 a 39 anos", mulheres: 60, homens: 40 },
    ]);

    expect(describePyramidBand(middle)).toEqual({
      title: "Faixa de 30 a 39 anos",
      mulheresShare: 0.6,
      homensShare: 0.4,
    });
  });

  it("titles the open band as 80 anos ou mais", () => {
    const [oldest] = pyramidRows([
      { faixa: "80+ anos", mulheres: 30, homens: 20 },
    ]);

    expect(describePyramidBand(oldest).title).toBe("Faixa de 80 anos ou mais");
  });

  it("rejects an unknown band label with the expected shape", () => {
    const [row] = pyramidRows([{ faixa: "Total", mulheres: 1, homens: 1 }]);

    expect(() => describePyramidBand(row)).toThrow(/expected "A a B anos"/);
  });
});

describe("buildSerieGeometry labels", () => {
  // Regressão (revisão da PR #400): com 0 casas, os cinco ticks e os três
  // censos de Sergipe saíam todos "2 Mi".
  const sergipe = [
    { ano: 2000, valor: 1_784_475 },
    { ano: 2010, valor: 2_068_017 },
    { ano: 2022, valor: 2_210_004 },
  ];

  it("labels every grid line of Sergipe differently", () => {
    const labels = buildSerieGeometry({
      width: 800,
      points: sergipe,
    }).gridLines.map((line) => line.label);

    expect(new Set(labels).size).toBe(labels.length);
  });

  it("labels the census columns with one more digit than the axis", () => {
    const labels = buildSerieGeometry({
      width: 800,
      points: sergipe,
    }).bars.map((bar) => bar.label);

    expect(labels).toEqual(["1,78 Mi", "2,07 Mi", "2,21 Mi"]);
  });
});

describe("zeroBasedAxis", () => {
  it("starts at zero and stops at the first round tick above the data", () => {
    expect(zeroBasedAxis([47_741_711, 53_081_950, 54_658_515]).ticks).toEqual([
      0, 20e6, 40e6, 60e6,
    ]);
    expect(zeroBasedAxis([1_420_000, 1_540_000, 1_490_000]).ticks).toEqual([
      0, 0.5e6, 1e6, 1.5e6, 2e6,
    ]);
  });

  it("keeps a non-empty axis when every value is zero", () => {
    expect(zeroBasedAxis([0, 0]).max).toBeGreaterThan(0);
  });
});
