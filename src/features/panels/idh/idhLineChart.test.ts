import { describe, expect, it } from "vitest";
import { buildIdhLineGeometry } from "@/features/panels/idh/idhLineChart";

const YEARS = [2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021];
const idh = YEARS.map((_, index) => 0.675 + index * 0.003);
const idhAd = YEARS.map(() => 0.5);

const geometry = (width: number, selectedIndex = 9) =>
  buildIdhLineGeometry({
    width,
    years: YEARS,
    series: [
      { key: "idh", values: idh, labelOffset: -10 },
      { key: "idhAd", values: idhAd, labelOffset: 18 },
    ],
    selectedIndex,
  });

describe("buildIdhLineGeometry", () => {
  it("uses the prototype frame: 320 px tall and 0,400 to 0,800 on the axis", () => {
    const frame = geometry(800);

    expect(frame.height).toBe(320);
    expect(frame.ticks.map(({ value }) => value)).toEqual([
      0.4, 0.5, 0.6, 0.7, 0.8,
    ]);
    expect(frame.points.idh[0].x).toBe(54);
    expect(frame.points.idh[9].x).toBe(800 - 26);
  });

  it("labels the first, the chosen and the last year of each line", () => {
    const labels = geometry(800, 4).labels.idh;

    expect(labels.map(({ index }) => index)).toEqual([0, 4, 9]);
    expect(labels.map(({ anchor }) => anchor)).toEqual([
      "start",
      "middle",
      "end",
    ]);
  });

  it("shows every third year and a shorter chart when narrow", () => {
    const frame = geometry(360);

    expect(frame.height).toBe(280);
    expect(
      frame.years.filter(({ show }) => show).map(({ year }) => year),
    ).toEqual([2012, 2015, 2018, 2021]);
  });

  it("widens the axis when a real value leaves the 0,4 to 0,8 range", () => {
    const frame = buildIdhLineGeometry({
      width: 800,
      years: [2020, 2021],
      series: [{ key: "idh", values: [0.35, 0.82], labelOffset: -10 }],
      selectedIndex: 1,
    });

    expect(frame.ticks.map(({ value }) => value)).toEqual([
      0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9,
    ]);
  });
});
