import { describe, expect, it } from "vitest";
import {
  buildIdhLineGeometry,
  stepIdhYear,
} from "@/features/panels/idh/idhLineChart";

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

  it("highlights no year when the filtered year is missing from the series", () => {
    const frame = geometry(800, -1);

    expect(frame.selectedX).toBeNull();
    expect(frame.years.some(({ selected }) => selected)).toBe(false);
    expect(frame.labels.idh.map(({ index }) => index)).toEqual([0, 9]);
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

describe("stepIdhYear", () => {
  const GAPPED = [2018, 2019, 2021];

  it("steps one year with the arrows when the year is in the series", () => {
    expect(stepIdhYear(GAPPED, 2019, "ArrowRight")).toBe(2021);
    expect(stepIdhYear(GAPPED, 2019, "ArrowLeft")).toBe(2018);
  });

  it("goes to the nearest neighbour when the year is missing", () => {
    expect(stepIdhYear(GAPPED, 2020, "ArrowLeft")).toBe(2019);
    expect(stepIdhYear(GAPPED, 2020, "ArrowRight")).toBe(2021);
  });

  it("stays put past the ends and on unrelated keys", () => {
    expect(stepIdhYear(GAPPED, 2022, "ArrowRight")).toBeNull();
    expect(stepIdhYear(GAPPED, 2021, "ArrowRight")).toBeNull();
    expect(stepIdhYear(GAPPED, 2020, "Enter")).toBeNull();
  });

  it("jumps to the ends with Home and End", () => {
    expect(stepIdhYear(GAPPED, 2020, "Home")).toBe(2018);
    expect(stepIdhYear(GAPPED, 2020, "End")).toBe(2021);
  });
});
