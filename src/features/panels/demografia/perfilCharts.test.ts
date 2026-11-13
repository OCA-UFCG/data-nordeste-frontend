import { describe, expect, it } from "vitest";
import {
  buildCorRacaGeometry,
  buildSerieGeometry,
  pyramidBandLabel,
  describePyramidBand,
  formatCompactPeople,
  niceAxis,
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

describe("niceAxis", () => {
  it("reproduces the Northeast axis 40..60 Mi in steps of 5 Mi", () => {
    const axis = niceAxis(NE_SERIE.map((point) => point.valor));

    expect(axis.min).toBe(40_000_000);
    expect(axis.max).toBe(60_000_000);
    expect(axis.ticks).toEqual([40e6, 45e6, 50e6, 55e6, 60e6]);
  });

  it("uses round thousands for a small municipality", () => {
    const axis = niceAxis([18_000, 21_000, 23_500]);

    expect(axis.min).toBe(15_000);
    expect(axis.max).toBe(25_000);
    expect(axis.ticks).toEqual([15_000, 17_500, 20_000, 22_500, 25_000]);
  });

  it("covers the data with headroom and returns ascending ticks", () => {
    const values = [3_000, 9_200];
    const axis = niceAxis(values, 5);

    expect(axis.min).toBeLessThanOrEqual(3_000);
    expect(axis.max).toBeGreaterThanOrEqual(9_200);
    expect(axis.ticks).toHaveLength(6);
    expect([...axis.ticks].sort((a, b) => a - b)).toEqual(axis.ticks);
  });

  it("rejects an empty list with the expected shape in the message", () => {
    expect(() => niceAxis([])).toThrow(/at least one value/);
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

  it("is 250px tall at width 400", () => {
    const geometry = buildSerieGeometry({ width: 400, points: NE_SERIE });

    expect(geometry.height).toBe(250);
  });

  it("labels the Northeast gridlines from top to bottom", () => {
    const geometry = buildSerieGeometry({ width: 800, points: NE_SERIE });

    expect(geometry.gridLines.map((line) => line.label)).toEqual([
      "60 Mi",
      "55 Mi",
      "50 Mi",
      "45 Mi",
      "40 Mi",
    ]);
  });

  it("places 2010 by its share of the time between the census years", () => {
    const geometry = buildSerieGeometry({ width: 800, points: NE_SERIE });
    const [first, middle, last] = geometry.points;

    expect(middle.x).toBeGreaterThan(first.x);
    expect(middle.x).toBeLessThan(last.x);

    // (2010 - 2000) / (2022 - 2000) of the 658px span after the 26px inset.
    expect(middle.x).toBeCloseTo(80 + (10 / 22) * 658, 2);
  });

  it("emits a path through every point", () => {
    const geometry = buildSerieGeometry({ width: 800, points: NE_SERIE });

    const [first] = geometry.points;

    expect(geometry.path.startsWith(`M${first.x.toFixed(1)} `)).toBe(true);
    expect(geometry.path.match(/[ML]/g)).toHaveLength(3);
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

describe("niceAxis near zero", () => {
  it("never extends a non-negative axis below zero", () => {
    const axis = niceAxis([120, 130]);

    expect(axis.min).toBeGreaterThanOrEqual(0);
    expect(axis.ticks).toHaveLength(5);
  });
});
